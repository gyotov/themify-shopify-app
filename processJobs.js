import prisma from "./app/db.server.js";
import { log } from "./app/utils/helpers.js";

log(`Launching jobs queue with process PID: ${process.pid}`);

export default async function processJobs() {
  log("Checking scheduled jobs queue...");

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
        log(`Publishing theme with Shopify ID: ${job.shopifyThemeId}`);
        // To Do:
        // Handle Shopify themes API call here
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

// Run the job processor every minute
setInterval(processJobs, 60 * 1000);
