import { dispatchJob } from "../lib/queue.js";
import { db, briefFields, eq } from "@novabots/db";

const QUEUE_NAME = "brief-scoring";
const JOB_NAME = "score-brief";

export async function dispatchScoreBriefJob(briefId: string): Promise<string> {
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
    fields: fields.map((f) => ({
      field_key: f.field_key,
      field_label: f.field_label,
      field_type: f.field_type,
      value: f.value,
    })),
  });
}
