import {
  Card,
  Layout,
  Page,
  Text,
  Divider,
  BlockStack,
  List,
  Button,
} from "@shopify/polaris";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  const payments = await billing.check({
    isTest: process.env.NODE_ENV !== "production",
  });

  return { hasActivePayment: payments.hasActivePayment };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const plan = formData.get("plan");
  const cancel = formData.get("cancel");

  if (cancel) {
    const payments = await billing.check({
      isTest: process.env.NODE_ENV !== "production",
    });
    const activePayment = payments.appSubscriptions.find(
      (subscription) => subscription.status === "ACTIVE",
    );

    if (!activePayment) return { hasActivePayment: false };

    await billing.cancel({
      subscriptionId: activePayment.id,
    });

    return { hasActivePayment: false };
  }

  await billing.request({
    plan,
    isTest: process.env.NODE_ENV !== "production",
  });

  return null;
};

export default function AdditionalPage() {
  const data = useLoaderData();
  const fetcher = useFetcher<typeof action>();
  const [planSelected, setPlanSelected] = useState(false);

  useEffect(() => {
    setPlanSelected(false);
  }, [data]);

  return (
    <Page
      title="Billing plans"
      subtitle="Choose the plan that best fits your needs. Start with the Free demo plan or upgrade to the Unlimited plan for unlimited scheduling."
      backAction={{
        content: "Themes list",
        url: "/app",
      }}
    >
      <Layout>
        <Layout.Section variant="oneThird">
          <Card padding="600">
            <BlockStack gap="300">
              <Text as="h2" variant="headingLg">
                Free demo
              </Text>

              <Divider />

              <Text as="p" tone="subdued">
                Start with our Free demo plan to explore the app's
                functionality.
              </Text>

              <List>
                <List.Item>
                  Schedule publish for up to <Text as="strong">3 themes</Text>
                </List.Item>

                <List.Item>
                  Explore the app’s interface and functionality
                </List.Item>

                <List.Item>
                  <Text as="strong">No monthly cost</Text>
                </List.Item>
              </List>

              <Text as="p" variant="heading2xl">
                $0{" "}
                <Text as="span" variant="bodyMd" tone="subdued">
                  / month
                </Text>
              </Text>

              <Button
                variant="primary"
                disabled={!data.hasActivePayment}
                loading={planSelected}
                size="large"
                onClick={() => {
                  setPlanSelected(true);
                  fetcher.submit({ cancel: true }, { method: "POST" });
                }}
              >
                Free
              </Button>

              <Text
                as="span"
                variant="bodyLg"
                tone="subdued"
                alignment="center"
              >
                {data.hasActivePayment ? "DOWNGRADE PLAN" : "CURRENT PLAN"}
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingLg">
                Unlimited
              </Text>

              <Divider />

              <Text as="p" tone="subdued">
                Enjoy unlimited theme scheduling and the flexibility to manage
                your store themes with ease.
              </Text>

              <List>
                <List.Item>
                  Schedule publishing for{" "}
                  <Text as="strong">unlimited themes</Text>
                </List.Item>

                <List.Item>
                  Setting up theme <Text as="strong">notes</Text>
                </List.Item>

                <List.Item>
                  Priority email support for{" "}
                  <Text as="strong">quick assistance</Text>
                </List.Item>

                <List.Item>
                  Regular updates and new features{" "}
                  <Text as="strong">included</Text>
                </List.Item>
              </List>

              <Text as="p" variant="heading2xl">
                $6{" "}
                <Text as="span" variant="bodyMd" tone="subdued">
                  / month
                </Text>
              </Text>

              <Button
                variant="primary"
                size="large"
                onClick={() => {
                  setPlanSelected(true);
                  fetcher.submit({ plan: "Unlimited" }, { method: "POST" });
                }}
                disabled={data.hasActivePayment}
                loading={planSelected}
              >
                Upgrade
              </Button>

              <Text
                as="span"
                variant="bodyLg"
                tone="subdued"
                alignment="center"
              >
                {data.hasActivePayment ? "CURRENT PLAN" : "UPGRADE PLAN"}
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingLg">
                Coming soon...
              </Text>

              <Divider />

              <Text as="p" tone="subdued">
                Exciting features are on the way! We're working on multiple
                enhancements to bring you more flexibility, analytics, and
                collaboration tools.
              </Text>

              <List>
                <List.Item>
                  <Text as="strong">Team Collaboration Tools:</Text> Allow
                  multiple team members to contribute to scheduling and notes.
                </List.Item>

                <List.Item>
                  <Text as="strong">Advanced Analytics:</Text> Gain insights
                  into theme performance and scheduling efficiency.
                </List.Item>

                <List.Item>...and more</List.Item>
              </List>

              <Text
                as="span"
                variant="bodyLg"
                tone="subdued"
                alignment="center"
              >
                Stay tuned for more updates!
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
