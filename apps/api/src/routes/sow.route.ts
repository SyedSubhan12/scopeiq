import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import {
  db,
  statementsOfWork,
  sowClauses,
  projects,
  eq,
  and,
  isNull,
} from "@novabots/db";
import { NotFoundError } from "@novabots/types";
import { dispatchParseSowJob } from "../jobs/parse-sow.job.js";

export const sowRouter = new Hono();

sowRouter.use("*", authMiddleware);

const createSowSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  rawText: z.string().min(10),
});

const updateClausesSchema = z.object({
  clauses: z.array(
    z.object({
      id: z.string().uuid().optional(),
      clauseType: z.enum(["deliverable", "revision_limit", "timeline", "exclusion", "payment_term", "other"]),
      originalText: z.string().min(1),
      summary: z.string().optional(),
      sortOrder: z.number().int().default(0),
    }),
  ),
});

// Create a SOW from pasted/typed text for a project
sowRouter.post("/", zValidator("json", createSowSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const { projectId, title, rawText } = c.req.valid("json");

  // Verify project belongs to workspace
  const [project] = await db
    .select({ id: projects.id, sowId: projects.sowId })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId), isNull(projects.deletedAt)))
    .limit(1);

  if (!project) throw new NotFoundError("Project", projectId);

  // Create SOW record
  const [sow] = await db
    .insert(statementsOfWork)
    .values({
      workspaceId,
      title,
      parsedTextPreview: rawText.slice(0, 500),
    })
    .returning();

  if (!sow) throw new Error("Failed to create SOW");

  // Attach SOW to project
  await db
    .update(projects)
    .set({ sowId: sow.id, updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  // Auto-parse simple clauses from newlines (each paragraph = one clause)
  const paragraphs = rawText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 10);

  if (paragraphs.length > 0) {
    await db.insert(sowClauses).values(
      paragraphs.map((text, i) => ({
        sowId: sow.id,
        clauseType: "other" as const,
        originalText: text,
        summary: null,
        sortOrder: i,
      })),
    );
  }

  const clauses = await db
    .select()
    .from(sowClauses)
    .where(eq(sowClauses.sowId, sow.id));

  // Dispatch AI parsing job to replace the simple paragraph-split with AI-structured clauses
  dispatchParseSowJob(sow.id, projectId, rawText).catch((err) =>
    console.error("[SOW] Failed to dispatch parse-sow job:", err),
  );

  return c.json({ data: { ...sow, clauses } }, 201);
});

// Get SOW with clauses by ID
sowRouter.get("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const id = c.req.param("id");

  const [sow] = await db
    .select()
    .from(statementsOfWork)
    .where(and(eq(statementsOfWork.id, id), eq(statementsOfWork.workspaceId, workspaceId), isNull(statementsOfWork.deletedAt)))
    .limit(1);

  if (!sow) throw new NotFoundError("SOW", id);

  const clauses = await db
    .select()
    .from(sowClauses)
    .where(eq(sowClauses.sowId, sow.id))
    .orderBy(sowClauses.sortOrder);

  return c.json({ data: { ...sow, clauses } });
});

// Replace all clauses (after agency review / editing)
sowRouter.patch("/:id/clauses", zValidator("json", updateClausesSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const id = c.req.param("id");
  const { clauses } = c.req.valid("json");

  const [sow] = await db
    .select({ id: statementsOfWork.id })
    .from(statementsOfWork)
    .where(and(eq(statementsOfWork.id, id), eq(statementsOfWork.workspaceId, workspaceId)))
    .limit(1);

  if (!sow) throw new NotFoundError("SOW", id);

  // Replace clauses
  await db.delete(sowClauses).where(eq(sowClauses.sowId, sow.id));

  if (clauses.length > 0) {
    await db.insert(sowClauses).values(
      clauses.map((clause, i) => ({
        sowId: sow.id,
        clauseType: clause.clauseType,
        originalText: clause.originalText,
        summary: clause.summary ?? null,
        sortOrder: clause.sortOrder ?? i,
      })),
    );
  }

  const updated = await db
    .select()
    .from(sowClauses)
    .where(eq(sowClauses.sowId, sow.id))
    .orderBy(sowClauses.sortOrder);

  return c.json({ data: updated });
});
