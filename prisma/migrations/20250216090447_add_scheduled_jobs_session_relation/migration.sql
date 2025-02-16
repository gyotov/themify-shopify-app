/*
  Warnings:

  - Added the required column `sessionId` to the `ScheduledJob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ScheduledJob` ADD COLUMN `sessionId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `ScheduledJob` ADD CONSTRAINT `ScheduledJob_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
