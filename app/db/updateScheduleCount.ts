import prisma from "../db.server";

export default async function (sessionId: string) {
  try {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
      },
    });
    await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        scheduleCount: (session?.scheduleCount || 0) + 1,
      },
    });

    return;
  } catch (error) {
    console.log(error.message);
    return {
      error: error.message,
    };
  }
}
