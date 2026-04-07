import { Worker } from "bullmq";
import { getRedisConnection } from "../lib/redis.js";
import { env } from "../lib/env.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${env.PORT || 4000}`;
const AI_CALLBACK_SECRET = process.env.AI_CALLBACK_SECRET || "dev-secret-change-me";

interface ScoreBriefJobData {
  brief_id: string;
  fields: Array<{
    field_key: string;
    field_label: string;
    field_type: string;
    value: string | null;
  }>;
}

let workerInstance: Worker | null = null;

export function startBriefScoringWorker(): Worker {
  if (workerInstance) {
    return workerInstance;
  }

  workerInstance = new Worker<ScoreBriefJobData>(
    "brief-scoring",
    async (job) => {
      const { brief_id, fields } = job.data;

      console.log(`[BriefScoring] Processing brief ${brief_id} (job ${job.id})`);

      // Call external AI service for scoring
      const aiResponse = await fetch(`${AI_SERVICE_URL}/v1/ai/predict-clarity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });

      if (!aiResponse.ok) {
        throw new Error(
          `AI service returned ${aiResponse.status} for brief ${brief_id}`,
        );
      }

      const aiResult = (await aiResponse.json()) as {
        score: number;
        summary: string;
        flags: Array<{
          fieldKey: string;
          reason: string;
          severity: string;
          suggestedQuestion: string;
        }>;
        status: "clarification_needed" | "scored";
        flagCount: number;
      };

      // Post result back to the callback endpoint (which handles DB write + idempotency)
      const callbackResponse = await fetch(
        `${API_BASE_URL}/api/ai-callback/brief-scored`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-AI-Secret": AI_CALLBACK_SECRET,
          },
          body: JSON.stringify({
            briefId: brief_id,
            score: aiResult.score,
            summary: aiResult.summary,
            flags: aiResult.flags,
            status: aiResult.status,
            flagCount: aiResult.flagCount,
            jobId: job.id,
          }),
        },
      );

      if (!callbackResponse.ok) {
        throw new Error(
          `Callback endpoint returned ${callbackResponse.status} for brief ${brief_id}`,
        );
      }

      const callbackBody = (await callbackResponse.json()) as Record<string, unknown>;
      console.log(
        `[BriefScoring] Brief ${brief_id} scored: score=${aiResult.score}, status=${aiResult.status}`,
      );

      return callbackBody;
    },
    {
      connection: getRedisConnection(),
      concurrency: 2,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 },
    },
  );

  workerInstance.on("completed", (job) => {
    console.log(`[BriefScoring] Job ${job.id} completed successfully`);
  });

  workerInstance.on("failed", (job, err) => {
    console.error(`[BriefScoring] Job ${job?.id ?? "unknown"} failed:`, err.message);
  });

  workerInstance.on("error", (err) => {
    console.error("[BriefScoring] Worker error:", err.message);
  });

  console.log("[BriefScoring] Worker started");
  return workerInstance;
}
