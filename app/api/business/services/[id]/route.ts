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
      { error: "Only businesses can update services" },
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

    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) {
      return Response.json({ error: "Service not found" }, { status: 404 });
    }

    if (service.businessId !== businessProfile.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, durationMins, basePrice, noShowRiskMult } = body;

    if (durationMins && (durationMins < 15 || durationMins > 480)) {
      return Response.json(
        { error: "Duration must be between 15 and 480 minutes" },
        { status: 400 }
      );
    }

    if (basePrice !== undefined && basePrice < 0) {
      return Response.json(
        { error: "Price must be 0 or greater" },
        { status: 400 }
      );
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(durationMins && { durationMins: parseInt(durationMins) }),
        ...(basePrice !== undefined && { basePrice: parseFloat(basePrice) }),
        ...(noShowRiskMult !== undefined && { noShowRiskMult: parseFloat(noShowRiskMult) })
      }
    });

    return Response.json(updated);
  } catch (error: any) {
    if (error.code === "P2002") {
      return Response.json(
        { error: "A service with this name already exists" },
        { status: 409 }
      );
    }
    console.error("Error updating service:", error);
    return Response.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      { error: "Only businesses can delete services" },
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

    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) {
      return Response.json({ error: "Service not found" }, { status: 404 });
    }

    if (service.businessId !== businessProfile.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if service has any appointments
    const appointmentsCount = await prisma.appointment.count({
      where: { serviceId: id }
    });

    if (appointmentsCount > 0) {
      return Response.json(
        { error: "Cannot delete service with existing appointments" },
        { status: 400 }
      );
    }

    await prisma.service.delete({ where: { id } });

    return Response.json({ success: true, message: "Service deleted" });
  } catch (error) {
    console.error("Error deleting service:", error);
    return Response.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
