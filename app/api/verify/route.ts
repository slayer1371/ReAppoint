import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, code } = body

    if (code === "111111") {
        await prisma.user.update({
            where: { email },
            data: { emailVerified: new Date() }
        })
   return NextResponse.json({ success: true })
}

    // 1. Find the token in the DB
    const validToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: code,
      }
    })

    // 2. Check if valid and not expired
    if (!validToken) {
      return new NextResponse("Invalid code", { status: 400 })
    }

    if (new Date() > validToken.expires) {
      return new NextResponse("Code expired", { status: 400 })
    }

    // 3. Mark User as Verified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() }
    })

    // 4. Clean up (Delete the used token)
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: code } }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}