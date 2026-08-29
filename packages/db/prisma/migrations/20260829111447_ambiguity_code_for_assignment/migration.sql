/*
  Warnings:

  - You are about to drop the column `assignedAt` on the `Conversation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "assignedAt",
ADD COLUMN     "agentAssignedAt" TIMESTAMP(3),
ADD COLUMN     "supervisorAssignedAt" TIMESTAMP(3);
