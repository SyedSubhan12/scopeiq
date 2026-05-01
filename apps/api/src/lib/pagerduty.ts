/**
 * PagerDuty Events API v2 helper for ScopeIQ SLA breach alerting.
 * Fire-and-forget — never throws; logs a warning if the routing key is absent.
 */

export interface PagerDutyAlertOptions {
  summary: string;
  severity: "critical" | "error" | "warning" | "info";
  source: string;
  dedupKey: string;
}

interface PagerDutyPayload {
  routing_key: string;
  event_action: "trigger";
  dedup_key: string;
  payload: {
    summary: string;
    severity: string;
    source: string;
    timestamp: string;
  };
}

export async function sendPagerDutyAlert(opts: PagerDutyAlertOptions): Promise<void> {
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY;

  if (!routingKey) {
    console.warn("[PagerDuty] PAGERDUTY_ROUTING_KEY is not set — skipping alert:", opts.summary);
    return;
  }

  const body: PagerDutyPayload = {
    routing_key: routingKey,
    event_action: "trigger",
    dedup_key: opts.dedupKey,
    payload: {
      summary: opts.summary,
      severity: opts.severity,
      source: opts.source,
      timestamp: new Date().toISOString(),
    },
  };

  try {
    const response = await fetch("https://events.pagerduty.com/v2/enqueue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.pagerduty+json;version=2",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(
        `[PagerDuty] Failed to enqueue alert (${response.status}): ${opts.summary}`,
      );
    }
  } catch (err) {
    console.error("[PagerDuty] Network error while sending alert:", err);
  }
}
