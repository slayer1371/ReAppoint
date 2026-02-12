import sgMail from "@sendgrid/mail";
import { prisma } from "@/lib/prisma";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendVerificationEmail(email: string) {
  // 1. Generate a random 6-digit code
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(new Date().getTime() + 10 * 60 * 1000); // 10 minutes from now

  // 2. Save it to the database (Update existing or create new)
  // We delete old tokens for this email first to keep it clean
  await prisma.verificationToken.deleteMany({
    where: { identifier: email }
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires
    }
  });

  // 3. Send the Email via SendGrid
  await sgMail.send({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || "noreply@reappoint.app",
    subject: "Your Verification Code",
    html: `<p>Your code is: <strong>${token}</strong></p>`
  });
}

export async function sendWaitlistOfferEmail(
  clientEmail: string,
  clientName: string,
  businessName: string,
  serviceName: string,
  datetime: Date,
  offerToken: string
) {
  const formattedDate = datetime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
  
  const formattedTime = datetime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const claimLink = `${process.env.NEXTAUTH_URL}/api/waitlist/claim?token=${offerToken}`;
  const declineLink = `${process.env.NEXTAUTH_URL}/api/waitlist/decline?token=${offerToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Great News! A Slot Opened Up</h2>
      <p>Hi ${clientName},</p>
      <p>We have an opening for you at <strong>${businessName}</strong>! This offer expires in 24 hours.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Service:</strong> ${serviceName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
      </div>

      <div style="margin: 30px 0; display: flex; gap: 12px;">
        <a href="${claimLink}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          ✓ Claim This Slot
        </a>
        <a href="${declineLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          ✗ Decline
        </a>
      </div>

      <p style="color: #666; font-size: 12px;">
        Can't make this time? Click decline and we'll offer it to the next person on the waitlist.
      </p>
      
      <p>Thanks,<br/>ReAppoint Team</p>
    </div>
  `;

  await sgMail.send({
    to: clientEmail,
    from: process.env.SENDGRID_FROM_EMAIL || "noreply@reappoint.app",
    subject: `Slot Available: ${serviceName} at ${businessName}`,
    html
  });
}

export async function sendAppointmentReminderEmail(
  clientEmail: string,
  clientName: string,
  businessName: string,
  serviceName: string,
  datetime: Date,
  confirmationToken: string
) {
  const formattedDate = datetime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
  
  const formattedTime = datetime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const confirmationLink = `${process.env.NEXTAUTH_URL}/api/appointment/confirm?token=${confirmationToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Appointment Reminder</h2>
      <p>Hi ${clientName},</p>
      <p>Your appointment is coming up tomorrow! Please confirm that you'll be attending.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Business:</strong> ${businessName}</p>
        <p><strong>Service:</strong> ${serviceName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
      </div>

      <div style="margin: 30px 0;">
        <a href="${confirmationLink}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          ✓ Yes, I'll be there
        </a>
      </div>

      <p style="color: #666; font-size: 12px;">
        If you don't confirm by tomorrow morning, your slot will be released and offered to others on our waitlist.
      </p>
      
      <p>Thanks,<br/>ReAppoint Team</p>
    </div>
  `;

  await sgMail.send({
    to: clientEmail,
    from: process.env.SENDGRID_FROM_EMAIL || "noreply@reappoint.app",
    subject: `Reminder: ${serviceName} at ${businessName} tomorrow`,
    html
  });
}

export async function sendBookingConfirmationEmail(
  clientEmail: string,
  clientName: string,
  businessName: string,
  serviceName: string,
  datetime: Date,
  durationMins: number,
  price: number
) {
  const formattedDate = datetime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  
  const formattedTime = datetime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Appointment Confirmed!</h2>
      <p>Hi ${clientName},</p>
      <p>Your appointment has been successfully booked. Here are the details:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Business:</strong> ${businessName}</p>
        <p><strong>Service:</strong> ${serviceName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Duration:</strong> ${durationMins} minutes</p>
        <p><strong>Price:</strong> $${price.toFixed(2)}</p>
      </div>

      <p style="color: #666;">Please arrive 5-10 minutes early. If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
      
      <p>Thanks,<br/>ReAppoint Team</p>
    </div>
  `;

  await sgMail.send({
    to: clientEmail,
    from: process.env.SENDGRID_FROM_EMAIL || "noreply@reappoint.app",
    subject: `Appointment Confirmed: ${serviceName} at ${businessName}`,
    html
  });
}