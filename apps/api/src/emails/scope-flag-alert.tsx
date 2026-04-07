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

interface ScopeFlagAlertEmailProps {
  recipientName: string;
  flagTitle: string;
  flagSeverity: "low" | "medium" | "high";
  flagConfidence: number;
  flagDescription: string | null;
  projectName: string;
  dashboardUrl: string;
}

const severityConfig: Record<"low" | "medium" | "high", { color: string; label: string }> = {
  low: { color: "#0F6E56", label: "Low" },
  medium: { color: "#d4870e", label: "Medium" },
  high: { color: "#c0392b", label: "High" },
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scopeiq.app";

export function ScopeFlagAlertEmail({
  recipientName,
  flagTitle,
  flagSeverity,
  flagConfidence,
  flagDescription,
  projectName,
  dashboardUrl,
}: ScopeFlagAlertEmailProps) {
  const severity = severityConfig[flagSeverity];

  return (
    <Html>
      <Head />
      <Preview>New Scope Flag requires your attention</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Accent Bar */}
          <Section style={{ ...accentBar, backgroundColor: severity.color }} />

          <Section style={contentSection}>
            <Heading style={heading}>New Scope Flag requires your attention</Heading>

            <Text style={paragraph}>
              Hi {recipientName}, our AI has detected a potential scope deviation in "{projectName}".
              Please review the flag below and take appropriate action.
            </Text>

            {/* Flag Details Card */}
            <Section style={flagCard}>
              <Text style={flagTitleText}>{flagTitle}</Text>

              <table style={{ width: "100%", marginBottom: "12px" }}>
                <tr>
                  <td style={{ width: "50%", paddingBottom: "8px" }}>
                    <Text style={metaLabel}>Severity</Text>
                    <Text style={{ ...metaValue, color: severity.color }}>{severity.label}</Text>
                  </td>
                  <td style={{ width: "50%", paddingBottom: "8px" }}>
                    <Text style={metaLabel}>Confidence</Text>
                    <Text style={metaValue}>{Math.round(flagConfidence * 100)}%</Text>
                  </td>
                </tr>
              </table>

              {flagDescription && (
                <Text style={descriptionText}>{flagDescription}</Text>
              )}
            </Section>

            {/* CTA Button */}
            <Section style={ctaSection}>
              <Button href={dashboardUrl} style={primaryButton}>
                View in Dashboard
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

const accentBar: React.CSSProperties = {
  height: "4px",
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

const paragraph: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#4a4a4a",
  margin: "0 0 24px",
};

const flagCard: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  borderRadius: "6px",
  padding: "16px 20px",
  marginBottom: "24px",
};

const flagTitleText: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0 0 12px",
};

const metaLabel: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#888888",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const metaValue: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0",
};

const descriptionText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#4a4a4a",
  margin: "12px 0 0",
};

const ctaSection: React.CSSProperties = {
  paddingBottom: "16px",
};

const primaryButton: React.CSSProperties = {
  display: "block",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textAlign: "center",
  textDecoration: "none",
  borderRadius: "6px",
  padding: "14px 32px",
  width: "100%",
  backgroundColor: "#0F6E56",
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
