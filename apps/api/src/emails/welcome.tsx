import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  dashboardUrl: string;
  calendlyUrl: string;
  agencyLogoUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scopeiq.app";

export function WelcomeEmail({
  name,
  dashboardUrl,
  calendlyUrl,
  agencyLogoUrl,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to ScopeIQ - Let&apos;s get you started</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Agency Logo */}
          {agencyLogoUrl && (
            <Section style={logoSection}>
              <Img src={agencyLogoUrl} alt="Agency logo" width={140} style={logo} />
            </Section>
          )}

          {/* Heading */}
          <Heading style={heading}>Welcome to ScopeIQ!</Heading>
          <Text style={greeting}>Hi {name},</Text>
          <Text style={paragraph}>
            Thanks for joining ScopeIQ. We&apos;re here to help you manage scopes,
            deliverables, and client approvals without the chaos. Let&apos;s get you set up in
            three quick steps.
          </Text>

          {/* Quick Start Guide */}
          <Section style={stepsSection}>
            <Heading as="h2" style={stepsHeading}>Quick Start Guide</Heading>

            <Section style={stepRow}>
              <Text style={stepNumber}>1</Text>
              <Text style={stepText}>
                <strong>Upload your brand</strong> - Add your agency logo and brand colors to
                personalize client-facing documents.
              </Text>
            </Section>

            <Section style={stepRow}>
              <Text style={stepNumber}>2</Text>
              <Text style={stepText}>
                <strong>Create your first project</strong> - Set up a project, attach a brief, and
                invite your team.
              </Text>
            </Section>

            <Section style={stepRow}>
              <Text style={stepNumber}>3</Text>
              <Text style={stepText}>
                <strong>Share your portal</strong> - Send your client the portal link so they can
                review deliverables and approve work.
              </Text>
            </Section>
          </Section>

          {/* CTA Button */}
          <Section style={ctaSection}>
            <Button href={dashboardUrl} style={primaryButton}>
              Go to Dashboard
            </Button>
          </Section>

          <Text style={paragraph}>
            Want a guided walkthrough? Book a free 15-minute onboarding call with our team.
          </Text>

          <Section style={secondaryCtaSection}>
            <Button href={calendlyUrl} style={secondaryButton}>
              Schedule Onboarding Call
            </Button>
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

const logoSection: React.CSSProperties = {
  padding: "32px 40px 0",
};

const logo: React.CSSProperties = {
  display: "block",
};

const heading: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#0F6E56",
  textAlign: "left",
  padding: "24px 40px 0",
  margin: 0,
};

const greeting: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a1a",
  padding: "20px 40px 0",
  margin: 0,
};

const paragraph: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#4a4a4a",
  padding: "0 40px",
  margin: "12px 0",
};

const stepsSection: React.CSSProperties = {
  margin: "24px 40px 0",
  backgroundColor: "#f0faf6",
  borderRadius: "8px",
  padding: "24px",
};

const stepsHeading: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#0F6E56",
  margin: "0 0 16px",
};

const stepRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "12px",
};

const stepNumber: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#ffffff",
  backgroundColor: "#0F6E56",
  borderRadius: "50%",
  width: "26px",
  height: "26px",
  lineHeight: "26px",
  textAlign: "center",
  margin: "0 0 4px",
  flexShrink: 0,
};

const stepText: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#1a1a1a",
  margin: "0",
  paddingTop: "2px",
};

const ctaSection: React.CSSProperties = {
  padding: "24px 40px 0",
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

const secondaryCtaSection: React.CSSProperties = {
  padding: "12px 40px 0",
};

const secondaryButton: React.CSSProperties = {
  display: "block",
  backgroundColor: "transparent",
  color: "#0F6E56",
  fontSize: "14px",
  fontWeight: "600",
  textAlign: "center",
  textDecoration: "none",
  borderRadius: "6px",
  padding: "12px 32px",
  width: "100%",
  border: "1.5px solid #0F6E56",
};

const divider: React.CSSProperties = {
  borderColor: "#e8e8e8",
  margin: "32px 40px 0",
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

export default WelcomeEmail;
