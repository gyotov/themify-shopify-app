import prisma from "../db.server";

export default async function (shopifyThemeId: string) {
  try {
    await prisma.scheduledJob.delete({
      where: {
        shopifyThemeId: shopifyThemeId,
      },
    });

    return { success: true };
  } catch (error) {
    console.log(error.message);
    return {
      error: error.message,
    };
  }
}
