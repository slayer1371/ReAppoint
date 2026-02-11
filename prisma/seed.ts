import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  console.log("🌱 Seeding database...")

  // Clean up existing data (be careful with this in production!)
  // await prisma.appointment.deleteMany({})
  // await prisma.service.deleteMany({})
  // await prisma.businessProfile.deleteMany({})
  // await prisma.clientProfile.deleteMany({})
  // await prisma.user.deleteMany({})

  // Create business users with profiles
  const businesses = [
    {
      name: "Sarah Chen",
      email: "sarah@luxurysalon.com",
      businessName: "Luxury Salon & Spa",
      businessType: "salon",
      phone: "(415) 555-0101",
    },
    {
      name: "Marcus Johnson",
      email: "marcus@fitnesspro.com",
      businessName: "FitnessPro Personal Training",
      businessType: "fitness",
      phone: "(415) 555-0102",
    },
    {
      name: "Dr. Emily Rodriguez",
      email: "emily@dentalcare.com",
      businessName: "Smile Dental Care",
      businessType: "dentistry",
      phone: "(415) 555-0103",
    },
  ]

  for (const biz of businesses) {
    const hashedPassword = await bcrypt.hash("password123", 10)
    
    const user = await prisma.user.upsert({
      where: { email: biz.email },
      update: {},
      create: {
        email: biz.email,
        name: biz.name,
        password: hashedPassword,
        role: "business",
        businessProfile: {
          create: {
            businessName: biz.businessName,
            businessType: biz.businessType,
            phone: biz.phone,
            noShowThreshold: 20,
            requireDepositForHighRisk: false,
          },
        },
      },
      include: { businessProfile: true },
    })

    console.log(`✅ Created business: ${biz.businessName}`)

    // Add services for each business
    const services = [
      { name: "Consultation", duration: 30, price: 0 },
      { name: "Standard Service", duration: 60, price: 100 },
      { name: "Premium Service", duration: 90, price: 150 },
    ]

    if (biz.businessType === "salon") {
      services.push(
        { name: "Haircut", duration: 45, price: 65 },
        { name: "Hair Color", duration: 120, price: 120 },
        { name: "Blow Dry", duration: 30, price: 40 },
      )
    } else if (biz.businessType === "fitness") {
      services.push(
        { name: "One-on-One Session", duration: 60, price: 80 },
        { name: "Group Class", duration: 60, price: 25 },
        { name: "Nutrition Consultation", duration: 30, price: 50 },
      )
    } else if (biz.businessType === "dentistry") {
      services.push(
        { name: "Cleaning", duration: 45, price: 100 },
        { name: "Filling", duration: 60, price: 150 },
        { name: "Crown", duration: 90, price: 800 },
      )
    }

    for (const service of services) {
      await prisma.service.upsert({
        where: {
          businessId_name: {
            businessId: user.businessProfile!.id,
            name: service.name,
          },
        },
        update: {},
        create: {
          businessId: user.businessProfile!.id,
          name: service.name,
          durationMins: service.duration,
          basePrice: service.price,
        },
      })
    }
  }

  // Create client users with profiles
  const clients = [
    { name: "Alice Johnson", email: "alice@example.com" },
    { name: "Bob Smith", email: "bob@example.com" },
    { name: "Carol White", email: "carol@example.com" },
    { name: "David Lee", email: "david@example.com" },
  ]

  for (const client of clients) {
    const hashedPassword = await bcrypt.hash("password123", 10)

    await prisma.user.upsert({
      where: { email: client.email },
      update: {},
      create: {
        email: client.email,
        name: client.name,
        password: hashedPassword,
        role: "client",
        clientProfile: {
          create: {
            riskProfile: "new",
            totalAppointments: 0,
            completedAppointments: 0,
          },
        },
      },
    })

    console.log(`✅ Created client: ${client.name}`)
  }

  // Create some sample appointments
  const bizUser = await prisma.user.findFirst({
    where: { role: "business" },
    include: { businessProfile: { include: { services: true } } },
  })

  const clientUser = await prisma.user.findFirst({
    where: { role: "client" },
    include: { clientProfile: true },
  })

  if (bizUser && clientUser && bizUser.businessProfile && clientUser.clientProfile) {
    const service = bizUser.businessProfile.services[0]
    if (service) {
      const appointmentDate = new Date()
      appointmentDate.setDate(appointmentDate.getDate() + 3)
      appointmentDate.setHours(14, 0, 0, 0)

      await prisma.appointment.create({
        data: {
          businessId: bizUser.businessProfile.id,
          clientId: clientUser.clientProfile.id,
          serviceId: service.id,
          datetime: appointmentDate,
          durationMins: service.durationMins,
          price: service.basePrice,
          status: "confirmed",
          bookingWindowDays: 3,
          appointmentHour: 14,
          isReturningClient: false,
          aiRiskScore: 35,
          riskLevel: "LOW",
        },
      })

      console.log(`✅ Created sample appointment`)
    }
  }

  console.log("🎉 Database seeding completed!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
