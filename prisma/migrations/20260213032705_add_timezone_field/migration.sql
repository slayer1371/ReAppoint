-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/New_York';

-- AlterTable
ALTER TABLE "Waitlist" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/New_York';
