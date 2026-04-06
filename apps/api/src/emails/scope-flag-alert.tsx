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

type Severity = "low" | "medium" | "high" | "critical";

interface ScopeFlagAlertEmailProps {
  recipientName: string;
  projectName: string;
  clientName: string;
  severity: Severity;
  flagTitle: string;
  messagePreview: string;
  viewFlagUrl: string;
  generateChangeOrderUrl: string;
}

const severityConfig: Record<Severity, { label: string; color: string; bgColor: string }> = {
  low: { label: "Low", color: "#6b7280", bgColor: "#f3f4f6" },
  medium: { label: "Medium", color: "#d4870e", bgColor: "#fff8f0" },
  high: { label: "High", color: "#c0392b", bgColor: "#fef2f2" },
  critical: { label: "Critical", color: "#ffffff", bgColor: "#c0392b" },
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scopeiq.app";

export function ScopeFlagAlertEmail({
  recipientName,
  projectName,
  clientName,
  severity,
  flagTitle,
  messagePreview,
  viewFlagUrl,
  generateChangeOrderUrl,
}: ScopeFlagAlertEmailProps) {
  const sev = severityConfig[severity];

  return (
    <Html>
      <Head />
      <Preview>Scope flag detected - {flagTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Red Alert Bar */}
          <Section style={{ ...alertBar, backgroundColor: sev.color }}>
            <Text style={alertBarText}>Scope Flag Detected</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={heading}>{flagTitle}</Heading>

            <Text style={greeting}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              A new scope flag has been detected and requires your attention. Early detection helps
              prevent scope creep and keeps projects profitable.
            </Text>

            {/* Flag Details Card */}
            <Section style={detailsCard}>
              <Section style={detailRow}>
                <Text style={detailLabel}>Project</Text>
                <Text style={detailValue}>{projectName}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Client</Text>
                <Text style={detailValue}>{clientName}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Severity</Text>
                <Text style={{ ...detailValue, ...severityBadge(sev) }}>
                  {sev.label}
                </Text>
              </Section>
            </Section>

            {/* Message Preview */}
            <Section style={previewCard}>
              <Text style={previewLabel}>Message Preview</Text>
              <Text style={previewText}>{messagePreview}</Text>
            </Section>

            {/* Action Buttons */}
            <Section style={buttonsSection}>
              <Button href={viewFlagUrl} style={primaryButton}>
                View Flag
              </Button>
              <Section style={secondaryButtonWrapper}>
                <Button href={generateChangeOrderUrl} style={secondaryButton}>
                  Generate Change Order
                </Button>
              </Section>
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

const severityBadge = (sev: { color: string; bgColor: string }): React.CSSProperties => ({
  display: "inline-block",
  backgroundColor: sev.bgColor,
  color: sev.color,
  fontSize: "12px",
  fontWeight: "700",
  padding: "3px 10px",
  borderRadius: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
});

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

const alertBar: React.CSSProperties = {
  padding: "14px 40px",
};

const alertBarText: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#ffffff",
  textTransform: "uppercase",
  letterSpacing: "1px",
  margin: "0",
  textAlign: "center",
};

const contentSection: React.CSSProperties = {
  padding: "28px 40px 0",
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#1a1a1a",
  margin: "0 0 16px",
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
  marginBottom: "16px",
  border: "1px solid #e2efe9",
};

const detailRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
  paddingBottom: "10px",
  borderBottom: "1px solid #e2efe9",
};

const detailLabel: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#6b6b6b",
  margin: "0",
};

const detailValue: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#1a1a1a",
  margin: "0",
};

const previewCard: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  borderRadius: "6px",
  padding: "16px 20px",
  marginBottom: "24px",
  borderLeft: "3px solid #0F6E56",
};

const previewLabel: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#888888",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 6px",
};

const previewText: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#4a4a4a",
  fontStyle: "italic",
  margin: "0",
};

const buttonsSection: React.CSSProperties = {
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
  marginBottom: "10px",
};

const secondaryButtonWrapper: React.CSSProperties = {
  marginTop: "10px",
};

const secondaryButton: React.CSSProperties = {
  display: "block",
  backgroundColor: "transparent",
  color: "#0F6E56",
  fontSize: "15px",
  fontWeight: "600",
  textAlign: "center",
  textDecoration: "none",
  borderRadius: "6px",
  padding: "14px 32px",
  width: "100%",
  border: "1.5px solid #0F6E56",
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

export default ScopeFlagAlertEmail;
