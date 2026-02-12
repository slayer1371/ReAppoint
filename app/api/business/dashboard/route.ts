import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "business") {
    return Response.json(
      { error: "Only businesses can access dashboard" },
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

    // Get appointment stats for this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const appointmentsThisMonth = await prisma.appointment.findMany({
      where: {
        businessId: businessProfile.id,
        datetime: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    const completedAppointments = appointmentsThisMonth.filter(
      a => a.status === "completed"
    ).length;
    const cancelledAppointments = appointmentsThisMonth.filter(
      a => a.status === "cancelled"
    ).length;
    const noShowAppointments = appointmentsThisMonth.filter(
      a => a.status === "no_show"
    ).length;
    const confirmedAppointments = appointmentsThisMonth.filter(
      a => a.status === "confirmed"
    ).length;

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        businessId: businessProfile.id,
        datetime: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        client: true,
        service: true
      },
      orderBy: { datetime: "asc" }
    });

    // Get services count
    const servicesCount = await prisma.service.count({
      where: { businessId: businessProfile.id }
    });

    // Get waitlist count
    const waitlistCount = await prisma.waitlist.count({
      where: {
        businessId: businessProfile.id,
        status: "waiting"
      }
    });

    // Calculate monthly revenue
    const totalRevenue = appointmentsThisMonth
      .filter(a => a.status === "completed")
      .reduce((sum, a) => sum + a.price, 0);

    return Response.json({
      businessProfile,
      stats: {
        thisMonth: {
          totalAppointments: appointmentsThisMonth.length,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          noShow: noShowAppointments,
          confirmed: confirmedAppointments,
          totalRevenue
        },
        servicesCount,
        waitlistCount
      },
      todayAppointments,
      appointmentsThisMonth: appointmentsThisMonth.length
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
