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
          `${process.env.APP_HOST}/theme-publish?shopifyThemeId=${job.shopifyThemeId}&shop=${job.session.shop}`,
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

async function waitForNextInterval() {
  const now = new Date();
  const minutes = now.getMinutes();
  const nextRunMinutes = Math.ceil(minutes / 5) * 5;

  if (minutes % 5 === 0) {
    log("Starting immediately at a 5-minute mark...");
  } else {
    const waitTime =
      ((nextRunMinutes - minutes) % 60) * 60 * 1000 -
      now.getSeconds() * 1000 -
      now.getMilliseconds();

    log(`Waiting ${waitTime / 1000} seconds until the next 5-minute mark...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
}

async function startScheduler() {
  await waitForNextInterval();

  processJobs();
  setInterval(processJobs, 5 * 60 * 1000); // Run every 5 minutes
}

processJobs();
startScheduler();
