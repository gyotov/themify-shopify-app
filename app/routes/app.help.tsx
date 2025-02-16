import {
  Card,
  Layout,
  Page,
  Text,
  FooterHelp,
  Link,
  DescriptionList,
  BlockStack,
} from "@shopify/polaris";

export default function AdditionalPage() {
  return (
    <Page
      title="How can we help you?"
      subtitle="Find answers to your questions, explore guides, or get in touch with our support team for assistance."
      backAction={{
        content: "Themes list",
        url: "/app",
      }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="600">
            <BlockStack gap="200">
              <Text as="h1" variant="headingLg">
                FAQs
              </Text>

              <Text as="p" variant="bodySm">
                Find quick answers to common questions about using the app:
              </Text>

              <DescriptionList
                items={[
                  {
                    term: "How do I schedule a theme?",
                    description:
                      "Navigate to the Themes page in our app, browse the themes and click the Schedule button to set a date, time, and timezone.",
                  },
                  {
                    term: "How do I unschedule a theme?",
                    description:
                      'To unschedule a theme, browse the themes and locate the scheduled theme in the list. Click the "Unschedule" button next to the theme to cancel the scheduled publishing. You can reschedule the theme at any time if needed.',
                  },
                  {
                    term: "What happens if I reach my plan limit?",
                    description:
                      "On the Free plan, you can only schedule up to 3 themes. Upgrade to the Unlimited plan to schedule more themes.",
                  },
                  {
                    term: "How do I upgrade my plan?",
                    description:
                      "Visit the Billing page and select the desired plan to unlock more features.",
                  },
                  {
                    term: "Do you offer custom plans for large-scale scheduling needs?",
                    description:
                      "Yes, we can create a custom plan for stores requiring a large number of theme schedules or advanced features. Contact us from the info provided at the bottom of this page to discuss your requirements.",
                  },
                  {
                    term: "What happens if I uninstall the app?",
                    description:
                      "If you uninstall the app, all scheduled themes will be canceled, and your data will be securely stored for 30 days. If you reinstall the app within this period, your data and settings will be restored. After 30 days, all data will be permanently deleted.",
                  },
                ]}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <FooterHelp>
            Have an affiliate opportunity, a development request or something
            else?{" "}
            <Link
              target="_blank"
              url="mailto:iotovvr@gmail.com?subject=Affiliate%20or%20Development%20Request&body=Please%20provide%20details%20about%20your%20request."
            >
              Email Us
            </Link>
          </FooterHelp>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
