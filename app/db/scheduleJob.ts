import prisma from "../db.server";
import { log } from "../utils/helpers";

export default async function (
  jobName: string,
  executeAt: Date,
  shopifyThemeId: string,
  sessionId: string,
) {
  try {
    await prisma.scheduledJob.create({
      data: { jobName, executeAt, shopifyThemeId, sessionId },
    });

    log(
      `Job "${jobName}" with shopify theme ID: ${shopifyThemeId} scheduled at ${executeAt}`,
    );

    return {};
  } catch (error) {
    console.log(error.message);
    return {
      error: error.message,
    };
  }
}
