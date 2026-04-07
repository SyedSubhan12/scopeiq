import { db } from "./client.js";
import { workspaces } from "./schema/workspaces.schema.js";
import { users } from "./schema/users.schema.js";
import { clients } from "./schema/clients.schema.js";
import { projects } from "./schema/projects.schema.js";
import { generatePortalToken } from "./helpers.js";

function getPortalTokenRaw(): string {
  return generatePortalToken().raw;
}

async function seed() {
  console.log("Seeding database...");

  // Create test workspace
  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: "Novabots Studio",
      slug: "novabots-studio",
      plan: "studio",
      brandColor: "#0F6E56",
    })
    .returning();

  if (!workspace) throw new Error("Failed to create workspace");
  console.log(`Created workspace: ${workspace.name} (${workspace.id})`);

  // Create 3 users
  const userValues = [
    {
      workspaceId: workspace.id,
      authUid: "00000000-0000-0000-0000-000000000001",
      email: "admin@novabots.dev",
      fullName: "Alex Admin",
      role: "owner" as const,
    },
    {
      workspaceId: workspace.id,
      authUid: "00000000-0000-0000-0000-000000000002",
      email: "sarah@novabots.dev",
      fullName: "Sarah Designer",
      role: "member" as const,
    },
    {
      workspaceId: workspace.id,
      authUid: "00000000-0000-0000-0000-000000000003",
      email: "mike@novabots.dev",
      fullName: "Mike Manager",
      role: "admin" as const,
    },
  ];

  const createdUsers = await db.insert(users).values(userValues).returning();
  console.log(`Created ${createdUsers.length} users`);

  // Create 3 clients
  const clientValues = [
    {
      workspaceId: workspace.id,
      name: "Acme Corp",
      contactName: "John Doe",
      contactEmail: "john@acme.com",
    },
    {
      workspaceId: workspace.id,
      name: "TechStart Inc",
      contactName: "Jane Smith",
      contactEmail: "jane@techstart.io",
    },
    {
      workspaceId: workspace.id,
      name: "Creative Labs",
      contactName: "Bob Wilson",
      contactEmail: "bob@creativelabs.co",
    },
  ];

  const createdClients = await db.insert(clients).values(clientValues).returning();
  console.log(`Created ${createdClients.length} clients`);

  // Create 2 projects
  const projectValues = [
    {
      workspaceId: workspace.id,
      clientId: createdClients[0]!.id,
      name: "Acme Brand Refresh",
      description: "Complete brand identity redesign for Acme Corp",
      status: "active" as const,
      budget: 25000,
      portalToken: getPortalTokenRaw(),
    },
    {
      workspaceId: workspace.id,
      clientId: createdClients[1]!.id,
      name: "TechStart Launch Campaign",
      description: "Product launch marketing campaign",
      status: "draft" as const,
      budget: 15000,
      portalToken: getPortalTokenRaw(),
    },
  ];

  const createdProjects = await db.insert(projects).values(projectValues).returning();
  console.log(`Created ${createdProjects.length} projects`);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
