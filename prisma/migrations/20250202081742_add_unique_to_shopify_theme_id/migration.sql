/*
  Warnings:

  - A unique constraint covering the columns `[shopifyThemeId]` on the table `ScheduledJob` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ScheduledJob_shopifyThemeId_key` ON `ScheduledJob`(`shopifyThemeId`);
