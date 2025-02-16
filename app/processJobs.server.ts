import prisma from "./db.server";
import { log } from "./utils/helpers";
import { unauthenticated } from "./shopify.server";
import publishTheme from "./api/publishTheme";

export default async function () {
  log("Checking scheduled jobs queue...");

  const { admin } = await unauthenticated.admin(
    "describe-perception.myshopify.com",
  );
  const currentTickNowDate = new Date();
  const jobs = await prisma.scheduledJob.findMany({
    where: {
      executeAt: { lte: currentTickNowDate },
      status: "PENDING",
    },
  });

  for (const job of jobs) {
    log(`Executing job: ${job.jobName}`);

    try {
      if (job.jobName === "schedule_theme_publish") {
        log(`Publishing theme with Shopify ID: ${job.shopifyThemeId}...`);

        const themePublish = await publishTheme(
          admin.graphql,
          job.shopifyThemeId,
        );

        if (themePublish.error) {
          throw new Error(themePublish.error);
        }
      }

      await prisma.scheduledJob.delete({
        where: { id: job.id },
      });

      log(`Job ${job.jobName} with ID ${job.id} completed.`);
    } catch (error) {
      console.error(`Error executing job ${job.id}:`, error);
    }
  }
}
