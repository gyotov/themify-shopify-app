import prisma from "../db.server";

export default async function (sessionId: string) {
  try {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
      },
    });

    return session;
  } catch (error) {
    console.log(error.message);
    return {
      error: error.message,
    };
  }
}
