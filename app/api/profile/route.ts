import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// app/api/profile/route.ts
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  if (session.user.role === "client") {
    let profile = await prisma.clientProfile.findUnique({
      where: { userId: session.user.id }
    })
    
    // Auto-create profile if it doesn't exist (for OAuth users)
    if (!profile) {
      profile = await prisma.clientProfile.create({
        data: { userId: session.user.id }
      })
    }
    
    return Response.json({ role: "client", data: profile })
  }
  
  if (session.user.role === "business") {
    const profile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id }
    })
    return Response.json({ role: "business", data: profile })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })
    
  const body = await req.json()

  if (session.user.role === "client") {
    const { phone } = body
    const updatedProfile = await prisma.clientProfile.update({
      where: { userId: session.user.id },
      data: { phone }
    })
    return Response.json({ role: "client", data: updatedProfile })
  }
  
  if (session.user.role === "business") {
    const { businessName, businessType, phone } = body
    const updatedProfile = await prisma.businessProfile.update({
      where: { userId: session.user.id },
      data: { businessName, businessType, phone }
    })
    return Response.json({ role: "business", data: updatedProfile })
  }
}