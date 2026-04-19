export type ServiceType =
    | "brand_design"
    | "web_design"
    | "web_development"
    | "video_production"
    | "copywriting"
    | "strategy"
    | "social_media"
    | "photography"
    | "illustration"
    | "other";

export interface BriefField {
    type: "text" | "textarea" | "select" | "number";
    label: string;
    placeholder: string;
    required: boolean;
}

export interface ServiceTemplate {
    id: ServiceType;
    label: string;
    tagline: string;
    icon: string; // lucide-react icon name
    defaultBriefFields: BriefField[];
    defaultSowStructure: {
        typicalDeliverables: string[];
        typicalExclusions: string[];
        typicalRevisions: number;
        suggestedTimeline: string;
        suggestedPaymentTerms: string;
    };
    defaultRateCardDefaults: {
        suggestedHourlyRate: number;
        suggestedProjectMinimum: number;
        currency: "USD";
    };
}

export const SERVICE_TEMPLATES: Record<ServiceType, ServiceTemplate> = {
    brand_design: {
        id: "brand_design",
        label: "Brand Design",
        tagline: "Logos, identity systems, brand guidelines",
        icon: "Palette",
        defaultBriefFields: [
            { type: "textarea", label: "Brand Vision", placeholder: "Describe the brand personality and core values...", required: true },
            { type: "text", label: "Target Audience", placeholder: "Who is your ideal customer?", required: true },
            { type: "select", label: "Industry", placeholder: "Select your industry", required: true },
            { type: "textarea", label: "Competitor Brands", placeholder: "List 2–3 competitors for context", required: false },
            { type: "textarea", label: "Style Preferences", placeholder: "Modern? Classic? Playful? Minimalist?", required: false },
            { type: "text", label: "Deliverables Requested", placeholder: "Logo, brand guidelines, business cards...", required: true },
        ],
        defaultSowStructure: {
            typicalDeliverables: [
                "Primary logo in vector formats (AI, EPS, SVG) and raster (PNG, JPG)",
                "Secondary and alternate logo lockups (stacked, horizontal, icon-only)",
                "Color palette with CMYK, RGB, HEX, and Pantone values",
                "Typography system (primary + secondary fonts with usage rules)",
                "Brand guidelines document (PDF, minimum 20 pages)",
            ],
            typicalExclusions: [
                "Print collateral (business cards, letterhead) unless separately line-itemed",
                "Social media profile or cover templates",
                "Website design or development",
                "Custom illustration or photography",
                "Brand naming, tagline development, or copywriting",
                "Trademark or copyright registration",
            ],
            typicalRevisions: 3,
            suggestedTimeline: "3–4 weeks from signed agreement and deposit receipt",
            suggestedPaymentTerms: "50% upfront deposit, 50% on final file delivery",
        },
        defaultRateCardDefaults: { suggestedHourlyRate: 125, suggestedProjectMinimum: 2500, currency: "USD" },
    },

    web_design: {
        id: "web_design",
        label: "Web Design",
        tagline: "UI/UX, wireframes, high-fidelity Figma mockups",
        icon: "Monitor",
        defaultBriefFields: [
            { type: "text", label: "Website Goal", placeholder: "e.g. Generate leads, sell products, build authority", required: true },
            { type: "number", label: "Number of Pages", placeholder: "e.g. 5", required: true },
            { type: "textarea", label: "Key Pages", placeholder: "Home, About, Services, Contact...", required: true },
            { type: "text", label: "Target Audience", placeholder: "Who will visit this site?", required: true },
            { type: "textarea", label: "Brand Assets Available", placeholder: "Logo, colors, fonts — what exists already?", required: false },
            { type: "textarea", label: "Reference Sites", placeholder: "Links to sites you admire and why", required: false },
        ],
        defaultSowStructure: {
            typicalDeliverables: [
                "Sitemap and information architecture document",
                "Low-fidelity wireframes for all agreed pages (mobile + desktop)",
                "High-fidelity Figma mockups for all agreed pages",
                "Interactive prototype (clickable Figma link)",
                "Design system and component library in Figma",
                "Responsive designs for mobile, tablet, and desktop breakpoints",
            ],
            typicalExclusions: [
                "Front-end or back-end development",
                "CMS configuration or content entry",
                "Copywriting or content creation",
                "Photography or stock image licensing",
                "SEO implementation",
                "Pages beyond the agreed count (quoted separately)",
            ],
            typicalRevisions: 2,
            suggestedTimeline: "4–6 weeks from deposit and content receipt",
            suggestedPaymentTerms: "50% upfront, 25% at wireframe approval, 25% on final delivery",
        },
        defaultRateCardDefaults: { suggestedHourlyRate: 115, suggestedProjectMinimum: 3000, currency: "USD" },
    },

    web_development: {
        id: "web_development",
        label: "Web Development",
        tagline: "Front-end, full-stack, CMS, e-commerce",
        icon: "Code2",
        defaultBriefFields: [
            { type: "textarea", label: "Project Overview", placeholder: "What are you building and why?", required: true },
            { type: "select", label: "Tech Stack", placeholder: "Next.js / WordPress / Shopify / Custom", required: true },
            { type: "textarea", label: "Core Features", placeholder: "List the must-have features for launch", required: true },
            { type: "textarea", label: "Integrations Required", placeholder: "Stripe, HubSpot, Mailchimp, custom APIs...", required: false },
            { type: "text", label: "Designs Available", placeholder: "Figma link or 'needs design phase first'", required: true },
            { type: "select", label: "Hosting Environment", placeholder: "Vercel / AWS / Client-managed", required: false },
        ],
        defaultSowStructure: {
            typicalDeliverables: [
                "Production-ready codebase deployed to agreed hosting environment",
                "All agreed features implemented and QA-tested across major browsers",
                "CMS configured with client training session (if applicable)",
                "Git repository with README and setup documentation",
                "30-day post-launch bug-fix support window",
            ],
            typicalExclusions: [
                "UI/UX design (unless a design phase is explicitly included)",
                "Content entry, copywriting, or media production",
                "Ongoing maintenance after the 30-day support window",
                "Third-party API or SaaS subscription costs",
                "Features not listed in the agreed scope",
                "Data migration from legacy systems",
            ],
            typicalRevisions: 2,
            suggestedTimeline: "6–10 weeks from signed agreement, deposit, and design approval",
            suggestedPaymentTerms: "33% upfront, 33% at development milestone, 34% on final delivery",
        },
        defaultRateCardDefaults: { suggestedHourlyRate: 140, suggestedProjectMinimum: 5000, currency: "USD" },
    },

    video_production: {
        id: "video_production",
        label: "Video Production",
        tagline: "Brand films, ads, social reels, editing",
        icon: "Film",
        defaultBriefFields: [
            { type: "text", label: "Video Purpose", placeholder: "e.g. Brand awareness ad, product demo, testimonial", required: true },
            { type: "number", label: "Number of Videos", placeholder: "e.g. 3", required: true },
            { type: "text", label: "Target Length Per Video", placeholder: "e.g. 60–90 seconds", required: true },
            { type: "textarea", label: "Key Messages", placeholder: "What must viewers walk away knowing or feeling?", required: true },
            { type: "text", label: "Distribution Platform", placeholder: "YouTube, Instagram, paid ads, website...", required: true },
            { type: "textarea", label: "Talent & Location", placeholder: "Client-provided talent? Location shoot or studio?", required: false },
        ],
        defaultSowStructure: {
            typicalDeliverables: [
                "Pre-production package: creative brief, shot list, and script",
                "Production shoot day(s) as agreed",
                "Rough cut for client review within 5 business days of shoot",
                "Final edited video in MP4 and MOV formats",
                "Subtitle/caption file (.srt)",
                "Platform-optimized aspect ratio exports (16:9, 9:16, 1:1)",
            ],
            typicalExclusions: [
                "Talent fees, location permits, or equipment rental beyond quoted items",
                "Motion graphics or animation beyond simple lower-thirds",
                "Original music composition (stock licensing included; custom score quoted separately)",
                "Videos beyond the agreed count",
                "Rush delivery (available at 25% surcharge)",
                "Translations or voiceover in languages other than English",
            ],
            typicalRevisions: 2,
            suggestedTimeline: "3–5 weeks from pre-production sign-off",
            suggestedPaymentTerms: "50% upfront, 50% upon delivery of final files",
        },
        defaultRateCardDefaults: { suggestedHourlyRate: 100, suggestedProjectMinimum: 3500, currency: "USD" },
    },

    copywriting: {
        id: "copywriting",
        label: "Copywriting",
        tagline: "Website copy, emails, ads, long-form content",
        icon: "FileText",
        defaultBriefFields: [
            { type: "select", label: "Copy Type", placeholder: "Website / Email / Ad copy / Blog / Social", required: true },
            { type: "number", label: "Word Count (approx.)", placeholder: "e.g. 2000", required: true },
            { type: "textarea", label: "Brand Voice", placeholder: "Tone: conversational, authoritative, witty, professional...", required: true },
            { type: "text", label: "Target Audience", placeholder: "Who is reading this?", required: true },
            { type: "textarea", label: "Key Messages & CTAs", placeholder: "What should readers feel, know, and do?", required: true },
            { type: "textarea", label: "SEO Keywords", placeholder: "Primary and secondary keywords (if applicable)", required: false },
        ],
        defaultSowStructure: {
            typicalDeliverables: [
                "Completed copy in Google Doc or agreed format",
                "SEO metadata (title tags, meta descriptions) where applicable",
                "Two rounds of revisions included",
                "Final proofread copy",
            ],
            typicalExclusions: [
                "Graphic design or layout",
                "Photography or image sourcing",
                "CMS upload or on-page formatting",
                "Translation into other languages",
                "Content beyond the agreed word count",
                "Ongoing content calendar management",
            ],
            typicalRevisions: 2,
            suggestedTimeline: "2–3 weeks from brief approval",
            suggestedPaymentTerms: "50% upfront, 50% on final delivery",
        },
        defaultRateCardDefaults: { suggestedHourlyRate: 90, suggestedProjectMinimum: 800, currency: "USD" },
    },

    strategy: {
        id: "strategy",
        label: "Strategy & Consulting",
        tagline: "Brand strategy, positioning, growth planning",
        icon: "Target",
        defaultBriefFields: [
            { type: "textarea", label: "Business Challenge", placeholder: "What problem are you trying to solve?", required: true },
            { type: "text", label: "Current Situation", placeholder: "Where are you now vs. where you want to be?", required: true },
            { type: "textarea", label: "Stakeholders Involved", placeholder: "Who needs to be interviewed or aligned?", required: false },
            { type: "text", label: "Decision Timeline", placeholder: "When do you need the strategy finalized?", required: true },
            { type: "select", label: "Output Format", placeholder: "Workshop / Report / Presentation / Roadmap", required: true },
            { type: "textarea", label: "Existing Research Available", placeholder: "Customer surveys, analytics, competitor audits...", required: false },
        ],
        defaultSowStructure: {
            typicalDeliverables: [
                "Discovery session(s) with agreed stakeholders",
                "Competitive landscape analysis",
                "Strategic recommendations document",
                "Executive presentation deck (PowerPoint or Keynote)",
                "Implementation roadmap (90-day and 12-month)",
            ],
            typicalExclusions: [
                "Implementation or execution of recommendations",
                "Ongoing retainer or advisory support",
                "Legal, financial, or HR advisory",
                "Primary market research beyond stakeholder interviews",
                "Design or copywriting of final deliverables",
            ],
            typicalRevisions: 1,
            suggestedTimeline: "4–6 weeks from kick-off session",
            suggestedPaymentTerms: "50% upfront, 50% on final presentation delivery",
        },
        defaultRateCardDefaults: { suggestedHourlyRate: 175, suggestedProjectMinimum: 4000, currency: "USD" },
    },

    social_media: {
        id: "social_media",
        label: "Social Media Management",
        tagline: "Content creation, scheduling, community management",
        icon: "Share2",
        defaultBriefFields: [
            { type: "text", label: "Platforms", placeholder: "Instagram, LinkedIn, TikTok, X...", required: true },
            { type: "number", label: "Posts Per Week", placeholder: "e.g. 5", required: true },
            { type: "textarea", label: "Content Pillars", placeholder: "Education, behind-the-scenes, promotion, community...", required: true },
            { type: "textarea", label: "Brand Voice & Tone", placeholder: "How should the brand speak online?", required: true },
            { type: "select", label: "Photography/Video Assets", placeholder: "Client-provided / Agency-produced / Stock", required: true },
            { type: "textarea", label: "Reporting Cadence", placeholder: "Monthly report? Weekly check-in call?", required: false },
        ],
        defaultSowStructure: {
            typicalDeliverables: [
                "Monthly content calendar submitted by the 25th of each prior month",
                "Agreed number of posts per week per platform",
                "Copywriting and captions for all posts",
                "Hashtag strategy and implementation",
                "Monthly performance report (reach, engagement, follower growth)",
                "Community management: responding to comments within 24 business hours",
            ],
            typicalExclusions: [
                "Paid advertising campaigns (ad spend and management quoted separately)",
                "Influencer sourcing, negotiation, or management",
                "Photography or video shoots unless included as an add-on",
                "Crisis communications or PR management",
                "Content boosting or promoted post budgets",
            ],
            typicalRevisions: 1,
            suggestedTimeline: "Minimum 3-month initial commitment; month-to-month thereafter with 30-day notice",
            suggestedPaymentTerms: "Monthly retainer invoiced on the 1st, due within 7 days",
        },
        defaultRateCardDefaults: { suggestedHourlyRate: 85, suggestedProjectMinimum: 1500, currency: "USD" },
    },

    photography: {
        id: "photography",
        label: "Photography",
        tagline: "Brand, product, editorial, event photography",
        icon: "Camera",
        defaultBriefFields: [
            { type: "select", label: "Photography Type", placeholder: "Brand / Product / Editorial / Event / Headshots", required: true },
            { type: "number", label: "Shoot Duration (hours)", placeholder: "e.g. 4", required: true },
            { type: "text", label: "Location", placeholder: "Studio / Client premises / Outdoor location", required: true },
            { type: "number", label: "Minimum Edited Images", placeholder: "e.g. 50", required: true },
            { type: "textarea", label: "Shot List", placeholder: "Key shots that must be captured", required: true },
            { type: "text", label: "Usage Rights", placeholder: "Web only / Print / Advertising / Unlimited", required: true },
        ],
        defaultSowStructure: {
            typicalDeliverables: [
                "Shoot day(s) as agreed (duration and location as specified)",
                "Online gallery of selects for client review within 5 business days of shoot",
                "Agreed number of fully retouched high-resolution images",
                "Web-optimized versions of all final images",
                "Secure digital delivery link (active for 60 days)",
            ],
            typicalExclusions: [
                "Location permits, prop sourcing, or talent fees (client responsibility unless quoted)",
                "Hair, makeup, or styling",
                "Images beyond the agreed minimum edited count",
                "Video or motion content",
                "Print production or ordering",
                "Extended licensing beyond agreed usage rights",
                "Same-day turnaround (available at 50% rush surcharge)",
            ],
            typicalRevisions: 1,
            suggestedTimeline: "Edited gallery delivered within 10–14 business days of shoot",
            suggestedPaymentTerms: "50% upfront to secure shoot date, 50% on delivery of final files",
        },
        defaultRateCardDefaults: { suggestedHourlyRate: 150, suggestedProjectMinimum: 800, currency: "USD" },
    },

    illustration: {
        id: "illustration",
        label: "Illustration",
        tagline: "Custom illustrations, icons, editorial art",
        icon: "PenTool",
        defaultBriefFields: [
            { type: "select", label: "Illustration Style", placeholder: "Flat / Detailed / Editorial / Character / Technical", required: true },
            { type: "number", label: "Number of Illustrations", placeholder: "e.g. 8", required: true },
            { type: "textarea", label: "Scenes or Subjects", placeholder: "Describe each illustration or provide a brief per asset", required: true },
            { type: "text", label: "Color Palette", placeholder: "Brand colors or free choice?", required: false },
            { type: "textarea", label: "Usage Context", placeholder: "Website, book, marketing materials, app...", required: true },
            { type: "textarea", label: "Style References", placeholder: "Links to illustrations with a similar aesthetic", required: true },
        ],
        defaultSowStructure: {
            typicalDeliverables: [
                "Initial sketch/concept per illustration for approval before final rendering",
                "Agreed number of final illustrations in vector (SVG/AI) and raster (PNG) formats",
                "Layered source files (AI or PSD) upon project completion",
                "Web-optimized exports ready for immediate use",
            ],
            typicalExclusions: [
                "Animation or motion graphics",
                "Additional illustrations beyond the agreed count",
                "Typeface design or custom lettering",
                "Three-dimensional rendering",
                "Brand or logo design",
                "Print production or file preparation for specific print vendors",
            ],
            typicalRevisions: 3,
            suggestedTimeline: "2–4 weeks depending on illustration count, from brief sign-off",
            suggestedPaymentTerms: "50% upfront, 50% on final file delivery",
        },
        defaultRateCardDefaults: { suggestedHourlyRate: 110, suggestedProjectMinimum: 1200, currency: "USD" },
    },

    other: {
        id: "other",
        label: "Other Services",
        tagline: "Custom project scope",
        icon: "Briefcase",
        defaultBriefFields: [
            { type: "textarea", label: "Project Description", placeholder: "Describe the project in as much detail as possible", required: true },
            { type: "text", label: "Primary Goal", placeholder: "What does success look like?", required: true },
            { type: "textarea", label: "Expected Deliverables", placeholder: "List what you expect to receive", required: true },
            { type: "text", label: "Budget Range", placeholder: "e.g. $2,000–$5,000", required: false },
            { type: "text", label: "Deadline", placeholder: "Hard deadline or target date", required: false },
            { type: "textarea", label: "Additional Notes", placeholder: "Anything else we should know?", required: false },
        ],
        defaultSowStructure: {
            typicalDeliverables: [
                "All deliverables as specified in the agreed project brief",
                "Final files in agreed formats",
                "Hand-off documentation as applicable",
            ],
            typicalExclusions: [
                "Any work not explicitly described in the agreed brief",
                "Rush delivery unless separately negotiated",
                "Third-party costs, licensing, or subscriptions",
                "Ongoing support or maintenance beyond the project",
            ],
            typicalRevisions: 2,
            suggestedTimeline: "To be confirmed at project kick-off",
            suggestedPaymentTerms: "50% upfront, 50% on final delivery",
        },
        defaultRateCardDefaults: { suggestedHourlyRate: 100, suggestedProjectMinimum: 1000, currency: "USD" },
    },
};

export function getServiceTemplate(type: ServiceType): ServiceTemplate {
    return SERVICE_TEMPLATES[type];
}

export const SERVICE_TYPE_OPTIONS = Object.values(SERVICE_TEMPLATES).map((t) => ({
    value: t.id,
    label: t.label,
    tagline: t.tagline,
}));
