/*
  Warnings:

  - You are about to drop the column `service` on the `Appointment` table. All the data in the column will be lost.
  - The `aiRiskScore` column on the `Appointment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `appointmentHour` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bookingWindowDays` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceId` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Waitlist" DROP CONSTRAINT "Waitlist_clientId_fkey";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "service",
ADD COLUMN     "appointmentHour" INTEGER NOT NULL,
ADD COLUMN     "bookingWindowDays" INTEGER NOT NULL,
ADD COLUMN     "isReturningClient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
ADD COLUMN     "serviceId" TEXT NOT NULL,
DROP COLUMN "aiRiskScore",
ADD COLUMN     "aiRiskScore" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "noShowThreshold" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "requireDepositForHighRisk" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN     "cancelCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cancelRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "completedAppointments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAppointmentAt" TIMESTAMP(3),
ADD COLUMN     "noShowCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "noShowRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "riskProfile" TEXT NOT NULL DEFAULT 'new',
ADD COLUMN     "totalAppointments" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMins" INTEGER NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "noShowRiskMult" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_businessId_name_key" ON "Service"("businessId", "name");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
