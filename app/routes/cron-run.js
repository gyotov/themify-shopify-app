import { log } from "../utils/helpers";
import { FREE_PLAN_SCHEDULE_LIMIT } from "../utils/constants";
import prisma from "../db.server";

async function processJobs() {
    log("Checking scheduled jobs queue...");

    const now = new Date();
    const jobs = await prisma.scheduledJob.findMany({
      where: {
        executeAt: { lte: now },
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

          if (job.session.scheduleCount >= FREE_PLAN_SCHEDULE_LIMIT) {
            log('Schedule limit reached for free plan. Terminating...');

            await prisma.scheduledJob.delete({
              where: { id: job.id },
            });

            return;
          }

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

export async function loader({ request }) {
  const auth = request.headers.get("authorization");

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  processJobs();

  return {success: true};
}