import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    if (session.user.role !== "business") {
        return Response.json({ error: "Only business users can update appointment status" }, { status: 403 })
    }

    const businessProfile = await prisma.businessProfile.findUnique({
        where: { userId: session.user.id }
    })
    
    if (!businessProfile) {
        return Response.json({ error: "Business profile not found" }, { status: 404 })
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: id },
        include: { client: true }
    })

    if (!appointment) {
        return Response.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Verify this business owns the appointment
    if (appointment.businessId !== businessProfile.id) {
        return Response.json({ error: "Unauthorized - this appointment is not for your business" }, { status: 403 })
    }

    // Check if appointment can be updated (should be confirmed)
    if (appointment.status !== "confirmed") {
        return Response.json({ error: "Can only update confirmed appointments" }, { status: 400 })
    }

    const body = await req.json()
    const { status } = body

    if (!status || !["completed", "no_show"].includes(status)) {
        return Response.json({ error: "Status must be either 'completed' or 'no_show'" }, { status: 400 })
    }

    // Update appointment status
    const updatedAppointment = await prisma.appointment.update({
        where: { id: id },
        data: { status },
        include: {
            business: true,
            service: true,
            client: true
        }
    })

    // Get the client profile to update statistics
    const clientProfile = appointment.client

    // Calculate new risk profile based on rates
    const calculateRiskProfile = (cancelRate: number, noShowRate: number, totalAppointments: number) => {
        if (totalAppointments < 3) return "new"
        if (cancelRate <= 10 && noShowRate <= 5) return "reliable"
        if (cancelRate > 40 || noShowRate > 10) return "high_risk"
        return "at_risk"
    }

    // Update client profile statistics based on status
    if (status === "completed") {
        const newCompletedCount = clientProfile.completedAppointments + 1
        const newRiskProfile = calculateRiskProfile(clientProfile.cancelRate, clientProfile.noShowRate, clientProfile.totalAppointments)
        
        await prisma.clientProfile.update({
            where: { id: clientProfile.id },
            data: {
                completedAppointments: newCompletedCount,
                lastAppointmentAt: appointment.datetime,
                riskProfile: newRiskProfile
            }
        })
    } else if (status === "no_show") {
        const newNoShowCount = clientProfile.noShowCount + 1
        const newNoShowRate = (newNoShowCount / clientProfile.totalAppointments) * 100
        const newRiskProfile = calculateRiskProfile(clientProfile.cancelRate, newNoShowRate, clientProfile.totalAppointments)

        await prisma.clientProfile.update({
            where: { id: clientProfile.id },
            data: {
                noShowCount: newNoShowCount,
                noShowRate: newNoShowRate,
                riskProfile: newRiskProfile
            }
        })
    }

    return Response.json(updatedAppointment)
}
