export default async function (graphql, shopifyThemeId) {
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

    return responseJson?.data;
  } catch (error) {
    return { error: error.message };
  }
}
