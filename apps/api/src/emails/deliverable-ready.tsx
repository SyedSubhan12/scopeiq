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

interface DeliverableReadyEmailProps {
  recipientName: string;
  deliverableName: string;
  projectName: string;
  clientName: string;
  reviewUrl: string;
  revisionCount: number;
  maxRevisions: number;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scopeiq.app";

export function DeliverableReadyEmail({
  recipientName,
  deliverableName,
  projectName,
  clientName,
  reviewUrl,
  revisionCount,
  maxRevisions,
}: DeliverableReadyEmailProps) {
  const revisionsRemaining = maxRevisions - revisionCount;

  return (
    <Html>
      <Head />
      <Preview>New deliverable ready for your review</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* ScopeIQ Brand Header */}
          <Section style={brandBar} />

          <Section style={contentSection}>
            <Heading style={heading}>New Deliverable Ready for Review</Heading>

            <Text style={greeting}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              A new deliverable is ready for your review. Please take a look and let us know if you
              have any feedback.
            </Text>

            {/* Deliverable Details Card */}
            <Section style={detailsCard}>
              <Section style={detailRow}>
                <Text style={detailLabel}>Deliverable</Text>
                <Text style={detailValue}>{deliverableName}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Project</Text>
                <Text style={detailValue}>{projectName}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Client</Text>
                <Text style={detailValue}>{clientName}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Revisions</Text>
                <Text style={detailValue}>
                  {revisionCount} / {maxRevisions}
                  {revisionsRemaining > 0 && (
                    <Text style={revisionsRemainingText}>
                      ({revisionsRemaining} remaining)
                    </Text>
                  )}
                </Text>
              </Section>
            </Section>

            {/* CTA Button */}
            <Section style={ctaSection}>
              <Button href={reviewUrl} style={primaryButton}>
                Review Deliverable
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
  padding: "20px",
  marginBottom: "24px",
  border: "1px solid #e2efe9",
};

const detailRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: "12px",
  paddingBottom: "12px",
  borderBottom: "1px solid #e2efe9",
};

const detailLabel: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#6b6b6b",
  margin: "0",
  flexShrink: 0,
};

const detailValue: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#1a1a1a",
  margin: "0",
  textAlign: "right",
};

const revisionsRemainingText: React.CSSProperties = {
  fontSize: "12px",
  color: "#0F6E56",
  fontWeight: "500",
  margin: "2px 0 0",
  display: "block",
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

export default DeliverableReadyEmail;
