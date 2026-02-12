import { prisma } from "@/lib/prisma"

interface TimeSlot {
    time: string
    available: boolean
    blockedBy?: string // appointment ID if blocked
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")
    const serviceId = searchParams.get("serviceId")
    const { id } = await params

    if (!date) {
        return Response.json({ error: "Date parameter is required" }, { status: 400 })
    }

    try {
        // Get service duration if provided
        let serviceDurationMins = 30 // Default to 30 mins if not specified
        if (serviceId) {
            const service = await prisma.service.findUnique({
                where: { id: serviceId }
            })
            if (service) {
                serviceDurationMins = service.durationMins
            }
        }

        // Parse the date string (YYYY-MM-DD format)
        const [year, month, day] = date.split("-").map(Number)
        
        // Create local date range (for slot generation)
        const localDayStart = new Date(year, month - 1, day, 0, 0, 0, 0)
        const localDayEnd = new Date(year, month - 1, day, 23, 59, 59, 999)
        
        // Convert to UTC for database query
        // When we create a local date and call getTime(), it gives us UTC milliseconds
        const utcDayStart = new Date(localDayStart.getTime())
        const utcDayEnd = new Date(localDayEnd.getTime())

        // Get all appointments for this business on this date (excluding cancelled)
        const appointments = await prisma.appointment.findMany({
            where: {
                businessId: id,
                datetime: {
                    gte: utcDayStart,
                    lte: utcDayEnd
                },
                status: {
                    in: ["confirmed", "completed", "floated"] // Include only these statuses
                }
            },
            include: { service: true }
        })

        // Generate 30-minute slots between 9 AM and 5 PM
        const slots: TimeSlot[] = []
        const businessHours = { start: 9, end: 18 } // 9 AM to 6 PM (18:00)

        for (let hour = businessHours.start; hour < businessHours.end; hour++) {
            for (let minutes = 0; minutes < 60; minutes += 30) {
                // Create slot times in local timezone
                const slotStart = new Date(year, month - 1, day, hour, minutes, 0, 0)
                const slotEnd = new Date(slotStart.getTime() + serviceDurationMins * 60 * 1000)

                // If service duration extends beyond business hours, mark as unavailable
                // Create closing time boundary
                const closingTime = new Date(year, month - 1, day, businessHours.end, 0, 0, 0)
                if (slotEnd > closingTime) {
                    const timeStr = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
                    slots.push({
                        time: timeStr,
                        available: false,
                        blockedBy: "business_hours"
                    })
                    continue
                }

                // Check if slot conflicts with any appointment
                let isBooked = false
                let blockedBy: string | undefined

                for (const apt of appointments) {
                    const aptStart = new Date(apt.datetime)
                    const aptEnd = new Date(aptStart.getTime() + apt.durationMins * 60 * 1000)

                    // Check for overlap: slotStart < aptEnd AND slotEnd > aptStart
                    if (slotStart < aptEnd && slotEnd > aptStart) {
                        isBooked = true
                        blockedBy = apt.id
                        break
                    }
                }

                const timeStr = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
                slots.push({
                    time: timeStr,
                    available: !isBooked,
                    ...(blockedBy && { blockedBy })
                })
            }
        }

        return Response.json({
            slots,
            bookedAppointments: appointments.map(apt => ({
                id: apt.id,
                datetime: apt.datetime,
                durationMins: apt.durationMins,
                serviceName: apt.service.name
            }))
        })
    } catch (err) {
        console.error("Error fetching available slots:", err)
        return Response.json({ error: "Failed to fetch available slots" }, { status: 500 })
    }
}
