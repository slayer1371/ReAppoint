-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "confirmationDeadline" TIMESTAMP(3),
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;
