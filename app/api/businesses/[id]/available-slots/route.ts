import { prisma } from "@/lib/prisma"

interface TimeSlot {
    time: string
    available: boolean
    blockedBy?: string // appointment ID if blocked
}

// Helper: Get UTC offset for a given date and timezone (in hours)
// E.g., EST on Feb 14 returns -5 (UTC-5)
function getUTCOffsetHours(year: number, month: number, day: number, timezone: string): number {
    // Create a date at noon UTC on the given date
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    
    // Format it in the given timezone to see what local time it shows
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    })
    
    const parts = formatter.formatToParts(utcDate)
    const localHour = parseInt(parts.find(p => p.type === "hour")?.value || "0")
    const localMinute = parseInt(parts.find(p => p.type === "minute")?.value || "0")
    
    // Local time shown when UTC is 12:00
    const localMinutesFromMidnight = localHour * 60 + localMinute
    const utcMinutesFromMidnight = 12 * 60 // noon = 720 minutes
    
    // Offset in hours
    const offsetMinutes = localMinutesFromMidnight - utcMinutesFromMidnight
    return offsetMinutes / 60
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")
    const serviceId = searchParams.get("serviceId")
    const timezone = searchParams.get("timezone") || "America/New_York"
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
        
        // Get UTC offset for this date and timezone
        const offsetHours = getUTCOffsetHours(year, month, day, timezone)
        
        // Get UTC day boundaries (for fetching appointments)
        // The local day starts at 00:00 local time, which is offsetHours worth of UTC time
        const utcDayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
        utcDayStart.setHours(utcDayStart.getHours() - offsetHours)
        const utcDayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
        utcDayEnd.setHours(utcDayEnd.getHours() - offsetHours)

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

        // Generate 30-minute slots between 9 AM and 6 PM in LOCAL timezone
        const slots: TimeSlot[] = []
        const businessHours = { start: 9, end: 18 } // 9 AM to 6 PM

        for (let localHour = businessHours.start; localHour < businessHours.end; localHour++) {
            for (let localMinute = 0; localMinute < 60; localMinute += 30) {
                // Convert local time to UTC for database lookup
                // UTC = Local - offset
                // E.g., 9 AM EST (UTC-5, offset=-5): UTC = 9 AM - (-5) = 9 AM + 5 hours = 2 PM (14:00 UTC)
                const totalLocalMinutes = localHour * 60 + localMinute
                const totalUtcMinutes = totalLocalMinutes - offsetHours * 60
                const utcHour = Math.floor(totalUtcMinutes / 60) % 24 // Handle day boundary
                const utcMinute = Math.floor(totalUtcMinutes % 60)
                
                // Create slot times in UTC for checking appointments
                const slotStart = new Date(Date.UTC(year, month - 1, day, utcHour, utcMinute, 0, 0))
                const slotEnd = new Date(slotStart.getTime() + serviceDurationMins * 60 * 1000)

                // Check if service duration extends beyond business hours (in local timezone)
                const appointmentEndLocalMinutes = totalLocalMinutes + serviceDurationMins
                const appointmentEndLocalHour = Math.floor(appointmentEndLocalMinutes / 60)
                
                if (appointmentEndLocalHour > businessHours.end) {
                    const timeStr = `${localHour.toString().padStart(2, "0")}:${localMinute.toString().padStart(2, "0")}`
                    slots.push({
                        time: timeStr,
                        available: false,
                        blockedBy: "business_hours"
                    })
                    continue
                }

                // Check if slot conflicts with any appointment (comparing UTC to UTC)
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

                const timeStr = `${localHour.toString().padStart(2, "0")}:${localMinute.toString().padStart(2, "0")}`
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
