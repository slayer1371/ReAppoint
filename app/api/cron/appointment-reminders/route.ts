import { prisma } from "@/lib/prisma";
import { sendAppointmentReminderEmail, sendWaitlistOfferEmail } from "@/lib/mail";

export async function GET(req: Request) {
  // Verify Vercel Cron secret (only if set - skip for local testing)
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  console.log("Starting appointment reminder cron job...");

  try {
    // ===== STEP 1: Send reminders to appointments (24h before OR less than 24h away) =====
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find appointments that need reminders:
    // 1. Appointments 24-25 hours away (scheduled 24h before)
    // 2. Appointments less than 24h away that haven't had reminders yet (last-minute bookings)
    const appointmentsToRemind = await prisma.appointment.findMany({
      where: {
        status: "confirmed",
        pollSentAt: null, // Reminder not yet sent
        datetime: {
          lte: in25Hours, // Less than 25 hours away
          gt: now // In the future
        }
      },
      include: {
        client: { include: { user: true } },
        service: true,
        business: true
      }
    });

    let remindersSent = 0;
    for (const apt of appointmentsToRemind) {
      try {
        // Create confirmation token: appointmentId_timestamp
        const confirmationToken = `${apt.id}_${Date.now()}`;

        await sendAppointmentReminderEmail(
          apt.client.user.email!,
          apt.client.user.name || "Client",
          apt.business.businessName,
          apt.service.name,
          apt.datetime,
          confirmationToken,
          apt.timezone
        );

        // Set confirmation deadline: 2 hours before appointment (or sooner if less time remains)
        const twoHoursBefore = new Date(apt.datetime.getTime() - 2 * 60 * 60 * 1000);
        const confirmationDeadline = twoHoursBefore > now ? twoHoursBefore : now;

        await prisma.appointment.update({
          where: { id: apt.id },
          data: {
            pollSentAt: now,
            confirmationDeadline
          }
        });

        remindersSent++;
        console.log(`Reminder sent for appointment ${apt.id}`);
      } catch (error) {
        console.error(`Failed to send reminder for ${apt.id}:`, error);
      }
    }

    // ===== STEP 2: Check for expired confirmations and cancel them =====
    const pastDeadline = await prisma.appointment.findMany({
      where: {
        status: "confirmed",
        confirmationDeadline: {
          lt: now
        },
        pollResponse: null // No confirmation received
      },
      include: {
        client: { include: { user: true } },
        service: true,
        business: true
      }
    });

    let appointmentsCancelled = 0;
    let offersCreated = 0;

    for (const apt of pastDeadline) {
      try {
        // Cancel the appointment
        await prisma.appointment.update({
          where: { id: apt.id },
          data: { status: "cancelled" }
        });

        // Update client stats
        await prisma.clientProfile.update({
          where: { id: apt.clientId },
          data: { cancelCount: { increment: 1 } }
        });

        appointmentsCancelled++;

        // ===== STEP 3: Offer slot to next person in waitlist =====
        const nextInQueue = await prisma.waitlist.findFirst({
          where: {
            businessId: apt.businessId,
            serviceId: apt.serviceId,
            status: "waiting"
          },
          orderBy: { position: "asc" },
          include: {
            client: { include: { user: true } }
          }
        });

        if (nextInQueue) {
          try {
            // Create offer token
            const offerToken = `${nextInQueue.id}_${Date.now()}`;

            // Send offer email using the appointment's timezone
            await sendWaitlistOfferEmail(
              nextInQueue.client.user.email!,
              nextInQueue.client.user.name || "Client",
              apt.business.businessName,
              apt.service.name,
              apt.datetime,
              offerToken,
              apt.timezone
            );

            // Update waitlist entry to offered status
            const offerDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            await prisma.waitlist.update({
              where: { id: nextInQueue.id },
              data: {
                status: "offered",
                offerExpiresAt: offerDeadline,
                offeredDatetime: apt.datetime
              }
            });

            offersCreated++;
            console.log(`Waitlist offer sent to ${nextInQueue.id}`);
          } catch (error) {
            console.error(`Failed to send offer to waitlist ${nextInQueue.id}:`, error);
          }
        }

        console.log(`Appointment ${apt.id} cancelled and slot offered to waitlist`);
      } catch (error) {
        console.error(`Failed to process expired appointment ${apt.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      remindersSent,
      appointmentsCancelled,
      offersCreated
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return Response.json(
      { error: "Cron job failed", details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
