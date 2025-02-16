import prisma from "../db.server";

export default async function(themeIds) {
  try {
    const records = await prisma.scheduledJob.findMany({
      where: {
        shopifyThemeId: {
          in: themeIds
        }
      }
    })

    return records;
  } catch(error) {
    console.log(error.message);
    return {
      error: error.message,
    };
  }
}