import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ChangeOrderSentEmailProps {
  recipientName: string;
  clientName: string;
  changeOrderTitle: string;
  description: string;
  pricing: string;
  status: string;
  viewChangeOrderUrl: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scopeiq.app";

export function ChangeOrderSentEmail({
  recipientName,
  clientName,
  changeOrderTitle,
  description,
  pricing,
  status,
  viewChangeOrderUrl,
}: ChangeOrderSentEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Change order sent to {clientName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* ScopeIQ Brand Header */}
          <Section style={brandBar} />

          <Section style={contentSection}>
            <Heading style={heading}>Change Order Sent to {clientName}</Heading>

            <Text style={greeting}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              The change order has been sent to {clientName} for review. Here&apos;s a summary of
              what was included.
            </Text>

            {/* Change Order Details Card */}
            <Section style={detailsCard}>
              <Text style={coTitle}>{changeOrderTitle}</Text>

              {description && (
                <Text style={coDescription}>{description}</Text>
              )}

              <Section style={coMetaRow}>
                <Text style={coMetaLabel}>Pricing</Text>
                <Text style={coMetaValue}>{pricing}</Text>
              </Section>

              <Section style={{ ...coMetaRow, marginBottom: "0", paddingBottom: "0", borderBottom: "none" }}>
                <Text style={coMetaLabel}>Status</Text>
                <Text style={coStatusBadge}>{status}</Text>
              </Section>
            </Section>

            {/* CTA Button */}
            <Section style={ctaSection}>
              <Button href={viewChangeOrderUrl} style={primaryButton}>
                View Change Order
              </Button>
            </Section>

            <Text style={noteText}>
              You&apos;ll be notified once {clientName} responds to this change order.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              <Link href={`${baseUrl}/dashboard`} style={footerLink}>
                View in ScopeIQ
              </Link>
              {" | "}
              <Link href={`${baseUrl}/unsubscribe`} style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
            <Text style={footerCopyright}>
              ScopeIQ &copy; {new Date().getFullYear()}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: "40px 0",
};

const container: React.CSSProperties = {
  maxWidth: "520px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const brandBar: React.CSSProperties = {
  height: "4px",
  backgroundColor: "#0F6E56",
};

const contentSection: React.CSSProperties = {
  padding: "32px 40px 0",
};

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#1a1a1a",
  margin: "0 0 20px",
};

const greeting: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0 0 12px",
};

const paragraph: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#4a4a4a",
  margin: "0 0 24px",
};

const detailsCard: React.CSSProperties = {
  backgroundColor: "#f8faf9",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
  border: "1px solid #e2efe9",
};

const coTitle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#1a1a1a",
  margin: "0 0 10px",
};

const coDescription: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#4a4a4a",
  margin: "0 0 20px",
};

const coMetaRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
  paddingBottom: "12px",
  borderBottom: "1px solid #e2efe9",
};

const coMetaLabel: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#6b6b6b",
  margin: "0",
};

const coMetaValue: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0",
};

const coStatusBadge: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "700",
  color: "#d4870e",
  backgroundColor: "#fff8f0",
  padding: "3px 10px",
  borderRadius: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const ctaSection: React.CSSProperties = {
  paddingBottom: "16px",
};

const primaryButton: React.CSSProperties = {
  display: "block",
  backgroundColor: "#0F6E56",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textAlign: "center",
  textDecoration: "none",
  borderRadius: "6px",
  padding: "14px 32px",
  width: "100%",
};

const noteText: React.CSSProperties = {
  fontSize: "13px",
  color: "#888888",
  textAlign: "center",
  margin: "0 0 32px",
  fontStyle: "italic",
};

const divider: React.CSSProperties = {
  borderColor: "#e8e8e8",
  margin: "0 40px",
};

const footer: React.CSSProperties = {
  padding: "16px 40px 32px",
};

const footerText: React.CSSProperties = {
  fontSize: "13px",
  color: "#888888",
  textAlign: "center",
  margin: "0 0 8px",
};

const footerLink: React.CSSProperties = {
  color: "#0F6E56",
  textDecoration: "underline",
};

const footerCopyright: React.CSSProperties = {
  fontSize: "12px",
  color: "#aaaaaa",
  textAlign: "center",
  margin: "0",
};

export default ChangeOrderSentEmail;
