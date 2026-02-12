import { Appointment, BusinessProfile, ClientProfile } from "@prisma/client";

export type ProfileResponse = 
  | { role: "client"; data: ClientProfile }
  | { role: "business"; data: BusinessProfile }

export type AppointmentData = {data : Appointment}

// Business:
// - Email: sarah@luxurysalon.com
// - Password: password123

// Client:
// - Email: alice@example.com
// - Password: password123