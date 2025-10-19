import {
  Card,
  Layout,
  Page,
  Text,
  Divider,
  BlockStack,
  InlineStack,
  List,
  Button,
  Badge,
  Box,
  Banner,
} from "@shopify/polaris";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  const payments = await billing.check({
    isTest: process.env.NODE_ENV !== "production",
  });

  return {
    hasActivePayment: payments.hasActivePayment,
    appSubscription: payments.appSubscriptions[0] || null,
  };
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
  const shopify = useAppBridge();

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
          <Card>
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
                  shopify.modal.show("app-rest-plan-modal");
                }}
              >
                Free
              </Button>
            </BlockStack>

            <Modal id="app-rest-plan-modal">
              <Box padding="500">
                <BlockStack gap="300">
                  <Banner tone="warning">
                    <Text as="p">
                      Are you sure you want to cancel your{" "}
                      {data?.appSubscription?.name} subscription?
                      <List>
                        <List.Item>
                          After cancellation, you will be downgraded to the Free
                          Plan, which allows only 3 scheduled publications
                          immediately.
                        </List.Item>

                        <List.Item>This action cannot be undone.</List.Item>
                      </List>
                    </Text>
                  </Banner>
                </BlockStack>
              </Box>

              <TitleBar title={"Cancel subscription & return to free plan"}>
                <button
                  variant="primary"
                  onClick={() => {
                    setPlanSelected(true);
                    fetcher.submit({ cancel: true }, { method: "POST" });
                    shopify.modal.hide("app-rest-plan-modal");
                  }}
                >
                  Confirm cancellation
                </button>

                <button
                  onClick={() => {
                    shopify.modal.hide("app-rest-plan-modal");
                  }}
                >
                  Keep my plan
                </button>
              </TitleBar>
            </Modal>
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
                  Priority email support for{" "}
                  <Text as="strong">quick assistance</Text>
                </List.Item>

                <List.Item>
                  Regular updates and new features{" "}
                  <Text as="strong">included</Text>
                </List.Item>
              </List>

              <Text as="p" variant="heading2xl">
                $9{" "}
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
                disabled={
                  data.hasActivePayment &&
                  data.appSubscription.name === "Unlimited"
                }
                loading={planSelected}
              >
                Upgrade monthly
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center" gap="200">
                <Text as="h2" variant="headingLg">
                  Unlimited (Yearly)
                </Text>

                <Badge tone="success-strong">Save 30%</Badge>
              </InlineStack>

              <Divider />

              <Text as="p" tone="subdued">
                💎 Enjoy unlimited theme scheduling and the flexibility to
                manage your store themes with ease — now with 30% savings on the
                yearly plan!
              </Text>

              <List>
                <List.Item>
                  All from <Text as="strong">Unlimited</Text>
                </List.Item>

                <List.Item>
                  <Text as="span" tone="success">
                    Save 30% on yearly subscription
                  </Text>
                </List.Item>
              </List>

              <Text as="p" variant="heading2xl">
                $85{" "}
                <Text as="span" variant="bodyMd" tone="subdued">
                  / year
                </Text>
              </Text>

              <Button
                variant="primary"
                size="large"
                onClick={() => {
                  setPlanSelected(true);
                  fetcher.submit(
                    { plan: "Unlimited (Yearly)" },
                    { method: "POST" },
                  );
                }}
                disabled={
                  data.hasActivePayment &&
                  data.appSubscription.name === "Unlimited (Yearly)"
                }
                loading={planSelected}
              >
                Upgrade yearly
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* <Layout.Section variant="oneThird">
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
        </Layout.Section> */}
      </Layout>
    </Page>
  );
}
