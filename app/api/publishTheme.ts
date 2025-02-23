import updateScheduleCount from "../db/updateScheduleCount";

export default async function (sessionId, graphql, shopifyThemeId) {
  try {
    const response = await graphql(
      `
        mutation themePublish($id: ID!) {
          themePublish(id: $id) {
            theme {
              id
            }
            userErrors {
              code
              field
              message
            }
          }
        }
      `,
      {
        variables: { id: shopifyThemeId },
      },
    );
    const responseJson = await response.json();
    await updateScheduleCount(sessionId);

    return responseJson?.data;
  } catch (error) {
    return { error: error.message };
  }
}
