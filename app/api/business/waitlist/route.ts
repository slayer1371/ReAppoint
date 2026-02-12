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
      { error: "Only businesses can view waitlist" },
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

    const waitlistEntries = await prisma.waitlist.findMany({
      where: { businessId: businessProfile.id },
      include: {
        client: {
          include: {
            user: true
          }
        },
        service: true
      },
      orderBy: { position: "asc" }
    });

    return Response.json(waitlistEntries);
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    return Response.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}
