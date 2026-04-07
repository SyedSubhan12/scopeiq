import { Worker } from "bullmq";
import { getRedisConnection } from "../lib/redis.js";
import { dispatchJob } from "../lib/queue.js";

interface ClarificationEmailData {
  briefId: string;
  clientEmail: string;
  clientName: string;
  projectName: string;
  portalUrl: string;
  flags: Array<{
    fieldKey: string;
    fieldLabel: string;
    prompt: string;
    severity: string;
  }>;
}

let workerInstance: Worker | null = null;

export function startClarificationEmailWorker(): Worker {
  if (workerInstance) {
    return workerInstance;
  }

  workerInstance = new Worker<ClarificationEmailData>(
    "clarification-emails",
    async (job) => {
      const { clientEmail, clientName, projectName, portalUrl, flags } = job.data;

      console.log(
        `[ClarificationEmail] Sending to ${clientEmail} for brief ${job.data.briefId}`,
      );

      const questionsHtml = flags
        .map(
          (f, i) => `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>${i + 1}. ${f.fieldLabel || f.fieldKey}</strong>
              <p style="margin: 4px 0 0; color: #6b7280;">${f.prompt}</p>
            </td>
          </tr>`,
        )
        .join("");

      const emailPayload = {
        from: "ScopeIQ <noreply@scopeiq.com>",
        to: clientEmail,
        subject: `Action needed: A few more details for ${projectName}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
            <h2 style="color: #111827;">A few more details needed</h2>
            <p style="color: #6b7280;">Hi ${clientName},</p>
            <p style="color: #374151;">
              We've reviewed your brief for <strong>${projectName}</strong> and need a bit more 
              clarity on a few items before we can get started. Please answer the following 
              questions so we can begin work:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
              ${questionsHtml}
            </table>
            <a href="${portalUrl}" 
               style="display: inline-block; background: #0F6E56; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; font-weight: 600;">
              Complete Your Brief
            </a>
            <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
              This usually takes just a few minutes. Once you resubmit, we'll review and get back 
              to you promptly.
            </p>
          </div>`,
      };

      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.warn(
          "[ClarificationEmail] RESEND_API_KEY not set — skipping email send (dev mode)",
        );
        return { skipped: true, reason: "no_api_key" };
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(emailPayload),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Resend API returned ${res.status}: ${body}`);
      }

      const result = (await res.json()) as { id: string };
      console.log(`[ClarificationEmail] Email sent: ${result.id}`);
      return result;
    },
    {
      connection: getRedisConnection(),
      concurrency: 3,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 },
    },
  );

  workerInstance.on("completed", (job) => {
    console.log(`[ClarificationEmail] Job ${job.id} completed`);
  });

  workerInstance.on("failed", (job, err) => {
    console.error(
      `[ClarificationEmail] Job ${job?.id ?? "unknown"} failed:`,
      err.message,
    );
  });

  console.log("[ClarificationEmail] Worker started");
  return workerInstance;
}

export function dispatchClarificationEmail(
  data: ClarificationEmailData,
): Promise<string> {
  return dispatchJob("clarification-emails", "send_clarification_email", data as unknown as Record<string, unknown>);
}
