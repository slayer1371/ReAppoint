import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return Response.json({ error: "Missing confirmation token" }, { status: 400 });
  }

  try {
    // Token format: appointmentId_timestamp
    const [appointmentId, timestamp] = token.split("_");

    // Verify token hasn't expired (24h window)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const tokenAgeHours = (now - tokenTime) / (1000 * 60 * 60);

    if (tokenAgeHours > 24) {
      return Response.json(
        { error: "Confirmation link expired. Your appointment has been cancelled." },
        { status: 400 }
      );
    }

    // Find appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: { include: { user: true } }, service: true }
    });

    if (!appointment) {
      return Response.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Mark as confirmed
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { 
        pollResponse: "confirmed",
        status: "confirmed"
      }
    });

    // Redirect to success page
    return Response.redirect(
      `${process.env.NEXTAUTH_URL}/appointment-confirmed?id=${appointmentId}`,
      303
    );
  } catch (error) {
    console.error("Confirmation error:", error);
    return Response.json(
      { error: "Failed to confirm appointment" },
      { status: 500 }
    );
  }
}
