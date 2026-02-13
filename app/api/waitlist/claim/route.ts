import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/lib/mail";

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
        { error: "Offer expired. Please rejoin the waitlist." },
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

    // Check if offer has expired
    if (waitlistEntry.offerExpiresAt && new Date() > waitlistEntry.offerExpiresAt) {
      return Response.json(
        { error: "This offer has expired" },
        { status: 400 }
      );
    }

    // Make sure offeredDatetime is set
    if (!waitlistEntry.offeredDatetime) {
      return Response.json(
        { error: "Offer details not found" },
        { status: 400 }
      );
    }

    // Create new appointment for the waitlist client with the offered datetime
    const newAppointment = await prisma.appointment.create({
      data: {
        businessId: waitlistEntry.businessId,
        clientId: waitlistEntry.clientId,
        serviceId: waitlistEntry.serviceId,
        datetime: waitlistEntry.offeredDatetime, // Use the offered datetime
        durationMins: waitlistEntry.service.durationMins,
        price: waitlistEntry.service.basePrice,
        bookingWindowDays: Math.ceil(
          (waitlistEntry.offeredDatetime.getTime() - now) / (1000 * 60 * 60 * 24)
        ),
        appointmentHour: waitlistEntry.offeredDatetime.getHours(),
        isReturningClient: waitlistEntry.client.totalAppointments > 0,
        aiRiskScore: 20, // Lower risk since they confirmed interest via waitlist
        riskLevel: "LOW",
        timezone: waitlistEntry.timezone, // Use the timezone from waitlist entry
        status: "confirmed",
        pollResponse: "confirmed" // Auto-confirm since they claimed the offer
      },
      include: {
        client: { include: { user: true } },
        service: true,
        business: true
      }
    });

    // Update client stats
    await prisma.clientProfile.update({
      where: { id: waitlistEntry.clientId },
      data: { totalAppointments: { increment: 1 } }
    });

    // Mark waitlist entry as accepted
    await prisma.waitlist.update({
      where: { id: waitlistId },
      data: { status: "accepted" }
    });

    // Send confirmation email
    try {
      await sendBookingConfirmationEmail(
        waitlistEntry.client.user.email!,
        waitlistEntry.client.user.name || "Client",
        waitlistEntry.business.businessName,
        waitlistEntry.service.name,
        newAppointment.datetime,
        waitlistEntry.service.durationMins,
        waitlistEntry.service.basePrice,
        waitlistEntry.timezone
      );
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
    }

    // Redirect to confirmation page
    return Response.redirect(
      `${process.env.NEXTAUTH_URL}/appointment-confirmed?id=${newAppointment.id}&from=waitlist`,
      303
    );
  } catch (error) {
    console.error("Claim error:", error);
    return Response.json(
      { error: "Failed to claim slot" },
      { status: 500 }
    );
  }
}
