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

type ApprovalStep = "gentle_nudge" | "deadline_warning" | "silence_approval";

interface ApprovalReminderEmailProps {
  recipientName: string;
  deliverableName: string;
  step: 1 | 2 | 3;
  approvalStep: ApprovalStep;
  reviewUrl: string;
  deadlineDate?: string;
}

const stepConfig: Record<1 | 2 | 3, { heading: string; tone: "info" | "warning" | "urgent" }> = {
  1: { heading: "Quick Reminder: Feedback Requested", tone: "info" },
  2: { heading: "Action Needed: Review Pending", tone: "warning" },
  3: { heading: "Final Notice: Auto-Approval Approaching", tone: "urgent" },
};

const toneColors: Record<"info" | "warning" | "urgent", string> = {
  info: "#0F6E56",
  warning: "#d4870e",
  urgent: "#c0392b",
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scopeiq.app";

export function ApprovalReminderEmail({
  recipientName,
  deliverableName,
  step,
  approvalStep,
  reviewUrl,
  deadlineDate,
}: ApprovalReminderEmailProps) {
  const config = stepConfig[step];
  const accentColor = toneColors[config.tone];

  let bodyText: string;

  switch (approvalStep) {
    case "gentle_nudge":
      bodyText = `Hi ${recipientName}, just a friendly reminder - we'd love your feedback on "${deliverableName}". Your input helps us deliver the best result. Take a look when you get a chance.`;
      break;
    case "deadline_warning":
      bodyText = `"${deliverableName}" is awaiting your review. Please respond by ${deadlineDate ?? "the end of this week"} so we can keep the project on schedule.`;
      break;
    case "silence_approval":
      bodyText = `Per our agreement, "${deliverableName}" will be marked as approved in 48 hours if we don't hear from you. If you'd like to request changes, please review it before then.`;
      break;
  }

  return (
    <Html>
      <Head />
      <Preview>
        {config.heading} - {deliverableName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Accent Bar */}
          <Section style={{ ...accentBar, backgroundColor: accentColor }} />

          <Section style={contentSection}>
            <Heading style={heading}>{config.heading}</Heading>

            <Text style={paragraph}>{bodyText}</Text>

            {/* Deliverable Reference */}
            <Section style={referenceCard}>
              <Text style={referenceLabel}>Deliverable</Text>
              <Text style={referenceValue}>{deliverableName}</Text>
            </Section>

            {/* CTA Button */}
            <Section style={ctaSection}>
              <Button
                href={reviewUrl}
                style={{
                  ...primaryButton,
                  backgroundColor: accentColor,
                }}
              >
                Review Now
              </Button>
            </Section>

            {/* Step-specific note */}
            {step === 3 && (
              <Text style={countdownText}>
                Auto-approval countdown: 48 hours remaining
              </Text>
            )}
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

const referenceCard: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  borderRadius: "6px",
  padding: "16px 20px",
  marginBottom: "24px",
};

const referenceLabel: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#888888",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const referenceValue: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0",
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
};

const countdownText: React.CSSProperties = {
  fontSize: "13px",
  color: "#c0392b",
  fontWeight: "500",
  textAlign: "center",
  margin: "12px 0 32px",
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

export default ApprovalReminderEmail;
