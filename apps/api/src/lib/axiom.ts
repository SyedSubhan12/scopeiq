/**
 * Axiom metrics instrumentation for ScopeIQ performance SLAs.
 * Tracks p95 latency for scope flag detection, change order generation,
 * and portal page load times.
 */

interface AxiomEvent {
  measurement: string;
  tags: Record<string, string>;
  fields: Record<string, number | string | boolean>;
  timestamp: number;
}

let axiomToken: string | null = null;
let axiomDataset = "scopeiq-metrics";
let axiomBuffer: AxiomEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER_SIZE = 100;

function getAxiomConfig(): { token: string; dataset: string } | null {
  if (!axiomToken) {
    axiomToken = process.env.AXIOM_INGEST_TOKEN ?? null;
    axiomDataset = process.env.AXIOM_DATASET ?? "scopeiq-metrics";
  }
  if (!axiomToken) return null;
  return { token: axiomToken, dataset: axiomDataset };
}

async function flushToAxiom(): Promise<void> {
  const config = getAxiomConfig();
  if (!config) return;

  const events = [...axiomBuffer];
  axiomBuffer = [];

  if (events.length === 0) return;

  try {
    const response = await fetch(`https://api.axiom.co/v1/datasets/${config.dataset}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(events),
    });

    if (!response.ok) {
      console.error(`[Axiom] Failed to flush metrics: ${response.status} ${response.statusText}`);
      // Re-queue events on failure
      axiomBuffer.unshift(...events);
    }
  } catch (error) {
    console.error("[Axiom] Error flushing metrics:", error);
    axiomBuffer.unshift(...events);
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    await flushToAxiom();
    scheduleFlush();
  }, FLUSH_INTERVAL_MS);
}

function recordEvent(measurement: string, tags: Record<string, string>, fields: Record<string, number | string | boolean>): void {
  const event: AxiomEvent = {
    measurement,
    tags,
    fields,
    timestamp: Date.now(),
  };

  axiomBuffer.push(event);

  if (axiomBuffer.length >= MAX_BUFFER_SIZE) {
    void flushToAxiom();
  }

  scheduleFlush();
}

/**
 * Record scope flag detection duration.
 * SLA: <5s p95
 */
export function recordScopeFlagDuration(durationMs: number, slaMet: boolean): void {
  recordEvent(
    "scope_flag_detection",
    { type: "sla", sla_target: "5000ms" },
    { duration_ms: durationMs, sla_met: slaMet },
  );
}

/**
 * Record change order generation duration.
 * SLA: <5s p95
 */
export function recordChangeOrderDuration(durationMs: number, slaMet: boolean): void {
  recordEvent(
    "change_order_generation",
    { type: "sla", sla_target: "5000ms" },
    { duration_ms: durationMs, sla_met: slaMet },
  );
}

/**
 * Record portal page load time.
 * SLA: <2s p95
 */
export function recordPortalLoadTime(workspaceId: string, durationMs: number): void {
  recordEvent(
    "portal_page_load",
    { type: "rum", workspace_id: workspaceId, sla_target: "2000ms" },
    { duration_ms: durationMs },
  );
}

/**
 * Flush any pending metrics (call on graceful shutdown).
 */
export async function flushMetrics(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await flushToAxiom();
}
