import { Resend } from "resend";
import { render } from "@react-email/components";
import { ApprovalReminderEmail } from "../emails/approval-reminder.js";
import { ScopeFlagAlertEmail } from "../emails/scope-flag-alert.js";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@scopeiq.com";

export interface SendReminderEmailOptions {
  to: string;
  deliverableName: string;
  recipientName: string;
  step: 1 | 2 | 3;
  approvalStep: "gentle_nudge" | "deadline_warning" | "silence_approval";
  reviewUrl: string;
  deliverableId: string;
  projectId: string;
  deadlineDate?: string;
  approveUrl?: string;
  declineUrl?: string;
}

export async function sendReminderEmail(opts: SendReminderEmailOptions): Promise<void> {
  const html = await render(
    ApprovalReminderEmail({
      recipientName: opts.recipientName,
      deliverableName: opts.deliverableName,
      step: opts.step,
      approvalStep: opts.approvalStep,
      reviewUrl: opts.reviewUrl,
      ...(opts.deadlineDate ? { deadlineDate: opts.deadlineDate } : {}),
      ...(opts.approveUrl ? { approveUrl: opts.approveUrl } : {}),
      ...(opts.declineUrl ? { declineUrl: opts.declineUrl } : {}),
    }),
  );

  const subject = getSubject(opts.approvalStep, opts.deliverableName);

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

function getSubject(step: "gentle_nudge" | "deadline_warning" | "silence_approval", deliverableName: string): string {
  switch (step) {
    case "gentle_nudge":
      return `Feedback requested — ${deliverableName}`;
    case "deadline_warning":
      return `Action needed: Review pending for ${deliverableName}`;
    case "silence_approval":
      return `Final notice: ${deliverableName} will be auto-approved in 48h`;
    default:
      return `Update: ${deliverableName}`;
  }
}

// ---------------------------------------------------------------------------
// Scope Flag Alert Email
// ---------------------------------------------------------------------------

export interface SendScopeFlagAlertOptions {
  to: string;
  recipientName: string;
  flagTitle: string;
  flagSeverity: "low" | "medium" | "high";
  flagConfidence: number;
  flagDescription: string | null;
  projectName: string;
  flagId: string;
  dashboardUrl?: string;
}

export async function sendScopeFlagAlertEmail(opts: SendScopeFlagAlertOptions): Promise<void> {
  const dashboardUrl = opts.dashboardUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://scopeiq.app"}/dashboard`;
  const html = await render(
    ScopeFlagAlertEmail({
      recipientName: opts.recipientName,
      flagTitle: opts.flagTitle,
      flagSeverity: opts.flagSeverity,
      flagConfidence: opts.flagConfidence,
      flagDescription: opts.flagDescription,
      projectName: opts.projectName,
      dashboardUrl,
    }),
  );

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: opts.to,
    subject: "New Scope Flag requires your attention",
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
