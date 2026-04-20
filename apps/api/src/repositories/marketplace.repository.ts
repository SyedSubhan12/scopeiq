import { db, marketplaceInstalls, eq, and } from "@novabots/db";
import type { NewMarketplaceInstall } from "@novabots/db";

export interface MarketplaceTemplate {
  slug: string;
  title: string;
  category: string;
  description: string;
  installs: number;
  curated: boolean;
  accent: string;
  fieldsJson: unknown;
}

export const MARKETPLACE_CATALOG: Record<string, MarketplaceTemplate> = {
  "tpl-brand-identity": {
    slug: "tpl-brand-identity",
    title: "Brand Identity Sprint",
    category: "Branding",
    description: "10-question deep-dive on brand voice, audience, and visual direction. Built for studios doing rapid identity work.",
    installs: 1284,
    curated: true,
    accent: "#F24E1E",
    fieldsJson: [
      {
        key: "brand_voice",
        type: "textarea",
        label: "Brand Voice & Tone",
        placeholder: "How would you describe your brand's personality and voice?",
        helpText: "Be specific about adjectives and communication style.",
        required: true,
        order: 1,
      },
      {
        key: "target_audience",
        type: "textarea",
        label: "Target Audience",
        placeholder: "Who is your ideal customer? Describe in detail.",
        helpText: "Include demographics, psychographics, and pain points.",
        required: true,
        order: 2,
      },
      {
        key: "visual_direction",
        type: "textarea",
        label: "Visual Direction",
        placeholder: "What's the visual style? Colors, typography, imagery style?",
        helpText: "Reference other brands or design styles if helpful.",
        required: false,
        order: 3,
      },
    ],
  },
  "tpl-website-redesign": {
    slug: "tpl-website-redesign",
    title: "Website Redesign Brief",
    category: "Web",
    description: "Capture goals, KPIs, content audit, and tech constraints upfront so the design phase never stalls.",
    installs: 2031,
    curated: true,
    accent: "#1D9E75",
    fieldsJson: [
      {
        key: "redesign_goals",
        type: "textarea",
        label: "Primary Goals",
        placeholder: "What are the main goals for this redesign?",
        helpText: "E.g., increase conversions, improve UX, rebrand, modernize tech stack.",
        required: true,
        order: 1,
      },
      {
        key: "kpis",
        type: "textarea",
        label: "Key Performance Indicators",
        placeholder: "How will you measure success?",
        helpText: "Include metrics like conversion rate, bounce rate, page load time.",
        required: true,
        order: 2,
      },
      {
        key: "tech_constraints",
        type: "textarea",
        label: "Technical Constraints",
        placeholder: "Any tech stack requirements or legacy system constraints?",
        required: false,
        order: 3,
      },
    ],
  },
  "tpl-product-launch": {
    slug: "tpl-product-launch",
    title: "Product Launch Campaign",
    category: "Marketing",
    description: "Positioning, messaging pillars, and channel mix in one structured form. Pairs well with Stripe + Linear.",
    installs: 871,
    curated: true,
    accent: "#5E6AD2",
    fieldsJson: [
      {
        key: "product_positioning",
        type: "textarea",
        label: "Product Positioning",
        placeholder: "How do you want to position this product in the market?",
        required: true,
        order: 1,
      },
      {
        key: "messaging_pillars",
        type: "textarea",
        label: "Messaging Pillars",
        placeholder: "What are the 3-5 core messages?",
        helpText: "Keep each pillar to one sentence.",
        required: true,
        order: 2,
      },
      {
        key: "channels",
        type: "multi_choice",
        label: "Launch Channels",
        required: false,
        options: [
          { value: "social_media", label: "Social Media" },
          { value: "email", label: "Email" },
          { value: "pr", label: "PR / Press Release" },
          { value: "paid_ads", label: "Paid Advertising" },
          { value: "partnerships", label: "Partnerships" },
        ],
        order: 3,
      },
    ],
  },
  "tpl-ugc-shoot": {
    slug: "tpl-ugc-shoot",
    title: "UGC Content Shoot",
    category: "Content",
    description: "Brief creators with shot-lists, talent requirements, and usage rights baked in. Reduces revision rounds by 40%.",
    installs: 612,
    curated: false,
    accent: "#0D1B2A",
    fieldsJson: [
      {
        key: "shot_list",
        type: "textarea",
        label: "Shot List",
        placeholder: "Describe each shot/scene needed.",
        helpText: "Include product angles, transitions, and any special effects.",
        required: true,
        order: 1,
      },
      {
        key: "talent_requirements",
        type: "textarea",
        label: "Talent Requirements",
        placeholder: "Age, demographics, style, or specific types needed?",
        required: true,
        order: 2,
      },
      {
        key: "usage_rights",
        type: "textarea",
        label: "Usage Rights & Licensing",
        placeholder: "How long can the UGC creator use this content? Exclusivity terms?",
        required: false,
        order: 3,
      },
    ],
  },
  "tpl-mobile-app": {
    slug: "tpl-mobile-app",
    title: "Mobile App MVP",
    category: "Product",
    description: "User flows, monetization model, platform priorities. Built with feedback from 30+ founders shipping their first app.",
    installs: 498,
    curated: true,
    accent: "#635BFF",
    fieldsJson: [
      {
        key: "user_flows",
        type: "textarea",
        label: "Core User Flows",
        placeholder: "Describe the 3-5 most critical user journeys.",
        required: true,
        order: 1,
      },
      {
        key: "monetization",
        type: "single_choice",
        label: "Monetization Model",
        options: [
          { value: "freemium", label: "Freemium" },
          { value: "subscription", label: "Subscription" },
          { value: "one_time", label: "One-Time Purchase" },
          { value: "ads", label: "Ad-Supported" },
        ],
        required: true,
        order: 2,
      },
      {
        key: "platforms",
        type: "multi_choice",
        label: "Platform Priority",
        options: [
          { value: "ios", label: "iOS" },
          { value: "android", label: "Android" },
          { value: "web", label: "Web" },
        ],
        required: false,
        order: 3,
      },
    ],
  },
  "tpl-event-page": {
    slug: "tpl-event-page",
    title: "Event Landing Page",
    category: "Web",
    description: "Single-page brief covering speakers, registration, sponsor logos, and post-event analytics.",
    installs: 357,
    curated: false,
    accent: "#13B5EA",
    fieldsJson: [
      {
        key: "event_details",
        type: "textarea",
        label: "Event Details",
        placeholder: "Date, time, location, expected attendance.",
        required: true,
        order: 1,
      },
      {
        key: "speaker_info",
        type: "textarea",
        label: "Speaker Information",
        placeholder: "Who are the speakers? Bios and photo requirements?",
        required: false,
        order: 2,
      },
      {
        key: "registration_flow",
        type: "textarea",
        label: "Registration Flow",
        placeholder: "What information do you need to collect from attendees?",
        required: true,
        order: 3,
      },
    ],
  },
};

export const marketplaceRepository = {
  async findInstalls(workspaceId: string) {
    return db
      .select()
      .from(marketplaceInstalls)
      .where(eq(marketplaceInstalls.workspaceId, workspaceId));
  },

  async findInstallBySlug(workspaceId: string, slug: string) {
    const [install] = await db
      .select()
      .from(marketplaceInstalls)
      .where(
        and(
          eq(marketplaceInstalls.workspaceId, workspaceId),
          eq(marketplaceInstalls.slug, slug),
        ),
      )
      .limit(1);
    return install ?? null;
  },

  async createInstall(data: NewMarketplaceInstall) {
    const [install] = await db.insert(marketplaceInstalls).values(data).returning();
    return install!;
  },
};
