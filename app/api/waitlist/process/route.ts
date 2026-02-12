import { prisma } from "@/lib/prisma";

// Internal endpoint to process waitlist queue after cancellation
export async function POST(req: Request) {
  const body = await req.json();
  const { businessId, serviceId } = body;

  if (!businessId || !serviceId) {
    return Response.json(
      { error: "businessId and serviceId are required" },
      { status: 400 }
    );
  }

  try {
    // Get the first person in waiting status
    const nextPerson = await prisma.waitlist.findFirst({
      where: {
        businessId,
        serviceId,
        status: "waiting",
        position: 1
      }
    });

    if (!nextPerson) {
      return Response.json({ 
        success: true, 
        message: "No one waiting in queue" 
      });
    }

    // Mark them as offered with 24-hour expiration
    const updated = await prisma.waitlist.update({
      where: { id: nextPerson.id },
      data: {
        status: "offered",
        offerExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      },
      include: {
        client: true,
        business: true,
        service: true
      }
    });

    // TODO: Send email notification to client about the offer
    console.log(`Waitlist offer sent to ${updated.client.id} for ${updated.service.name}`);

    return Response.json({
      success: true,
      message: "Waitlist offer sent",
      data: updated
    });
  } catch (error) {
    console.error("Error processing waitlist queue:", error);
    return Response.json(
      { error: "Failed to process queue" },
      { status: 500 }
    );
  }
}
