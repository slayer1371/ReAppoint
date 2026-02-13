import { prisma } from "@/lib/prisma";
import { sendWaitlistOfferEmail } from "@/lib/mail";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return Response.json({ error: "Missing offer token" }, { status: 400 });
  }

  try {
    // Token format: waitlistId_timestamp
    const [waitlistId, timestamp] = token.split("_");

    // Verify token hasn't expired (24h window)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const tokenAgeHours = (now - tokenTime) / (1000 * 60 * 60);

    if (tokenAgeHours > 24) {
      return Response.json(
        { error: "Offer has already expired" },
        { status: 400 }
      );
    }

    // Find waitlist entry
    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { id: waitlistId },
      include: {
        client: { include: { user: true } },
        service: true,
        business: true
      }
    });

    if (!waitlistEntry) {
      return Response.json({ error: "Offer not found" }, { status: 404 });
    }

    // Verify offer status
    if (waitlistEntry.status !== "offered") {
      return Response.json(
        { error: "This offer is no longer available" },
        { status: 400 }
      );
    }

    // Mark as declined
    await prisma.waitlist.update({
      where: { id: waitlistId },
      data: { status: "declined" }
    });

    // ===== Offer to next person in queue =====
    const nextInQueue = await prisma.waitlist.findFirst({
      where: {
        businessId: waitlistEntry.businessId,
        serviceId: waitlistEntry.serviceId,
        status: "waiting",
        position: { gt: waitlistEntry.position } // Next in line
      },
      orderBy: { position: "asc" },
      include: {
        client: { include: { user: true } }
      }
    });

    if (nextInQueue && waitlistEntry.offeredDatetime) {
      try {
        // Create offer token
        const offerToken = `${nextInQueue.id}_${Date.now()}`;

        // Send offer email to next person using waitlist's timezone
        await sendWaitlistOfferEmail(
          nextInQueue.client.user.email!,
          nextInQueue.client.user.name || "Client",
          waitlistEntry.business.businessName,
          waitlistEntry.service.name,
          waitlistEntry.offeredDatetime,
          offerToken,
          waitlistEntry.timezone
        );

        // Update waitlist entry to offered status
        const offerDeadline = new Date(now + 24 * 60 * 60 * 1000);
        await prisma.waitlist.update({
          where: { id: nextInQueue.id },
          data: {
            status: "offered",
            offerExpiresAt: offerDeadline,
            offeredDatetime: waitlistEntry.offeredDatetime,
            timezone: waitlistEntry.timezone // Inherit timezone from declining user
          }
        });

        console.log(`Offer declined by ${waitlistId}, offered to next: ${nextInQueue.id}`);
      } catch (error) {
        console.error(`Failed to offer to next person:`, error);
      }
    }

    // Redirect to declined page
    return Response.redirect(
      `${process.env.NEXTAUTH_URL}/waitlist-declined?id=${waitlistId}`,
      303
    );
  } catch (error) {
    console.error("Decline error:", error);
    return Response.json(
      { error: "Failed to decline offer" },
      { status: 500 }
    );
  }
}
