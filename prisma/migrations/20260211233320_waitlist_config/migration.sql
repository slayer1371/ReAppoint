/*
  Warnings:

  - You are about to drop the column `flexibleTimes` on the `Waitlist` table. All the data in the column will be lost.
  - You are about to drop the column `maxPrice` on the `Waitlist` table. All the data in the column will be lost.
  - You are about to drop the column `preferredServices` on the `Waitlist` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clientId,businessId,serviceId]` on the table `Waitlist` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `position` to the `Waitlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceId` to the `Waitlist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Waitlist" DROP COLUMN "flexibleTimes",
DROP COLUMN "maxPrice",
DROP COLUMN "preferredServices",
ADD COLUMN     "offerExpiresAt" TIMESTAMP(3),
ADD COLUMN     "position" INTEGER NOT NULL,
ADD COLUMN     "serviceId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'waiting';

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_clientId_businessId_serviceId_key" ON "Waitlist"("clientId", "businessId", "serviceId");

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
