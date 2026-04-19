import { dispatchJob } from "../lib/queue.js";
import { db, briefFields, eq } from "@novabots/db";

const QUEUE_NAME = "brief-scoring";
const JOB_NAME = "score-brief";

// Default auto-hold threshold. Planned: read from workspace_settings.brief_hold_threshold
// once the workspace settings feature is shipped (see workspaces table migration).
const DEFAULT_BRIEF_HOLD_THRESHOLD = 70;

export async function dispatchScoreBriefJob(
  briefId: string,
  threshold: number = DEFAULT_BRIEF_HOLD_THRESHOLD,
): Promise<string> {
  // Pre-fetch brief fields so the worker doesn't need DB access
  const fields = await db
    .select({
      field_key: briefFields.fieldKey,
      field_label: briefFields.fieldLabel,
      field_type: briefFields.fieldType,
      value: briefFields.value,
    })
    .from(briefFields)
    .where(eq(briefFields.briefId, briefId))
    .orderBy(briefFields.sortOrder);

  return dispatchJob(QUEUE_NAME, JOB_NAME, {
    brief_id: briefId,
    threshold,
    fields: fields.map((f) => ({
      field_key: f.field_key,
      field_label: f.field_label,
      field_type: f.field_type,
      value: f.value,
    })),
  });
}
