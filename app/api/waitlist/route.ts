import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Get user's waitlist entries
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "client") {
    return Response.json(
      { error: "Only clients can view waitlist" },
      { status: 403 }
    );
  }

  let clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id }
  });

  // Auto-create profile if it doesn't exist (for OAuth users)
  if (!clientProfile) {
    clientProfile = await prisma.clientProfile.create({
      data: { userId: session.user.id }
    });
  }

  const waitlistEntries = await prisma.waitlist.findMany({
    where: { clientId: clientProfile.id },
    include: {
      business: true,
      service: true
    },
    orderBy: { position: "asc" }
  });

  return Response.json(waitlistEntries);
}

// Join waitlist
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "client") {
    return Response.json(
      { error: "Only clients can join waitlist" },
      { status: 403 }
    );
  }

  let clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id }
  });

  // Auto-create profile if it doesn't exist (for OAuth users)
  if (!clientProfile) {
    clientProfile = await prisma.clientProfile.create({
      data: { userId: session.user.id }
    });
  }

  const body = await req.json();
  const { businessId, serviceId, timezone } = body;

  if (!businessId || !serviceId) {
    return Response.json(
      { error: "businessId and serviceId are required" },
      { status: 400 }
    );
  }

  // Check if client already on this waitlist
  const existing = await prisma.waitlist.findUnique({
    where: {
      clientId_businessId_serviceId: {
        clientId: clientProfile.id,
        businessId,
        serviceId
      }
    }
  });

  if (existing) {
    return Response.json(
      { error: "Already on this waitlist" },
      { status: 409 }
    );
  }

  // Get highest position for this business/service
  const lastEntry = await prisma.waitlist.findFirst({
    where: { businessId, serviceId },
    orderBy: { position: "desc" }
  });

  const newPosition = (lastEntry?.position || 0) + 1;

  // Create waitlist entry
  const waitlistEntry = await prisma.waitlist.create({
    data: {
      clientId: clientProfile.id,
      businessId,
      serviceId,
      position: newPosition,
      timezone: timezone || "America/New_York", // Store user's timezone
      status: "waiting"
    },
    include: {
      business: true,
      service: true
    }
  });

  return Response.json(waitlistEntry, { status: 201 });
}
