import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "business") {
    return Response.json(
      { error: "Only businesses can access appointments" },
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

    // Get all appointments for this business
    const appointments = await prisma.appointment.findMany({
      where: { businessId: businessProfile.id },
      include: {
        client: {
          include: {
            user: true
          }
        },
        service: true
      },
      orderBy: { datetime: "desc" }
    });

    return Response.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return Response.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}
