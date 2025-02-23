import type { LoaderFunctionArgs } from "@remix-run/node";
import { unauthenticated } from "../shopify.server";
import publishTheme from "../api/publishTheme";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopifyThemeId = url.searchParams.get("shopifyThemeId");
  const shop = url.searchParams.get("shop") || "";
  const { session, admin } = await unauthenticated.admin(shop);

  const themePublish = await publishTheme(session.id, admin.graphql, shopifyThemeId);

  if (themePublish.error) {
    return { error: themePublish.error };
  }

  return { status: shopifyThemeId, shop };
};
