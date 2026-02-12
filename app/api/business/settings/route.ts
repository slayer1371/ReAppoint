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
      { error: "Only businesses can view settings" },
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

    return Response.json({
      businessName: businessProfile.businessName,
      businessType: businessProfile.businessType,
      phone: businessProfile.phone,
      noShowThreshold: businessProfile.noShowThreshold,
      requireDepositForHighRisk: businessProfile.requireDepositForHighRisk,
      settings: businessProfile.settings || {
        businessHours: {
          monday: { open: 9, close: 18 },
          tuesday: { open: 9, close: 18 },
          wednesday: { open: 9, close: 18 },
          thursday: { open: 9, close: 18 },
          friday: { open: 9, close: 18 },
          saturday: { open: 10, close: 16 },
          sunday: null
        },
        holidays: [],
        cancellationPolicy: "24 hours notice required",
        timezone: "UTC"
      }
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return Response.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "business") {
    return Response.json(
      { error: "Only businesses can update settings" },
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
    const {
      businessName,
      businessType,
      phone,
      noShowThreshold,
      requireDepositForHighRisk,
      settings
    } = body;

    const updated = await prisma.businessProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(businessName && { businessName }),
        ...(businessType && { businessType }),
        ...(phone && { phone }),
        ...(noShowThreshold !== undefined && { noShowThreshold: parseInt(noShowThreshold) }),
        ...(requireDepositForHighRisk !== undefined && { requireDepositForHighRisk }),
        ...(settings && { settings: JSON.stringify(settings) })
      }
    });

    return Response.json({
      businessName: updated.businessName,
      businessType: updated.businessType,
      phone: updated.phone,
      noShowThreshold: updated.noShowThreshold,
      requireDepositForHighRisk: updated.requireDepositForHighRisk,
      settings: updated.settings ? JSON.parse(updated.settings as string) : null
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return Response.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
