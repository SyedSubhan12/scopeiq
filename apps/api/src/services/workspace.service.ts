import { workspaceRepository } from "../repositories/workspace.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { writeAuditLog, workspaces } from "@novabots/db";
import { db } from "@novabots/db";
import { NotFoundError } from "@novabots/types";
import { stripUndefined } from "../lib/strip-undefined.js";

export type AiPolicyUpdate = Partial<
  Pick<
    typeof workspaces.$inferInsert,
    | "briefScoreThreshold"
    | "scopeGuardThreshold"
    | "autoHoldEnabled"
    | "autoApproveAfterDays"
  >
>;

const REQUIRED_ONBOARDING_STEPS = [
  "workspace_named",
  "service_type",
  "brief_link",
  "sandbox",
] as const;

export const workspaceService = {
  async listWorkspaceUsers(workspaceId: string) {
    return userRepository.listWorkspaceUsers(workspaceId);
  },

  async getWorkspace(workspaceId: string) {
    const workspace = await workspaceRepository.getById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }
    return workspace;
  },

  async updateOnboardingStep(
    workspaceId: string,
    step: string,
    complete: boolean,
  ) {
    const workspace = await workspaceRepository.getById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace", workspaceId);

    const progress = (workspace.onboardingProgress as {
      completedSteps?: string[];
      completedAt?: string;
    } | null) ?? { completedSteps: [] };

    const completedSteps: string[] = progress.completedSteps ?? [];

    if (complete && !completedSteps.includes(step)) {
      completedSteps.push(step);
    } else if (!complete) {
      const idx = completedSteps.indexOf(step);
      if (idx >= 0) completedSteps.splice(idx, 1);
    }

    const isFullyOnboarded = REQUIRED_ONBOARDING_STEPS.every((s) =>
      completedSteps.includes(s),
    );

    const updated = await workspaceRepository.update(workspaceId, {
      onboardingProgress: {
        completedSteps,
        completedAt: isFullyOnboarded
          ? (progress.completedAt ?? new Date().toISOString())
          : undefined,
      },
    });

    return updated;
  },

  async updateWorkspace(
    workspaceId: string,
    actorId: string,
    data: Record<string, unknown>,
  ) {
    const workspace = await workspaceRepository.update(workspaceId, stripUndefined(data));
    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "workspace",
      entityId: workspaceId,
      action: "update",
      metadata: { fields: Object.keys(data) },
    });

    return workspace;
  },

  async updateAiPolicy(
    workspaceId: string,
    actorId: string,
    data: AiPolicyUpdate,
  ) {
    const result = await db.transaction(async (trx) => {
      const updated = await workspaceRepository.updateAiPolicy(
        workspaceId,
        stripUndefined(data) as AiPolicyUpdate,
        trx,
      );
      if (!updated) throw new NotFoundError("Workspace", workspaceId);

      await writeAuditLog(trx, {
        workspaceId,
        actorId,
        entityType: "workspace",
        entityId: workspaceId,
        action: "update",
        metadata: { fields: Object.keys(data), context: "ai_policy" },
      });

      return updated;
    });

    return result;
  },
};
