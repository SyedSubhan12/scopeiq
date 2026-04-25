/**
 * Sandbox seeder — creates a complete demo workspace for a new user so they
 * can experience every feature before involving a real client.
 *
 * Call seedSandboxWorkspace() fire-and-forget after workspace creation.
 * All demo records carry { is_demo: true } in their metadata/evidence fields
 * wherever the schema permits it.
 */

import {
  db,
  clients,
  projects,
  statementsOfWork,
  sowClauses,
  deliverables,
  messages,
  scopeFlags,
  changeOrders,
  workspaces,
  writeAuditLog,
  generatePortalToken,
  eq,
} from "@novabots/db";
import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SandboxSettings {
  sandbox_mode: boolean;
  demo_client_id: string;
  demo_project_id: string;
  sandbox_expires_at: string;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function seedSandboxWorkspace(
  workspaceId: string,
  userId: string,
): Promise<void> {
  await db.transaction(async (trx) => {
    // -----------------------------------------------------------------------
    // 1. Demo client
    // -----------------------------------------------------------------------
    const clientId = randomUUID();
    await trx.insert(clients).values({
      id: clientId,
      workspaceId,
      name: "Acme Corp Demo",
      contactName: "Jordan Ellis",
      contactEmail: "jordan@acmedemo.example",
      notes:
        "Demo client created automatically. Safe to explore — nothing here involves a real client.",
      metadata: { is_demo: true },
    });

    await writeAuditLog(trx, {
      workspaceId,
      actorId: userId,
      actorType: "system",
      entityType: "client",
      entityId: clientId,
      action: "create",
      metadata: { is_demo: true, source: "sandbox_seeder" },
    });

    // -----------------------------------------------------------------------
    // 2. Demo project
    // -----------------------------------------------------------------------
    const projectId = randomUUID();
    const { raw: projectPortalTokenRaw } = generatePortalToken();

    await trx.insert(projects).values({
      id: projectId,
      workspaceId,
      clientId,
      name: "Brand Identity — Demo Project",
      description:
        "Full brand identity system for Acme Corp: logo, guidelines, and stationery. This is a demo project — all scope flags and change orders here are synthetic examples.",
      status: "active",
      budget: 12000,
      currency: "USD",
      startDate: formatDate(daysFromNow(-7)),
      endDate: formatDate(daysFromNow(30)),
      portalToken: projectPortalTokenRaw,
      portalEnabled: "true",
    });

    await writeAuditLog(trx, {
      workspaceId,
      actorId: userId,
      actorType: "system",
      entityType: "project",
      entityId: projectId,
      action: "create",
      metadata: { is_demo: true, source: "sandbox_seeder" },
    });

    // -----------------------------------------------------------------------
    // 3. Statement of Work with 3 clauses + exclusions
    // -----------------------------------------------------------------------
    const sowId = randomUUID();
    await trx.insert(statementsOfWork).values({
      id: sowId,
      workspaceId,
      title: "Brand Identity SOW — Acme Corp Demo",
      status: "active",
      parsedTextPreview:
        "Logo design — primary, secondary, and monochrome variants.\n" +
        "Brand guidelines document (typography, color palette, usage rules).\n" +
        "Stationery set (business card, letterhead, email signature).\n" +
        "EXCLUSIONS: Website design, social media content, print production.",
      parsingResultJson: { is_demo: true, source: "sandbox_seeder" },
    });

    await writeAuditLog(trx, {
      workspaceId,
      actorId: userId,
      actorType: "system",
      entityType: "statement_of_work",
      entityId: sowId,
      action: "create",
      metadata: { is_demo: true, source: "sandbox_seeder" },
    });

    // Link SOW to project
    await trx
      .update(projects)
      .set({ sowId, updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    // SOW clauses
    const clause1Id = randomUUID();
    const clause2Id = randomUUID();
    const clause3Id = randomUUID();
    const exclusionClauseId = randomUUID();

    await trx.insert(sowClauses).values([
      {
        id: clause1Id,
        sowId,
        clauseType: "deliverable",
        originalText:
          "Logo design — primary, secondary, and monochrome variants",
        summary: "Three logo variants covering all primary usage contexts",
        sortOrder: 1,
      },
      {
        id: clause2Id,
        sowId,
        clauseType: "deliverable",
        originalText:
          "Brand guidelines document (typography, color palette, usage rules)",
        summary:
          "Comprehensive brand guidelines covering type, colour, and usage",
        sortOrder: 2,
      },
      {
        id: clause3Id,
        sowId,
        clauseType: "deliverable",
        originalText:
          "Stationery set (business card, letterhead, email signature)",
        summary: "Full stationery suite for professional communications",
        sortOrder: 3,
      },
      {
        id: exclusionClauseId,
        sowId,
        clauseType: "exclusion",
        originalText:
          "Website design, social media content, print production are explicitly excluded from this engagement",
        summary:
          "Excludes digital/web build-out, social templates, and print production",
        sortOrder: 4,
      },
    ]);

    // -----------------------------------------------------------------------
    // 4. Deliverables
    // -----------------------------------------------------------------------
    const deliverable1Id = randomUUID();
    const deliverable2Id = randomUUID();
    const deliverable3Id = randomUUID();

    await trx.insert(deliverables).values([
      {
        id: deliverable1Id,
        workspaceId,
        projectId,
        name: "Logo Package",
        description:
          "Primary, secondary, and monochrome logo variants in SVG, PNG, and EPS formats",
        type: "file",
        status: "in_review",
        revisionRound: 1,
        maxRevisions: 3,
        metadata: { is_demo: true },
        dueDate: daysFromNow(14),
        uploadedBy: userId,
      },
      {
        id: deliverable2Id,
        workspaceId,
        projectId,
        name: "Brand Guidelines PDF",
        description:
          "30-page brand guidelines covering typography, colour palette, spacing system, and usage rules",
        type: "file",
        status: "draft",
        revisionRound: 0,
        maxRevisions: 2,
        metadata: { is_demo: true },
        dueDate: daysFromNow(21),
        uploadedBy: userId,
      },
      {
        id: deliverable3Id,
        workspaceId,
        projectId,
        name: "Stationery Set",
        description:
          "Business card (front/back), A4 letterhead, and HTML email signature",
        type: "file",
        status: "draft",
        revisionRound: 0,
        maxRevisions: 2,
        metadata: { is_demo: true },
        dueDate: daysFromNow(28),
        uploadedBy: userId,
      },
    ]);

    await writeAuditLog(trx, {
      workspaceId,
      actorId: userId,
      actorType: "system",
      entityType: "deliverable",
      entityId: deliverable1Id,
      action: "create",
      metadata: { is_demo: true, source: "sandbox_seeder" },
    });

    // -----------------------------------------------------------------------
    // 5. Pre-seeded messages (5 total; 2 will trigger scope flags)
    // -----------------------------------------------------------------------
    const msg1Id = randomUUID();
    const msg2Id = randomUUID();
    const msg3Id = randomUUID(); // out of scope — website
    const msg4Id = randomUUID();
    const msg5Id = randomUUID(); // out of scope — social media

    await trx.insert(messages).values([
      {
        id: msg1Id,
        workspaceId,
        projectId,
        authorName: "Jordan Ellis",
        source: "portal",
        status: "checked",
        body: "Can you make the logo a bit bigger and bolder? We want it to really stand out on the letterhead.",
      },
      {
        id: msg2Id,
        workspaceId,
        projectId,
        authorName: "Jordan Ellis",
        source: "portal",
        status: "checked",
        body: "Could we also get a version in blue? Something like a deep navy — #1A2B4C feels about right.",
      },
      {
        id: msg3Id,
        workspaceId,
        projectId,
        authorName: "Jordan Ellis",
        source: "portal",
        status: "flagged",
        body: "Can you build us a website too? We'd love one — even a simple five-page site would be amazing.",
      },
      {
        id: msg4Id,
        workspaceId,
        projectId,
        authorName: "Jordan Ellis",
        source: "portal",
        status: "checked",
        body: "What's the timeline looking like for the brand guidelines? Do we still expect those by end of month?",
      },
      {
        id: msg5Id,
        workspaceId,
        projectId,
        authorName: "Jordan Ellis",
        source: "portal",
        status: "flagged",
        body: "We also need 10 social media templates — Instagram, LinkedIn, and Twitter/X. Can you squeeze those in?",
      },
    ]);

    // -----------------------------------------------------------------------
    // 6. Scope flags (from messages 3 and 5)
    // -----------------------------------------------------------------------
    const flag1Id = randomUUID();
    const flag2Id = randomUUID();
    const slaDeadline1 = daysFromNow(3);
    const slaDeadline2 = daysFromNow(3);

    await trx.insert(scopeFlags).values([
      {
        id: flag1Id,
        workspaceId,
        projectId,
        sowClauseId: exclusionClauseId,
        messageText:
          "Can you build us a website too? We'd love one — even a simple five-page site would be amazing.",
        confidence: 0.96,
        severity: "high",
        status: "confirmed",
        title: "Website build requested — excluded from SOW",
        description:
          "The client is asking for a website, which is explicitly excluded from the current statement of work.",
        suggestedResponse:
          "I'd be happy to scope out a website project separately. Our current engagement covers brand identity only — a change order would be needed to add web development.",
        aiReasoning:
          "Message requests website development. The active SOW clause 4 explicitly excludes 'Website design' from scope. Confidence 0.96.",
        matchingClausesJson: [
          {
            clauseId: exclusionClauseId,
            clauseType: "exclusion",
            matchScore: 0.96,
          },
        ],
        evidence: {
          is_demo: true,
          messageId: msg3Id,
          keywords: ["website", "five-page site"],
        },
        flaggedBy: userId,
        slaDeadline: slaDeadline1,
      },
      {
        id: flag2Id,
        workspaceId,
        projectId,
        sowClauseId: exclusionClauseId,
        messageText:
          "We also need 10 social media templates — Instagram, LinkedIn, and Twitter/X. Can you squeeze those in?",
        confidence: 0.93,
        severity: "medium",
        status: "change_order_sent",
        title: "Social media templates requested — excluded from SOW",
        description:
          "The client is asking for social media templates, which are explicitly excluded from the current engagement.",
        suggestedResponse:
          "Social media templates are outside our current scope. We can absolutely create those — I've drafted a change order with the details and pricing.",
        aiReasoning:
          "Message requests social media templates. SOW clause 4 excludes 'social media content'. Confidence 0.93.",
        matchingClausesJson: [
          {
            clauseId: exclusionClauseId,
            clauseType: "exclusion",
            matchScore: 0.93,
          },
        ],
        evidence: {
          is_demo: true,
          messageId: msg5Id,
          keywords: ["social media templates", "Instagram", "LinkedIn"],
        },
        flaggedBy: userId,
        slaDeadline: slaDeadline2,
      },
    ]);

    await writeAuditLog(trx, {
      workspaceId,
      actorId: userId,
      actorType: "system",
      entityType: "scope_flag",
      entityId: flag1Id,
      action: "flag",
      metadata: { is_demo: true, source: "sandbox_seeder" },
    });

    await writeAuditLog(trx, {
      workspaceId,
      actorId: userId,
      actorType: "system",
      entityType: "scope_flag",
      entityId: flag2Id,
      action: "flag",
      metadata: { is_demo: true, source: "sandbox_seeder" },
    });

    // -----------------------------------------------------------------------
    // 7. Accepted change order (linked to flag 2 — social media templates)
    // -----------------------------------------------------------------------
    const changeOrderId = randomUUID();
    const now = new Date();
    const sentAt = daysFromNow(-2);
    const respondedAt = daysFromNow(-1);

    await trx.insert(changeOrders).values({
      id: changeOrderId,
      workspaceId,
      projectId,
      scopeFlagId: flag2Id,
      title: "Add-on: Social Media Template Pack",
      workDescription:
        "Design and deliver 10 branded social media templates sized for Instagram (square + story), LinkedIn (banner + post), and Twitter/X (header + post). Templates will be provided as editable Figma files and exported as PNG/PDF.",
      estimatedHours: 16,
      pricing: { amount: 2400, currency: "USD", type: "fixed" },
      currency: "USD",
      revisedTimeline: "Delivery within 10 business days of acceptance",
      status: "accepted",
      lineItemsJson: [
        {
          description: "Instagram templates (square + story)",
          quantity: 4,
          unitPrice: 150,
          total: 600,
        },
        {
          description: "LinkedIn templates (banner + post)",
          quantity: 4,
          unitPrice: 150,
          total: 600,
        },
        {
          description: "Twitter/X templates (header + post)",
          quantity: 2,
          unitPrice: 150,
          total: 300,
        },
        {
          description: "Figma source files + export pack",
          quantity: 1,
          unitPrice: 900,
          total: 900,
        },
      ],
      scopeItemsJson: [
        "10 branded social media templates",
        "Figma source files",
        "PNG and PDF exports",
      ],
      sentAt,
      respondedAt,
      signedAt: respondedAt,
      signedByName: "Jordan Ellis",
      createdBy: userId,
    });

    await writeAuditLog(trx, {
      workspaceId,
      actorId: userId,
      actorType: "system",
      entityType: "change_order",
      entityId: changeOrderId,
      action: "approve",
      metadata: {
        is_demo: true,
        source: "sandbox_seeder",
        signedByName: "Jordan Ellis",
      },
    });

    // -----------------------------------------------------------------------
    // 8. Update workspace settings_json with sandbox metadata
    // -----------------------------------------------------------------------
    const sandboxExpiresAt = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const sandboxSettings: SandboxSettings = {
      sandbox_mode: true,
      demo_client_id: clientId,
      demo_project_id: projectId,
      sandbox_expires_at: sandboxExpiresAt,
    };

    await trx
      .update(workspaces)
      .set({
        settingsJson: sandboxSettings,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId));

    await writeAuditLog(trx, {
      workspaceId,
      actorId: userId,
      actorType: "system",
      entityType: "workspace",
      entityId: workspaceId,
      action: "update",
      metadata: {
        is_demo: true,
        source: "sandbox_seeder",
        sandbox_mode: true,
        sandbox_expires_at: sandboxExpiresAt,
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/** Format a Date as YYYY-MM-DD for Drizzle `date` columns */
function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
