import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Delete/Leave waitlist
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id }
  });

  // Auto-create profile if it doesn't exist (for OAuth users)
  if (!clientProfile) {
    clientProfile = await prisma.clientProfile.create({
      data: { userId: session.user.id }
    });
  }

  const waitlistEntry = await prisma.waitlist.findUnique({
    where: { id }
  });

  if (!waitlistEntry) {
    return Response.json({ error: "Waitlist entry not found" }, { status: 404 });
  }

  // Verify ownership
  if (waitlistEntry.clientId !== clientProfile.id) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Delete and reorder remaining entries
  await prisma.$transaction([
    // Delete the entry
    prisma.waitlist.delete({
      where: { id }
    }),
    // Decrement position for all entries after this one
    prisma.waitlist.updateMany({
      where: {
        businessId: waitlistEntry.businessId,
        serviceId: waitlistEntry.serviceId,
        position: { gt: waitlistEntry.position }
      },
      data: {
        position: { decrement: 1 }
      }
    })
  ]);

  return Response.json({ success: true, message: "Left waitlist" });
}

// Respond to waitlist offer (accept/decline)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id }
  });

  // Auto-create profile if it doesn't exist (for OAuth users)
  if (!clientProfile) {
    clientProfile = await prisma.clientProfile.create({
      data: { userId: session.user.id }
    });
  }

  const body = await req.json();
  const { response } = body; // "accept" or "decline"

  if (!response || !["accept", "decline"].includes(response)) {
    return Response.json(
      { error: "Response must be 'accept' or 'decline'" },
      { status: 400 }
    );
  }

  const waitlistEntry = await prisma.waitlist.findUnique({
    where: { id },
    include: { service: true }
  });

  if (!waitlistEntry) {
    return Response.json({ error: "Waitlist entry not found" }, { status: 404 });
  }

  // Verify ownership
  if (waitlistEntry.clientId !== clientProfile.id) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Check if offer is still valid
  if (waitlistEntry.status !== "offered") {
    return Response.json(
      { error: "This entry is not currently offered" },
      { status: 400 }
    );
  }

  if (
    waitlistEntry.offerExpiresAt &&
    new Date() > waitlistEntry.offerExpiresAt
  ) {
    return Response.json(
      { error: "Offer has expired" },
      { status: 400 }
    );
  }

  if (response === "decline") {
    // Delete the declined entry and shift remaining entries up
    const declinedPosition = waitlistEntry.position;
    
    await prisma.$transaction([
      // Delete the declined entry
      prisma.waitlist.delete({
        where: { id }
      }),
      // Shift everyone after this position up by 1
      prisma.waitlist.updateMany({
        where: {
          businessId: waitlistEntry.businessId,
          serviceId: waitlistEntry.serviceId,
          position: { gt: declinedPosition }
        },
        data: {
          position: { decrement: 1 }
        }
      })
    ]);

    // Offer goes to next person in queue (now at position 1)
    const nextPerson = await prisma.waitlist.findFirst({
      where: {
        businessId: waitlistEntry.businessId,
        serviceId: waitlistEntry.serviceId,
        status: "waiting",
        position: 1
      }
    });

    if (nextPerson) {
      await prisma.waitlist.update({
        where: { id: nextPerson.id },
        data: {
          status: "offered",
          offerExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      return Response.json({ 
        success: true, 
        message: "Offer declined. Next person in queue has been offered.",
        data: {
          nextOfferedTo: nextPerson.id
        }
      });
    }

    return Response.json({ 
      success: true, 
      message: "Offer declined. No one else in queue." 
    });
  }

  if (response === "accept") {
    // Mark as accepted and return booking details
    const updated = await prisma.waitlist.update({
      where: { id },
      data: { status: "accepted" },
      include: { business: true, service: true }
    });

    return Response.json({ 
      success: true, 
      message: "Offer accepted! Redirecting to book your appointment...",
      data: {
        waitlistId: updated.id,
        businessId: updated.businessId,
        businessName: updated.business.businessName,
        serviceId: updated.serviceId,
        serviceName: updated.service.name,
        bookingUrl: `/appointments/create-appointment?waitlistId=${updated.id}&businessId=${updated.businessId}&serviceId=${updated.serviceId}`
      }
    });
  }
}
