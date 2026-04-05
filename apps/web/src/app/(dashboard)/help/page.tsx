"use client";

import {
  HelpCircle, BookOpen, MessageSquare, Zap, Shield, Users,
  FileText, FolderKanban, ExternalLink, ChevronRight
} from "lucide-react";
import { Card } from "@novabots/ui";

const GUIDES = [
  {
    icon: FolderKanban,
    color: "text-primary bg-primary/10",
    title: "Creating your first project",
    desc: "Set up a project, attach a client, and configure your deliverables.",
  },
  {
    icon: FileText,
    color: "text-blue-600 bg-blue-50",
    title: "Building brief templates",
    desc: "Design intake forms with custom fields to standardize client onboarding.",
  },
  {
    icon: Shield,
    color: "text-red-500 bg-red-50",
    title: "Understanding Scope Guard",
    desc: "Paste client messages to detect scope creep before it becomes a problem.",
  },
  {
    icon: Users,
    color: "text-violet-600 bg-violet-50",
    title: "Sharing the client portal",
    desc: "Each project has a unique portal link. Share it to get client approvals.",
  },
  {
    icon: Zap,
    color: "text-amber-500 bg-amber-50",
    title: "AI brief scoring",
    desc: "Submitted briefs are automatically scored 0–100 for clarity and scope coverage.",
  },
  {
    icon: MessageSquare,
    color: "text-emerald-600 bg-emerald-50",
    title: "Change order workflow",
    desc: "Promote scope flags to change orders and send them to clients for acceptance.",
  },
];

const FAQS = [
  {
    q: "What is a portal token?",
    a: "Each project gets a unique portal token — a URL your client can open without logging in. They can review deliverables, annotate, and approve from the portal page.",
  },
  {
    q: "How does AI scoring work?",
    a: "When a client submits a brief, ScopeIQ's AI analyzes each field for completeness, clarity, and scope coverage, returning a score from 0–100 with per-field flags.",
  },
  {
    q: "Can I have multiple workspaces?",
    a: "Each account has one workspace. Team members can be invited to collaborate within it.",
  },
  {
    q: "How do I attach a Statement of Work?",
    a: "Open any project, go to the Scope Guard tab, and paste your SOW text. AI will parse it into structured clauses automatically.",
  },
  {
    q: "What file types can clients approve?",
    a: "Images, PDFs, videos, Word/Excel/PowerPoint, ZIP archives, and external links (Figma, Loom, YouTube).",
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[rgb(var(--text-primary))]">
          <HelpCircle className="h-6 w-6 text-primary" />
          Help & Docs
        </h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          Everything you need to get the most out of ScopeIQ
        </p>
      </div>

      {/* Quick guides */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[rgb(var(--text-muted))]" />
          <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">Quick Guides</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <Card
              key={g.title}
              className="flex cursor-pointer items-start gap-3 p-4 transition-shadow hover:shadow-md"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${g.color}`}>
                <g.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{g.title}</p>
                <p className="mt-0.5 text-xs text-[rgb(var(--text-muted))]">{g.desc}</p>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[rgb(var(--text-muted))]" />
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[rgb(var(--text-muted))]" />
          <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <Card key={faq.q} className="p-4">
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{faq.q}</p>
              <p className="mt-1.5 text-sm text-[rgb(var(--text-secondary))]">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Support CTA */}
      <Card className="flex items-center justify-between gap-4 border-primary/20 bg-primary/5 p-5">
        <div>
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Still need help?</p>
          <p className="mt-0.5 text-xs text-[rgb(var(--text-muted))]">
            Reach out to us and we'll get back to you within 24 hours.
          </p>
        </div>
        <a
          href="mailto:support@scopeiq.app"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Contact support
        </a>
      </Card>
    </div>
  );
}
