import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  redirect,
  useRevalidator,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  ResourceList,
  ResourceItem,
  EmptyState,
  Badge,
  CalloutCard,
  Banner,
  FooterHelp,
  Link,
  TextField,
  Box,
  Select,
} from "@shopify/polaris";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import emptyStateThemesImage from "../images/emptystate-themes.png";
import scheduleJob from "../db/scheduleJob";
import getThemesByIds from "../db/getThemesByIds";
import deleteScheduleJobByShopifyThemeId from "../db/deleteScheduleJobByShopifyThemeId";
import {
  hours,
  convertOffsetMinutesToHours,
  getCurrentDate,
  getDateYearAhead,
} from "../utils/helpers";

const PAGE_LIMIT = 10;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const endCursor = url.searchParams.get("endCursor");
  const startCursor = url.searchParams.get("startCursor");
  const { admin, billing } = await authenticate.admin(request);
  const payments = await billing.check({
    isTest: process.env.NODE_ENV !== "production",
  });
  const response = await admin.graphql(
    `
      query getThemes($endCursor: String, $startCursor: String) {
        themes(${startCursor ? "last" : "first"}: ${PAGE_LIMIT}, after: $endCursor, before: $startCursor) {
          nodes {
            id
            name
            role
            processing
            createdAt
            updatedAt
          }
          pageInfo {
            hasPreviousPage
            hasNextPage
            endCursor
            startCursor
          }
        }
        shop {
          timezoneAbbreviation
          timezoneOffset
          timezoneOffsetMinutes
          ianaTimezone
        }
      }
    `,
    {
      variables: { endCursor, startCursor },
    },
  );
  const {
    data: { themes, shop },
  } = await response.json();

  const records = await getThemesByIds(themes.nodes.map((node) => node.id));

  return {
    themes: themes.nodes.map((node) => {
      const record = records.find(
        (record) => record.shopifyThemeId === node.id,
      );

      return {
        ...node,
        scheduleStatus: record ? record.status : null,
      };
    }),
    shop,
    pageInfo: themes.pageInfo,
    hasActivePayment: payments.hasActivePayment,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const endCursor = formData.get("endCursor");
  const startCursor = formData.get("startCursor");
  const shopifyThemeId = formData.get("shopifyThemeId");
  const utcIsoDate = formData.get("utcIsoDate");
  const unschedule = formData.get("unschedule");

  if (shopifyThemeId) {
    if (unschedule) {
      await deleteScheduleJobByShopifyThemeId(shopifyThemeId);

      return null;
    }

    const scheduledJobData = await scheduleJob(
      "schedule_theme_publish",
      utcIsoDate,
      shopifyThemeId,
      session.id,
    );

    return scheduledJobData;
  }

  if (!startCursor && !endCursor) return redirect("/app");
  if (endCursor) return redirect(`?endCursor=${endCursor}`);

  return redirect(`?startCursor=${startCursor}`);
};

const ThemesResourceList = ({ data, onThemeSchedule }) => {
  const fetcher = useFetcher<typeof action>();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const resourceName = {
    singular: "theme",
    plural: "themes",
  };
  const onThemeScheduleHandler = (theme) => {
    onThemeSchedule(theme);
  };

  const onThemeUnscheduleHandler = (theme) => {
    fetcher.submit(
      { unschedule: true, shopifyThemeId: theme.id },
      { method: "POST" },
    );
  };

  return (
    <ResourceList
      emptyState={ThemesResourceListEmptyState}
      items={data.themes}
      resourceName={resourceName}
      renderItem={(item) => {
        const { id, name, role, processing } = item;
        const isLive = role === "MAIN";
        const isScheduled = item.scheduleStatus === "PENDING";

        return (
          <ResourceItem id={id} disabled>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack align="space-between" blockAlign="start" gap="300">
                  <Badge
                    tone={isLive ? "success" : undefined}
                    progress={isLive ? "complete" : undefined}
                  >
                    {isLive ? "Live" : "Draft"}
                  </Badge>

                  <BlockStack align="center" gap="200">
                    <Text
                      variant="headingMd"
                      fontWeight="bold"
                      as="h3"
                      tone="base"
                    >
                      {name}
                    </Text>
                  </BlockStack>
                </InlineStack>

                <InlineStack gap="400">
                  {processing && <Badge tone="warning">Processing</Badge>}
                  {isScheduled && <Badge tone="info">Scheduled</Badge>}

                  {!isScheduled && (
                    <Button
                      variant="plain"
                      disabled={isLive || processing}
                      onClick={() => onThemeScheduleHandler(item)}
                    >
                      Schedule
                    </Button>
                  )}

                  {isScheduled && (
                    <Button
                      tone="critical"
                      disabled={isLive || processing}
                      onClick={() => onThemeUnscheduleHandler(item)}
                    >
                      Unschedule
                    </Button>
                  )}
                </InlineStack>
              </InlineStack>
            </BlockStack>
          </ResourceItem>
        );
      }}
      showHeader
      alternateTool={
        <Button
          variant="plain"
          onClick={() => fetcher.submit({}, { method: "POST" })}
        >
          Refresh
        </Button>
      }
      pagination={{
        hasNext: data.pageInfo.hasNextPage,
        hasPrevious: data.pageInfo.hasPreviousPage,
        onNext: () => {
          fetcher.submit(
            { endCursor: data.pageInfo.endCursor },
            { method: "POST" },
          );
        },
        onPrevious: () => {
          fetcher.submit(
            { startCursor: data.pageInfo.startCursor },
            { method: "POST" },
          );
        },
      }}
      loading={isLoading}
    />
  );
};

const ThemesResourceListEmptyState = (
  <EmptyState
    heading="Add a theme to get started"
    image={emptyStateThemesImage}
  >
    <p>
      You can use the Themes section in Online store channel to upload themes
    </p>
  </EmptyState>
);

const BannerAnnounceFreePlan = ({ hasActivePayment }) => {
  if (hasActivePayment) return null;

  return (
    <Layout.Section>
      <Banner
        title="You're on the Free plan"
        action={{ content: "Upgrade Now", url: "/app/billing" }}
        tone="warning"
      >
        <p>
          Your current plan allows you to schedule publishing for up to 3 themes
          only. Upgrade to unlock unlimited scheduling and additional features.
        </p>
      </Banner>
    </Layout.Section>
  );
};

export default function Index() {
  const revalidator = useRevalidator();
  const fetcher = useFetcher<typeof action>();
  const data = useLoaderData();
  const shopify = useAppBridge();
  const [theme, setTheme] = useState("");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [refreshInterval] = useState(5000);

  const onThemeSchedule = (theme) => {
    setTheme(theme);
    setDate(getCurrentDate());
    setHour(hours[0]);
    shopify.modal.show("app-schedule-modal");
  };

  const handleOnModalHide = () => {
    setHour(hours[0]);
    setDate("");
  };

  const handleOnScheduleModalClose = () => {
    shopify.modal.hide("app-schedule-modal");
  };

  const handleOnScheduleModalSubmit = () => {
    const targetDateUTCISO = new Date(`${date}T${hour}:00.000Z`);
    targetDateUTCISO.setMinutes(
      targetDateUTCISO.getMinutes() - data.shop.timezoneOffsetMinutes,
    );

    fetcher.submit(
      { shopifyThemeId: theme.id, utcIsoDate: targetDateUTCISO.toISOString() },
      { method: "POST" },
    );

    shopify.modal.hide("app-schedule-modal");
  };

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        revalidator.revalidate();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, revalidator]);

  return (
    <>
      <Modal id="app-schedule-modal" onHide={handleOnModalHide}>
        <Box padding="500">
          <BlockStack gap="300">
            <Banner tone="warning">
              <p>
                At the scheduled time, your current live theme will be replaced
                with the selected theme. Ensure all changes are finalized before
                scheduling to avoid disruptions.
              </p>
            </Banner>
            <TextField
              label="Date"
              type="date"
              min={getCurrentDate()}
              max={getDateYearAhead()}
              value={date}
              onChange={(value) => setDate(value)}
              autoComplete="false"
            />
            <Select
              options={hours}
              value={hour}
              onChange={(value) => setHour(value)}
              label="Time"
            />
            <p>
              Select a date and time for when you want this theme to go live.
              Ensure your store is ready for the update at the scheduled time.
            </p>

            <Text variant="bodySm" as="p" tone="subdued">
              Your store's current timezone:{" "}
              <Text as="strong" variant="bodySm" tone="critical">
                <code>
                  {data.shop.ianaTimezone} (
                  {convertOffsetMinutesToHours(data.shop.timezoneOffsetMinutes)}
                  )
                </code>
              </Text>
              <br />
              All schedules will be executed based on this timezone.
            </Text>
          </BlockStack>
        </Box>

        <TitleBar title={`Schedule theme publish for: ${theme.name}`}>
          <button variant="primary" onClick={handleOnScheduleModalSubmit}>
            Schedule
          </button>

          <button onClick={handleOnScheduleModalClose}>Cancel</button>
        </TitleBar>
      </Modal>

      <Page>
        <BlockStack gap="500">
          <Layout>
            <BannerAnnounceFreePlan hasActivePayment={data.hasActivePayment} />

            <Layout.Section>
              <CalloutCard
                title="Need help or want to manage your billing?"
                illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
                primaryAction={{ content: "Visit Help page", url: "/app/help" }}
                secondaryAction={{
                  content: "Manage Billing",
                  url: "/app/billing",
                }}
              >
                <p>
                  Easily find answers to your questions or adjust your
                  subscription plan to fit your needs.
                </p>
              </CalloutCard>
            </Layout.Section>

            <Layout.Section>
              <Card padding="0">
                <ThemesResourceList
                  data={data}
                  onThemeSchedule={onThemeSchedule}
                />
              </Card>
            </Layout.Section>

            <Layout.Section>
              <FooterHelp>
                Have an affiliate opportunity, a development request or
                something else?{" "}
                <Link
                  target="_blank"
                  url="mailto:iotovvr@gmail.com?subject=Affiliate%20or%20Development%20Request&body=Please%20provide%20details%20about%20your%20request."
                >
                  Email Us
                </Link>
              </FooterHelp>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Page>
    </>
  );
}
