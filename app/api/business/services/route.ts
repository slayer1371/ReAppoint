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
      { error: "Only businesses can view services" },
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

    const services = await prisma.service.findMany({
      where: { businessId: businessProfile.id },
      orderBy: { name: "asc" }
    });

    return Response.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return Response.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "business") {
    return Response.json(
      { error: "Only businesses can create services" },
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

    const body = await req.json();
    const { name, durationMins, basePrice, noShowRiskMult } = body;

    if (!name || !durationMins || !basePrice) {
      return Response.json(
        { error: "Missing required fields: name, durationMins, basePrice" },
        { status: 400 }
      );
    }

    if (durationMins < 15 || durationMins > 480) {
      return Response.json(
        { error: "Duration must be between 15 and 480 minutes" },
        { status: 400 }
      );
    }

    if (basePrice < 0) {
      return Response.json(
        { error: "Price must be 0 or greater" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        businessId: businessProfile.id,
        name,
        durationMins: parseInt(durationMins),
        basePrice: parseFloat(basePrice),
        noShowRiskMult: noShowRiskMult ? parseFloat(noShowRiskMult) : 1.0
      }
    });

    return Response.json(service, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return Response.json(
        { error: "A service with this name already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating service:", error);
    return Response.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
