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

interface ChangeOrderAcceptedEmailProps {
  recipientName: string;
  clientName: string;
  changeOrderTitle: string;
  description: string;
  pricing: string;
  viewSowUrl: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scopeiq.app";

export function ChangeOrderAcceptedEmail({
  recipientName,
  clientName,
  changeOrderTitle,
  description,
  pricing,
  viewSowUrl,
}: ChangeOrderAcceptedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Change order accepted by {clientName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Green Success Bar */}
          <Section style={successBar}>
            <Text style={successBarText}>Change Order Accepted</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={heading}>Change Order Accepted</Heading>

            <Text style={greeting}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              Great news - <strong>{clientName}</strong> has accepted the change order. The SOW has
              been updated to reflect these changes.
            </Text>

            {/* Change Order Details Card */}
            <Section style={detailsCard}>
              <Text style={coTitle}>{changeOrderTitle}</Text>

              {description && (
                <Text style={coDescription}>{description}</Text>
              )}

              <Section style={coMetaRow}>
                <Text style={coMetaLabel}>Accepted by</Text>
                <Text style={coMetaValue}>{clientName}</Text>
              </Section>

              <Section style={{ ...coMetaRow, marginBottom: "0", paddingBottom: "0", borderBottom: "none" }}>
                <Text style={coMetaLabel}>Pricing</Text>
                <Text style={coMetaValue}>{pricing}</Text>
              </Section>
            </Section>

            {/* SOW Updated Note */}
            <Section style={sowNoteCard}>
              <Text style={sowNoteIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.667 10L8.333 14.167V5.833L16.667 10Z" fill="#0F6E56"/>
                  <path d="M3.333 10L11.667 14.167V5.833L3.333 10Z" fill="#0F6E56" fillOpacity="0.6"/>
                </svg>
              </Text>
              <Text style={sowNoteText}>
                <strong>SOW has been updated</strong> - The statement of work now includes the
                approved changes from this change order.
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={ctaSection}>
              <Button href={viewSowUrl} style={primaryButton}>
                View Updated SOW
              </Button>
            </Section>
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

const successBar: React.CSSProperties = {
  height: "4px",
  backgroundColor: "#0F6E56",
};

const successBarText: React.CSSProperties = {
  fontSize: "0",
  margin: "0",
};

const contentSection: React.CSSProperties = {
  padding: "32px 40px 0",
};

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#0F6E56",
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
  backgroundColor: "#f0faf6",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "16px",
  border: "1px solid #c6e7d9",
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
  borderBottom: "1px solid #c6e7d9",
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

const sowNoteCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  backgroundColor: "#f5f5f5",
  borderRadius: "6px",
  padding: "14px 18px",
  marginBottom: "24px",
};

const sowNoteIcon: React.CSSProperties = {
  margin: "0",
  flexShrink: 0,
};

const sowNoteText: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#4a4a4a",
  margin: "0",
};

const ctaSection: React.CSSProperties = {
  paddingBottom: "32px",
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

export default ChangeOrderAcceptedEmail;
