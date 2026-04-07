/**
 * Test database setup — seeds required data via raw SQL + pg driver.
 * Run BEFORE tests to ensure a clean, known state.
 *
 * Usage:
 *   npx tsx test-setup.ts          # seed all tables
 *   npx tsx test-setup.ts --clean  # truncate + seed
 */
import pg from "pg";
import crypto from "node:crypto";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://scopeiq:scopeiq_dev@localhost:5433/scopeiq";

const pool = new pg.Pool({ connectionString: DATABASE_URL });

// ── Fixed test IDs (deterministic for CI repeatability) ──────────────────────

const T = {
  workspaceId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  ownerId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  clientId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  projectId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  deliverableId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  sowId: "ffffffff-ffff-ffff-ffff-ffffffffffff",
  sowClauseId: "11111111-1111-1111-1111-111111111111",
  revisionLimitClauseId: "22222222-2222-2222-2222-222222222222",
  scopeFlagId: "33333333-3333-3333-3333-333333333333",
  changeOrderId: "44444444-4444-4444-4444-444444444444",
  messageId: "55555555-5555-5555-5555-555555555555",
  inScopeMessageId: "66666666-6666-6666-6666-666666666666",
  rateCardItemId: "77777777-7777-7777-7777-777777777777",
  deliverableIdRevisionLimit: "88888888-8888-8888-8888-888888888888",
  secondDeliverableId: "99999999-9999-9999-9999-999999999999",
  rawPortalToken: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
} as const;

const portalTokenHash = crypto.createHash("sha256").update(T.rawPortalToken).digest("hex");

// Re-export for helpers.ts
export const TEST_IDS = T;

// ── Clean ─────────────────────────────────────────────────────────────────────

const TABLES = [
  "reminder_logs", "feedback_items", "approval_events", "deliverable_revisions",
  "deliverables", "change_orders", "scope_flags",
  "sow_clauses", "statements_of_work", "briefs", "brief_templates",
  "brief_versions", "brief_fields", "brief_clarification_requests",
  "brief_clarification_items",
  "projects", "clients", "users", "audit_log", "rate_card_items", "invitations",
];

export async function cleanDatabase(): Promise<void> {
  console.log("Cleaning database tables...");
  for (const table of TABLES) {
    await pool.query(`TRUNCATE TABLE ${table} CASCADE`).catch(() => {});
  }
  console.log("Database cleaned.");
}

// ── Seed ──────────────────────────────────────────────────────────────────────

export async function seedDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("Seeding database for E2E tests...");

    // 1. Workspace
    await client.query(`
      INSERT INTO workspaces (id, name, slug, plan, brand_color, secondary_color, brand_font)
      VALUES ($1, 'Test Agency', 'test-agency-e2e', 'studio', '#0F6E56', '#1D9E75', 'Inter')
      ON CONFLICT (id) DO NOTHING;
    `, [T.workspaceId]);

    // 2. Owner user
    await client.query(`
      INSERT INTO users (id, workspace_id, auth_uid, email, full_name, role, user_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING;
    `, [T.ownerId, T.workspaceId, T.ownerId, "owner@testagency.dev", "Test Owner", "owner", "agency"]);

    // 3. Client
    await client.query(`
      INSERT INTO clients (id, workspace_id, name, contact_name, contact_email, portal_token, portal_token_hash)
      VALUES ($1, $2, 'Test Client Co', 'Jane Client', 'jane@testclient.com', $3, $4)
      ON CONFLICT (id) DO NOTHING;
    `, [T.clientId, T.workspaceId, T.rawPortalToken, portalTokenHash]);

    // 4. Statement of Work (must be before projects)
    await client.query(`
      INSERT INTO statements_of_work (id, workspace_id, title, file_url, parsed_text_preview)
      VALUES ($1, $2, 'E2E Test SOW', 'https://test-bucket.scopeiq/sows/test-sow.pdf',
              'Scope: 3 deliverables, 2 revision rounds, no additional pages')
      ON CONFLICT (id) DO NOTHING;
    `, [T.sowId, T.workspaceId]);

    // 5. Project
    await client.query(`
      INSERT INTO projects (id, workspace_id, client_id, sow_id, name, description, status, budget)
      VALUES ($1, $2, $3, $4, 'E2E Test Project', 'Project for end-to-end testing', 'active', 30000)
      ON CONFLICT (id) DO NOTHING;
    `, [T.projectId, T.workspaceId, T.clientId, T.sowId]);

    // 6. SOW Clauses
    await client.query(`
      INSERT INTO sow_clauses (id, sow_id, clause_type, original_text, summary)
      VALUES ($1, $2, 'exclusion',
              'Additional web pages beyond the agreed 5 pages are explicitly excluded from this engagement.',
              'Exclusion: no extra pages')
      ON CONFLICT (id) DO NOTHING;
    `, [T.sowClauseId, T.sowId]);

    await client.query(`
      INSERT INTO sow_clauses (id, sow_id, clause_type, original_text, summary)
      VALUES ($1, $2, 'revision_limit',
              'Each deliverable includes 2 rounds of revisions. Additional rounds require a change order.',
              '2 revision rounds per deliverable')
      ON CONFLICT (id) DO NOTHING;
    `, [T.revisionLimitClauseId, T.sowId]);

    // 7. Deliverable (standard — under revision limit, 48h ago for reminder)
    await client.query(`
      INSERT INTO deliverables (id, workspace_id, project_id, name, description, type, status,
        external_url, revision_round, max_revisions, review_started_at)
      VALUES ($1, $2, $3, 'Homepage Mockup', 'Figma mockup for the homepage redesign',
              'figma', 'in_review', 'https://figma.com/file/test-mockup', 0, 2,
              NOW() - INTERVAL '48 hours')
      ON CONFLICT (id) DO NOTHING;
    `, [T.deliverableId, T.workspaceId, T.projectId]);

    // 8. Deliverable at revision limit
    await client.query(`
      INSERT INTO deliverables (id, workspace_id, project_id, name, description, type, status,
        file_url, revision_round, max_revisions, review_started_at)
      VALUES ($1, $2, $3, 'About Page Design', 'Design for the about page',
              'file', 'in_review', 'https://test-bucket.scopeiq/deliverables/about-page-v2.pdf', 2, 2,
              NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [T.deliverableIdRevisionLimit, T.workspaceId, T.projectId]);

    // 9. Second deliverable (for annotation tests)
    await client.query(`
      INSERT INTO deliverables (id, workspace_id, project_id, name, description, type, status,
        file_url, revision_round, max_revisions, review_started_at)
      VALUES ($1, $2, $3, 'Logo Concepts', 'Three logo concepts for review',
              'file', 'in_review', 'https://test-bucket.scopeiq/deliverables/logo-concepts.png', 0, 2,
              NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [T.secondDeliverableId, T.workspaceId, T.projectId]);

    // 10. Scope Flag
    const matchingClauses = JSON.stringify([
      { clause_id: T.sowClauseId, clause_text: "Additional web pages beyond the agreed 5 pages are explicitly excluded", relevance: 0.95 },
    ]);
    await client.query(`
      INSERT INTO scope_flags (id, workspace_id, project_id, sow_clause_id,
        message_text, confidence, title, description, suggested_response,
        severity, status, matching_clauses_json, ai_reasoning)
      VALUES ($1, $2, $3, $4,
        'Can you also design a mobile app version and add 10 more pages to the website?',
        0.92,
        'AI Detection: Possible Scope Deviation',
        'Request for mobile app and additional pages exceeds SOW scope.',
        'Thank you for the suggestion. The mobile app and additional pages fall outside the current SOW.',
        'high', 'pending', $5,
        'Client is requesting a mobile app and 10 additional pages, which are not in the original SOW.')
      ON CONFLICT (id) DO NOTHING;
    `, [T.scopeFlagId, T.workspaceId, T.projectId, T.sowClauseId, matchingClauses]);

    // 11. Change Order
    const coPricing = JSON.stringify({ amount: 8000, currency: "USD", basis: "fixed" });
    const coLineItems = JSON.stringify([
      { rate_card_name: "Additional Page Design", quantity: 10, unit: "page", rate_in_cents: 50000, subtotal_cents: 500000 },
      { rate_card_name: "Mobile App UX", quantity: 1, unit: "project", rate_in_cents: 300000, subtotal_cents: 300000 },
    ]);
    await client.query(`
      INSERT INTO change_orders (id, workspace_id, project_id, scope_flag_id,
        title, work_description, estimated_hours, pricing, currency, revised_timeline,
        status, sent_at, line_items_json)
      VALUES ($1, $2, $3, $4,
        'Additional Pages & Mobile App Design',
        'Design and development of a mobile app version plus 10 additional web pages beyond the original 5-page agreement.',
        40, $5, 'USD', 'Timeline extended by 3 weeks',
        'sent', NOW() - INTERVAL '24 hours', $6)
      ON CONFLICT (id) DO NOTHING;
    `, [T.changeOrderId, T.workspaceId, T.projectId, T.scopeFlagId, coPricing, coLineItems]);

    // 12. Rate Card Item
    await client.query(`
      INSERT INTO rate_card_items (id, workspace_id, name, rate_in_cents, unit)
      VALUES ($1, $2, 'Additional Page Design', 50000, 'page')
      ON CONFLICT (id) DO NOTHING;
    `, [T.rateCardItemId, T.workspaceId]);

    await client.query("COMMIT");
    console.log("Database seeded successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ── CLI entry point ──────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const shouldClean = args.includes("--clean");

  try {
    if (shouldClean) {
      await cleanDatabase();
    }
    await seedDatabase();
  } finally {
    await pool.end();
  }
}

const isMainModule = process.argv[1]?.endsWith("test-setup.ts");
if (isMainModule) {
  main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
