import prisma from "./app/db.server.js";
import { log } from "./app/utils/helpers.js";

export default async function processJobs() {
  log("Checking scheduled jobs queue...");

  const currentTickNowDate = new Date();
  const jobs = await prisma.scheduledJob.findMany({
    where: {
      executeAt: { lte: currentTickNowDate },
      status: "PENDING",
    },
    select: {
      session: true,
      shopifyThemeId: true,
      jobName: true,
      id: true,
    },
  });

  for (const job of jobs) {
    log(`Executing job: ${job.jobName}`);

    try {
      if (job.jobName === "schedule_theme_publish") {
        log(`Publishing theme with Shopify ID: ${job.shopifyThemeId}...`);

        const apiCall = await fetch(
          `${process.env.HOST}/theme-publish?shopifyThemeId=${job.shopifyThemeId}&shop=${job.session.shop}`,
        );
        const response = await apiCall.json();

        if (response.error) {
          throw new Error(response.error);
        }

        await prisma.scheduledJob.delete({
          where: { id: job.id },
        });
      }

      log(`Job ${job.jobName} with ID ${job.id} completed.`);
    } catch (error) {
      console.error(`Error executing job ${job.id}:`, error.message);
    }
  }
}

// Check for pending jobs
processJobs();

// Run the job processor every minute
setInterval(processJobs, 60 * 1000);
