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

interface BriefClarificationEmailProps {
  recipientName: string;
  briefTitle: string;
  flaggedFields: Array<{ field: string; question: string }>;
  clarificationUrl: string;
  deadline: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scopeiq.app";

export function BriefClarificationEmail({
  recipientName,
  briefTitle,
  flaggedFields,
  clarificationUrl,
  deadline,
}: BriefClarificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your brief needs clarification before proceeding</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* ScopeIQ Brand Header */}
          <Section style={brandBar} />

          <Section style={contentSection}>
            <Heading style={heading}>Your Brief Needs Clarification</Heading>

            <Text style={greeting}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              Our AI review of <strong>{briefTitle}</strong> flagged a few fields that need your
              input before we can finalize the brief. Please review the questions below and respond
              through the portal.
            </Text>

            {/* Flagged Fields List */}
            <Section style={flagsSection}>
              {flaggedFields.map((item, index) => (
                <Section key={index} style={flagRow}>
                  <Text style={flagField}>{item.field}</Text>
                  <Text style={flagQuestion}>{item.question}</Text>
                </Section>
              ))}
            </Section>

            {/* Deadline */}
            <Section style={deadlineSection}>
              <Text style={deadlineText}>
                <strong>Response deadline:</strong> {deadline}
              </Text>
              <Text style={deadlineSubtext}>
                If we don&apos;t hear back by this date, the brief will be placed on hold.
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={ctaSection}>
              <Button href={clarificationUrl} style={primaryButton}>
                Reply to Brief
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

const flagsSection: React.CSSProperties = {
  backgroundColor: "#fff8f0",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "20px",
  border: "1px solid #ffe0c0",
};

const flagRow: React.CSSProperties = {
  marginBottom: "16px",
  paddingBottom: "16px",
  borderBottom: "1px solid #ffe0c0",
};

const flagField: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#0F6E56",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 6px",
};

const flagQuestion: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#1a1a1a",
  margin: "0",
};

const deadlineSection: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  borderRadius: "6px",
  padding: "14px 18px",
  marginBottom: "24px",
};

const deadlineText: React.CSSProperties = {
  fontSize: "14px",
  color: "#1a1a1a",
  margin: "0 0 4px",
};

const deadlineSubtext: React.CSSProperties = {
  fontSize: "13px",
  color: "#888888",
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

export default BriefClarificationEmail;
