import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/lib/mail";
import { getServerSession } from "next-auth";

export async function GET() {
    const session = await getServerSession(authOptions)

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

    const appointments = await prisma.appointment.findMany({
        where: { clientId: clientProfile.id },
        include: {
            business: true,
            service: true,
        },
        orderBy: { datetime: "desc" }
    })
    
    return Response.json(appointments)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    if (session.user.role !== "client") {
        return Response.json({ error: "Only clients can create appointments" }, { status: 403 })
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

    const body = await req.json()
    const { businessId, serviceId, datetime, waitlistId } = body

    // Validate required fields
    if (!businessId || !serviceId || !datetime) {
        return Response.json(
            { error: "Missing required fields: businessId, serviceId, datetime" },
            { status: 400 }
        )
    }

    // Verify datetime is valid
    const appointmentDate = new Date(datetime)
    if (isNaN(appointmentDate.getTime())) {
        return Response.json({ error: "Invalid datetime format" }, { status: 400 })
    }

    // Get service and verify it belongs to the business
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { business: true }
    })

    if (!service) {
        return Response.json({ error: "Service not found" }, { status: 404 })
    }

    if (service.businessId !== businessId) {
        return Response.json({ error: "Service does not belong to the specified business" }, { status: 400 })
    }

    // Verify business exists
    const business = await prisma.businessProfile.findUnique({
        where: { id: businessId }
    })

    if (!business) {
        return Response.json({ error: "Business not found" }, { status: 404 })
    }

    // Calculate derived fields
    const now = new Date()
    const bookingWindowDays = Math.ceil((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const appointmentHour = appointmentDate.getHours()

    // Check if client is returning
    const previousCompletedAppointments = await prisma.appointment.findFirst({
        where: {
            clientId: clientProfile.id,
            status: "completed"
        }
    })
    const isReturningClient = !!previousCompletedAppointments

    // Calculate AI risk score (0-100)
    // Factors: booking window, time of day, client history, no-show rate
    let aiRiskScore = 0
    
    // Booking window factor (last-minute bookings are riskier)
    if (bookingWindowDays <= 1) aiRiskScore += 30
    else if (bookingWindowDays <= 3) aiRiskScore += 20
    else if (bookingWindowDays <= 7) aiRiskScore += 10

    // Time of day factor (early morning/late evening riskier)
    if (appointmentHour < 8 || appointmentHour > 18) aiRiskScore += 15

    // Client history factor
    if (!isReturningClient) aiRiskScore += 20
    if (clientProfile.cancelRate > 20) aiRiskScore += 15
    if (clientProfile.noShowRate > 10) aiRiskScore += 20

    aiRiskScore = Math.min(100, aiRiskScore)

    // Determine risk level
    let riskLevel = "LOW"
    if (aiRiskScore >= 70) riskLevel = "HIGH"
    else if (aiRiskScore >= 40) riskLevel = "MEDIUM"

    // Check for conflicts with existing appointments
    const appointmentEnd = new Date(appointmentDate.getTime() + service.durationMins * 60 * 1000)
    
    const conflictingAppointments = await prisma.appointment.findMany({
        where: {
            businessId,
            status: { in: ["confirmed", "completed", "floated"] },
            datetime: { lte: appointmentEnd },
            AND: {
                datetime: {
                    gte: new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000) // Check a day back to get end times
                }
            }
        },
        include: { service: true }
    })

    // Check if any existing appointment overlaps with the requested time
    for (const existing of conflictingAppointments) {
        const existingEnd = new Date(existing.datetime.getTime() + existing.durationMins * 60 * 1000)
        
        // Overlap check: appointment overlaps if start < other end AND end > other start
        if (appointmentDate < existingEnd && appointmentEnd > existing.datetime) {
            return Response.json(
                { error: "Time slot is not available. This conflicts with an existing appointment." },
                { status: 409 }
            )
        }
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
        data: {
            businessId,
            clientId: clientProfile.id,
            serviceId,
            datetime: appointmentDate,
            durationMins: service.durationMins,
            price: service.basePrice,
            bookingWindowDays,
            appointmentHour,
            isReturningClient,
            aiRiskScore,
            riskLevel,
            status: "confirmed"
        },
        include: {
            business: true,
            service: true,
            client: true
        }
    })

    // Update client profile statistics
    await prisma.clientProfile.update({
        where: { id: clientProfile.id },
        data: {
            totalAppointments: { increment: 1 }
        }
    })

    // Send booking confirmation email
    try {
        await sendBookingConfirmationEmail(
            session.user.email!,
            session.user.name || "Client",
            business.businessName,
            service.name,
            appointmentDate,
            service.durationMins,
            service.basePrice
        );
    } catch (error) {
        console.error("Failed to send booking confirmation email:", error);
        // Don't fail appointment creation if email fails
    }

    // If user was on waitlist, remove them now that they've booked
    if (waitlistId) {
        try {
            // Delete the waitlist entry - they've been converted from waitlist to appointment
            const deleted = await prisma.waitlist.delete({
                where: { id: waitlistId }
            })
            console.log(`Successfully removed waitlist entry ${waitlistId}`)
        } catch (error) {
            // Log the error but don't fail the appointment creation
            console.error(`Warning: Could not remove waitlist entry ${waitlistId}:`, error instanceof Error ? error.message : error)
        }
    }

    return Response.json(appointment, { status: 201 })
}