import { Resend } from 'resend';
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  // 3. Send the Email
  // NOTE: If you don't have a domain, you can strictly send to YOUR OWN email 
  // or use 'onboarding@resend.dev' as the 'from' address.
  await resend.emails.send({
    from: 'onboarding@resend.dev', 
    to: email, 
    subject: 'Your Verification Code',
    html: `<p>Your code is: <strong>${token}</strong></p>`
  });
}