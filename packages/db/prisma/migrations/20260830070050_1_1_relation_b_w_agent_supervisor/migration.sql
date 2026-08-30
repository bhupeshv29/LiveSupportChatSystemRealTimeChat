/*
  Warnings:

  - You are about to drop the `SupervisorAgent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SupervisorAgent" DROP CONSTRAINT "SupervisorAgent_agentId_fkey";

-- DropForeignKey
ALTER TABLE "SupervisorAgent" DROP CONSTRAINT "SupervisorAgent_supervisorId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "supervisorId" TEXT;

-- DropTable
DROP TABLE "SupervisorAgent";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
