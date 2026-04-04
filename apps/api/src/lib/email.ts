import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "ScopeIQ <noreply@scopeiq.io>";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function sendInviteEmail(params: {
  to: string;
  token: string;
  workspaceName: string;
  inviterName?: string;
  role: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // No key configured — skip silently (invite.service.ts already logs the URL)
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const inviteUrl = `${APP_URL}/invite/${params.token}`;

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `You've been invited to join ${params.workspaceName} on ScopeIQ`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #111;">
        <div style="margin-bottom: 32px;">
          <span style="font-size: 20px; font-weight: 700; color: #0F6E56;">ScopeIQ</span>
        </div>

        <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 12px;">
          You're invited to join ${params.workspaceName}
        </h1>

        <p style="color: #555; line-height: 1.6; margin-bottom: 8px;">
          ${params.inviterName ? `<strong>${params.inviterName}</strong> has invited you` : "You've been invited"} to join
          <strong>${params.workspaceName}</strong> on ScopeIQ as a <strong>${params.role}</strong>.
        </p>

        <p style="color: #555; line-height: 1.6; margin-bottom: 28px;">
          Click the button below to create your account and accept the invitation.
          This link expires in <strong>7 days</strong>.
        </p>

        <a href="${inviteUrl}"
           style="display: inline-block; background: #0F6E56; color: white; text-decoration: none;
                  padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
          Accept Invitation
        </a>

        <p style="margin-top: 24px; font-size: 12px; color: #999;">
          Or copy this link: <a href="${inviteUrl}" style="color: #0F6E56;">${inviteUrl}</a>
        </p>

        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #bbb;">
          ScopeIQ helps creative agencies manage briefs, deliverables, and approvals.
        </p>
      </div>
    `,
  });
}
