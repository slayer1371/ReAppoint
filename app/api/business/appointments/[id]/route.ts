import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "business") {
    return Response.json(
      { error: "Only businesses can update appointments" },
      { status: 403 }
    );
  }

  try {
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!businessProfile) {
      return Response.json({ error: "Business profile not found" }, { status: 404 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!appointment) {
      return Response.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.businessId !== businessProfile.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !["completed", "no_show"].includes(status)) {
      return Response.json(
        { error: "Invalid status. Must be 'completed' or 'no_show'" },
        { status: 400 }
      );
    }

    // Update the appointment
    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: { client: true, service: true }
    });

    // Update client profile based on status
    if (status === "completed") {
      await prisma.clientProfile.update({
        where: { id: appointment.clientId },
        data: {
          completedAppointments: { increment: 1 },
          lastAppointmentAt: new Date()
        }
      });
    } else if (status === "no_show") {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { id: appointment.clientId }
      });

      if (clientProfile) {
        const newNoShowCount = clientProfile.noShowCount + 1;
        const newNoShowRate =
          (newNoShowCount / clientProfile.totalAppointments) * 100;

        // Recalculate risk profile
        const calculateRiskProfile = (
          cancelRate: number,
          noShowRate: number,
          totalAppointments: number
        ) => {
          if (totalAppointments < 3) return "new";
          if (cancelRate <= 10 && noShowRate <= 5) return "reliable";
          if (cancelRate > 40 || noShowRate > 10) return "high_risk";
          return "at_risk";
        };

        const newRiskProfile = calculateRiskProfile(
          clientProfile.cancelRate,
          newNoShowRate,
          clientProfile.totalAppointments
        );

        await prisma.clientProfile.update({
          where: { id: appointment.clientId },
          data: {
            noShowCount: newNoShowCount,
            noShowRate: newNoShowRate,
            riskProfile: newRiskProfile
          }
        });
      }
    }

    return Response.json(updated);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return Response.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}
