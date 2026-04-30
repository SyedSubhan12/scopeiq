import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PortalInvitationEmailProps {
  clientName: string;
  agencyName: string;
  projectName: string;
  portalUrl: string;
}

const baseStyle = {
  fontFamily: "'Inter', -apple-system, sans-serif",
  color: "#1a1a1a",
};

export function PortalInvitationEmail({
  clientName,
  agencyName,
  projectName,
  portalUrl,
}: PortalInvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{agencyName} has invited you to review {projectName}</Preview>
      <Body style={{ ...baseStyle, backgroundColor: "#f9fafb", padding: "32px 0" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "12px", padding: "40px", border: "1px solid #e5e7eb" }}>
          <Heading style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 8px" }}>
            You have been invited to {projectName}
          </Heading>
          <Text style={{ color: "#6b7280", margin: "0 0 24px" }}>
            Hi {clientName}, {agencyName} has set up a project portal for you to submit briefs, review deliverables, and communicate about {projectName}.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button
              href={portalUrl}
              style={{ backgroundColor: "#0F6E56", color: "#ffffff", padding: "14px 28px", borderRadius: "8px", fontWeight: "600", fontSize: "15px", textDecoration: "none" }}
            >
              Open your project portal
            </Button>
          </Section>
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Text style={{ fontSize: "12px", color: "#9ca3af", margin: "0" }}>
            This link is unique to you. Do not share it. Powered by ScopeIQ.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
