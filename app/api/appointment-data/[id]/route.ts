import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    if (session.user.role !== "client") {
        return Response.json({ error: "Only clients can view appointments" }, { status: 403 })
    }

    let clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: session.user.id }
    })
    
    // Auto-create profile if it doesn't exist (for OAuth users)
    if (!clientProfile) {
        clientProfile = await prisma.clientProfile.create({
            data: { userId: session.user.id }
        })
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: id },
        include: {
            business: true,
            service: true,
            client: true,
            lastMinuteSlot: true,
        }
    })

    if (!appointment) {
        return Response.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Verify the appointment belongs to the client
    if (appointment.clientId !== clientProfile.id) {
        return Response.json({ error: "Unauthorized" }, { status: 403 })
    }

    return Response.json(appointment)
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    if (session.user.role !== "client") {
        return Response.json({ error: "Only clients can reschedule appointments" }, { status: 403 })
    }

    let clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: session.user.id }
    })
    
    // Auto-create profile if it doesn't exist (for OAuth users)
    if (!clientProfile) {
        clientProfile = await prisma.clientProfile.create({
            data: { userId: session.user.id }
        })
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: id },
        include: { service: true, client: true }
    })

    if (!appointment) {
        return Response.json({ error: "Appointment not found" }, { status: 404 })
    }

    if (appointment.clientId !== clientProfile.id) {
        return Response.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if appointment can be rescheduled
    if (appointment.status === "cancelled" || appointment.status === "completed" || appointment.status === "no_show") {
        return Response.json({ error: "Cannot reschedule a cancelled, completed, or no-show appointment" }, { status: 400 })
    }

    const body = await req.json()
    const { datetime } = body

    if (!datetime) {
        return Response.json({ error: "New datetime is required" }, { status: 400 })
    }

    const newDateTime = new Date(datetime)
    if (isNaN(newDateTime.getTime())) {
        return Response.json({ error: "Invalid datetime format" }, { status: 400 })
    }

    const now = new Date()
    if (newDateTime < now) {
        return Response.json({ error: "Appointment time must be in the future" }, { status: 400 })
    }

    // Calculate new derived fields
    const bookingWindowDays = Math.ceil((newDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const appointmentHour = newDateTime.getHours()

    // Recalculate AI risk score
    let aiRiskScore = 0
    
    if (bookingWindowDays <= 1) aiRiskScore += 30
    else if (bookingWindowDays <= 3) aiRiskScore += 20
    else if (bookingWindowDays <= 7) aiRiskScore += 10

    if (appointmentHour < 8 || appointmentHour > 18) aiRiskScore += 15

    if (!appointment.isReturningClient) aiRiskScore += 20
    if (clientProfile.cancelRate > 20) aiRiskScore += 15
    if (clientProfile.noShowRate > 10) aiRiskScore += 20

    aiRiskScore = Math.min(100, aiRiskScore)

    let riskLevel = "LOW"
    if (aiRiskScore >= 70) riskLevel = "HIGH"
    else if (aiRiskScore >= 40) riskLevel = "MEDIUM"

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
        where: { id: id },
        data: {
            datetime: newDateTime,
            bookingWindowDays,
            appointmentHour,
            aiRiskScore,
            riskLevel,
            pollSentAt: null, // Reset poll when rescheduled
            pollResponse: null
        },
        include: {
            business: true,
            service: true,
            client: true,
            lastMinuteSlot: true
        }
    })

    return Response.json(updatedAppointment)
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    if (session.user.role !== "client") {
        return Response.json({ error: "Only clients can cancel appointments" }, { status: 403 })
    }

    let clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: session.user.id }
    })
    
    // Auto-create profile if it doesn't exist (for OAuth users)
    if (!clientProfile) {
        clientProfile = await prisma.clientProfile.create({
            data: { userId: session.user.id }
        })
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: id }
    })

    if (!appointment) {
        return Response.json({ error: "Appointment not found" }, { status: 404 })
    }

    if (appointment.clientId !== clientProfile.id) {
        return Response.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if appointment can be cancelled
    if (appointment.status === "completed" || appointment.status === "no_show") {
        return Response.json({ error: "Cannot cancel a completed or no-show appointment" }, { status: 400 })
    }

    // Cancel the appointment (set status to cancelled)
    await prisma.appointment.update({
        where: { id: id },
        data: { status: "cancelled" }
    })

    // Calculate new risk profile based on updated rates
    const calculateRiskProfile = (cancelRate: number, noShowRate: number, totalAppointments: number) => {
        if (totalAppointments < 3) return "new"
        if (cancelRate <= 10 && noShowRate <= 5) return "reliable"
        if (cancelRate > 40 || noShowRate > 10) return "high_risk"
        return "at_risk"
    }

    // Update client profile statistics
    const newCancelCount = clientProfile.cancelCount + 1
    const newCancelRate = (newCancelCount / clientProfile.totalAppointments) * 100
    const newRiskProfile = calculateRiskProfile(newCancelRate, clientProfile.noShowRate, clientProfile.totalAppointments)

    await prisma.clientProfile.update({
        where: { id: clientProfile.id },
        data: {
            cancelCount: newCancelCount,
            cancelRate: newCancelRate,
            riskProfile: newRiskProfile
        }
    })

    // Process waitlist queue for this business/service
    try {
        await fetch(`${process.env.NEXTAUTH_URL}/api/waitlist/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                businessId: appointment.businessId,
                serviceId: appointment.serviceId
            })
        });
    } catch (error) {
        console.error("Error processing waitlist queue:", error);
        // Continue anyway - don't block cancellation
    }

    return Response.json({ success: true, message: "Appointment cancelled successfully" })
}
