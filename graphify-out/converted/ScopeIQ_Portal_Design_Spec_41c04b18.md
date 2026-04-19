<!-- converted from ScopeIQ_Portal_Design_Spec.docx -->


ScopeIQ

Agency & Client Portal
Design Specification Document

Novabots Engineering  |  Portal Architecture · Screen Inventory · Component Specs · Data Flows  |  v1.0  |  2026


# 1. Introduction & Scope
This document defines the complete screen-by-screen design specification for ScopeIQ’s two primary interfaces: the Agency Dashboard (used by creative agencies and freelancers) and the Client Portal (used by their clients). It establishes every screen, component, interaction pattern, state transition, data flow, and technical implementation detail required to build both portals to production quality.

This specification is authoritative. Where it conflicts with earlier wireframe or PRD documents, this document takes precedence. All engineering, QA, and design review should reference this document as the single source of truth for portal implementation.

## 1.1 Two Portals, One Platform

# 2. Agency Dashboard — Complete Screen Inventory
The Agency Dashboard is the primary interface for creative professionals. It provides a unified command center for managing projects, briefs, deliverables, scope flags, and change orders across all active clients. The dashboard follows a persistent sidebar navigation pattern with a contextual main content area.

## 2.1 Global Shell & Navigation
The global shell wraps every agency-side screen and provides persistent navigation, search, notifications, and user context. It renders on every page load and persists across route transitions via Next.js layout system.

### 2.1.1 Top Bar

### 2.1.2 Left Sidebar Navigation
Fixed-width sidebar at 240px. Collapsible to 64px icon-only mode on smaller screens. Active state indicated by teal left border (3px) and teal background tint.


### 2.1.3 Notification System

## 2.2 Screen: Dashboard Home
The dashboard home is the agency’s daily command center. It surfaces the most actionable information across all projects without requiring any clicks. The screen is organized into three zones: greeting + metrics, action-required items, and recent activity.

### 2.2.1 Greeting Bar
Personalized greeting using the user’s first name and a summary of pending actions. Format: “Good [morning/afternoon/evening], [Name]. You have [N] scope flags requiring attention.” Time-of-day calculated from the browser’s timezone.

### 2.2.2 Metric Cards Row
Four metric cards displayed in a horizontal row. Each card is clickable and navigates to the relevant filtered view.


### 2.2.3 Scope Flags Panel (Right Column)
Dedicated panel showing up to 3 most recent unresolved scope flags, sorted by severity (HIGH first). Each flag card shows: client name, truncated message (80 chars), confidence percentage with color bar, severity badge, and two action buttons: “View Flag” and “Send Change Order”. A “View All Scope Flags” link at the bottom navigates to the full scope flags list.

### 2.2.4 Recent Activity Feed (Left Column)
Chronological feed of the last 10 events across all projects. Each entry shows: event icon (color-coded by type), description text, relative timestamp (“2 hours ago”), and project name as a link. Events include: approvals, brief submissions, scope flags, change orders sent/accepted, and reminders dispatched.

### 2.2.5 Upcoming Deadlines Panel
Below the activity feed, a compact list of the next 5 upcoming milestone deadlines across all projects. Each shows: project name, milestone name, days remaining, and a color indicator (green > 7 days, amber 3-7 days, red < 3 days).

## 2.3 Screen: Projects List
The projects list is the primary navigation hub for accessing individual client engagements. It supports filtering, sorting, and bulk status overview.

### 2.3.1 Layout & Components

### 2.3.2 Project Card Anatomy

## 2.4 Screen: Project Detail
The project detail screen is the most complex screen in the agency dashboard. It provides a unified view of all data and actions for a single client engagement, organized by tabbed modules.

### 2.4.1 Project Header

### 2.4.2 Tab Navigation
Five horizontal tabs below the project header. Active tab indicated by teal underline. Badge counts shown on tabs with pending items.


## 2.5 Screen: Project > Brief Tab
The Brief tab shows the current state of the client’s submitted brief, the AI clarity analysis, and the full version history.

### 2.5.1 Brief Summary Card

### 2.5.2 AI Flags Panel
Expandable list of every flag the AI raised during scoring. Each flag shows: the field it references, the reason for the flag, severity (Low/Medium/High), and the AI-generated clarification question that was sent to the client. Flags are color-coded by severity.

### 2.5.3 Brief Fields View
Read-only display of all submitted brief fields in the order defined by the template. Flagged fields are highlighted with an amber left border and an inline flag icon. File upload fields show thumbnails with download links.

### 2.5.4 Version History Sidebar
Right sidebar listing all brief versions in reverse chronological order. Each version shows: version number, submission timestamp, submitter email, and clarity score. Clicking a version loads it into the main view. A “Compare” button enables diff mode between any two versions, with added content highlighted green and removed content highlighted red with strikethrough.

## 2.6 Screen: Project > Deliverables Tab
The Deliverables tab is the core of the Approval Portal module. It manages the upload, delivery, review, annotation, and approval lifecycle for all creative work.

### 2.6.1 Deliverable List

### 2.6.2 Deliverable Upload Flow
Multi-step upload process using presigned R2 URLs. Flow: (1) Agency clicks “+ Add Deliverable” button, (2) modal opens with title input + type selector (File / Figma Link / Loom Link / YouTube Link), (3) for files: drag-and-drop zone supporting up to 500MB with progress bar, (4) for links: URL input with auto-preview fetch via oEmbed, (5) optional message to client textarea, (6) “Deliver to Client” button sends notification.

### 2.6.3 Deliverable Review View (Agency Side)
Full-screen deliverable viewer with feedback panel. Left side: deliverable preview (image rendered inline, PDF via React-PDF, Figma/Loom/YouTube via embedded iframe). Right side: feedback panel showing all client annotations as numbered pins, with threaded comments per pin. Agency can resolve individual pins (hides from client, preserved in audit). A “Summarize Feedback” button triggers the AI Feedback Summarizer, which converts scattered feedback into a structured, prioritized task list exportable to Notion/Linear/email.

### 2.6.4 Revision Round Tracker (Agency View)
Persistent bar at the top of the deliverable detail showing: current revision round / max rounds allowed (from SOW), progress bar with green/amber/red color thresholds, and at-limit behavior: when the limit is reached, a yellow banner shows “Revision limit reached — next feedback round will trigger a change order.”

## 2.7 Screen: Project > Scope Guard Tab
The Scope Guard tab is the nerve center for real-time scope enforcement. It shows the active SOW boundaries, all detected scope flags, and the monitoring status.

### 2.7.1 SOW Overview Card

### 2.7.2 Scope Flag List
Table of all scope flags for this project, sorted by status (Pending first) then by severity (HIGH first). Each row shows:


### 2.7.3 Scope Flag Detail Modal
Full-context modal showing: the complete client message, the matched SOW clause with section reference, confidence score with visual bar, severity assessment, AI-suggested response text (editable), and three mutually exclusive action buttons: (1) Confirm & Generate Change Order (red, primary), (2) Mark In-Scope with reason input (trains the AI), (3) Snooze 24 Hours. All actions write to the audit log with actor identity and timestamp.

### 2.7.4 Manual Message Input
Text area at the bottom of the Scope Guard tab where agencies can paste client messages from external channels (email, Slack) for manual scope checking. Messages submitted here go through the same AI analysis pipeline as portal-submitted messages.

## 2.8 Screen: Project > Change Orders Tab
The Change Orders tab tracks all generated change orders for the project, from draft through client acceptance.


## 2.9 Screen: Brief Builder (Template Configuration)
The Brief Builder configuration screen is accessed from Settings or when creating a new project. It provides a drag-and-drop form designer for creating client intake templates.

### 2.9.1 Layout

### 2.9.2 Field Types & Properties

## 2.10 Screen: Settings
The Settings area provides workspace-level configuration across multiple sub-pages.


# 3. Client Portal — Complete Screen Inventory
The Client Portal is a white-labeled, single-project interface that the agency’s clients use to submit briefs, review deliverables, and respond to change orders. It is designed for simplicity and requires no account creation — access is via a unique project token URL.

## 3.1 Portal Access & Authentication

## 3.2 Portal Navigation
The client portal uses a horizontal stepped tab navigation with a maximum of 3 visible tabs at any time. Tabs are contextual — only tabs relevant to the current project state are shown. The agency logo anchors the top-left. The project name is displayed centrally in the header bar.


## 3.3 Screen: Client Brief Submission
The client-facing brief form is served from the Brief Builder template configured by the agency. It is paginated (max 4-5 questions per step), mobile-responsive, and includes a progress bar.

### 3.3.1 Form Behavior

### 3.3.2 Brief Held State (Clarification Needed)
If the AI scores the brief below the agency’s threshold, the client sees a dedicated clarification screen: a friendly header (“Your brief needs a few more details”), numbered clarification questions generated by the AI (each referencing the specific field that needs attention), and input fields for each answer. The client submits clarifications, which triggers a full re-scoring cycle. The screen does not reveal the numerical score — it frames the request as helping the agency understand the project better.

## 3.4 Screen: Client Deliverable Review
The deliverable review screen is the client’s primary interaction surface for the Approval Portal module. It is designed for maximum clarity with exactly two possible actions: Approve or Request Changes.

### 3.4.1 Layout

### 3.4.2 Annotation System

## 3.5 Screen: Client Change Order Response
When a change order is sent to the client, they receive an email notification and see the change order in the Messages tab of their portal.


## 3.6 Client Experience: Approval Reminders
When a client has not responded to a delivered piece of work within the agency’s configured timeframe, the automated reminder sequence activates.


# 4. State Machines & Lifecycle Transitions
Every core entity in ScopeIQ follows a defined state machine. These state machines govern what UI is shown, what actions are available, and what notifications fire at each stage. All state transitions are recorded in the audit_log table.

## 4.1 Brief Lifecycle

## 4.2 Deliverable Lifecycle

## 4.3 Scope Flag Lifecycle

## 4.4 Change Order Lifecycle

# 5. Data Flow Architecture
This section documents the end-to-end data flows for the three primary AI-powered pipelines that connect the agency dashboard and client portal.

## 5.1 Brief Submission & Scoring Flow

## 5.2 Scope Flag Detection Flow

## 5.3 Change Order Generation & Acceptance Flow

# 6. Responsive Design Specifications
ScopeIQ is a web-first responsive application. The agency dashboard is optimized for desktop with functional tablet support. The client portal is fully responsive down to 375px (mobile-first for client interactions).


# 7. Security & Access Control Matrix
Security is enforced at two independent layers: application-level role checks and database-level row-level security policies. Both must pass independently for any operation.

## 7.1 Agency Dashboard Roles

## 7.2 Client Portal Permissions

# 8. Performance Requirements


# 9. Email Template Inventory
All transactional emails are sent via Resend using React Email templates. Every email uses the agency’s branding (logo + primary color) so the client sees it as communication from their agency, not from ScopeIQ.


# 10. Implementation Priority & Build Order
The portal implementation follows a phased approach aligned with the overall ScopeIQ build roadmap. Each phase delivers a complete, testable user flow.



Novabots — ScopeIQ Agency & Client Portal Design Specification — Confidential — 2026
| Property | Value |
| --- | --- |
| Document Owner | System Architecture Team |
| Classification | Confidential |
| Version | 1.0 |
| Last Updated | April 2026 |
| Applies To | ScopeIQ v1.0 MVP (Q3 2026) |
| Dimension | Agency Dashboard | Client Portal |
| --- | --- | --- |
| Primary User | Agency owner, freelancer, team members | Agency’s client (non-technical) |
| Access Method | Email/password or OAuth login | Unique project token URL (no account needed) |
| Information Density | High — multi-project, multi-client | Low — single project, max 3 actions per screen |
| Navigation Depth | 4+ levels with sidebar | Flat — 3 tab steps maximum |
| Branding | ScopeIQ branding (agency sees platform) | Agency’s branding only (white-label) |
| Core Emotion | Control and confidence | Clarity and simplicity |
| Sessions/Week | Daily use, 5-15 sessions | 1-3 sessions per active project |
| Element | Specification | Behavior |
| --- | --- | --- |
| Logo | ScopeIQ wordmark, 120x28px, links to /dashboard | Click navigates to dashboard home |
| Workspace Name | Agency name from workspace.name, 14px/600 Inter | Click opens workspace switcher (v1.5) |
| Global Search | Search input with Cmd+K shortcut, 320px width | Searches projects, clients, briefs, flags across workspace |
| Notification Bell | Bell icon with unread count badge (red for scope flags) | Click opens notification dropdown; badge clears on view |
| User Avatar | Initials circle, 32x32px, opens dropdown menu | Dropdown: Profile, Workspace Settings, Billing, Help, Logout |
| Nav Item | Icon | Badge Logic | Route |
| --- | --- | --- | --- |
| Dashboard | LayoutDashboard | None | /dashboard |
| Projects | FolderKanban | Count of active projects | /projects |
| Briefs | FileText | Count of briefs pending review | /briefs |
| Scope Flags | ShieldAlert | Count of unresolved flags (RED badge) | /scope-flags |
| Clients | Users | None | /clients |
| Change Orders | FileSignature | Count of pending COs | /change-orders |
| ─── Divider ─── | — | — | — |
| Settings | Settings | None | /settings |
| Help & Docs | HelpCircle | None | /help |
| ─── Divider ─── | — | — | — |
| Plan Badge | Crown | Current plan name | Links to /settings/billing |
| Upgrade CTA | ArrowUpRight | Visible on Solo/Studio only | Links to /settings/billing |
| Event Type | Priority | Badge Color | Notification Content | CTA |
| --- | --- | --- | --- | --- |
| Scope flag detected | Critical | Red | Client message flagged as out-of-scope | View Flag |
| Client approved deliverable | High | Green | Deliverable name + approval timestamp | View Project |
| Client submitted feedback | High | Amber | Deliverable name + comment count | View Feedback |
| Brief submitted | Medium | Blue | Client name + brief clarity score | Review Brief |
| Change order accepted | Medium | Green | CO title + accepted amount | View CO |
| Approval reminder sent | Low | Gray | Reminder step + client name | View Timeline |
| Payment received | Low | Green | Amount + invoice reference | View Billing |
| Card | Primary Value | Secondary Value | Color Coding | Click Target |
| --- | --- | --- | --- | --- |
| Active Projects | Count of projects with status = active | vs. last month (+/- %) | Teal text | /projects?status=active |
| Awaiting Approval | Count of deliverables in review status | “Action needed” label if > 0 | Amber if > 0 | /projects?filter=awaiting |
| Scope Flags | Count of unresolved scope flags | Severity: X high, Y medium | Red if any HIGH | /scope-flags |
| Monthly Revenue | Sum of accepted change orders + MRR | MoM growth percentage | Green if positive | /change-orders |
| Component | Specification |
| --- | --- |
| Page Header | Title: “Projects” + “+ New Project” primary button (top-right) |
| Filter Bar | Tabs: All | Active | On Hold | Completed | Archived. Search input filters by project/client name |
| Sort Options | Dropdown: Last Updated (default) | Created Date | Client Name | Deadline |
| Project Cards | Card-based grid layout, 2 columns on desktop, 1 on mobile |
| Element | Position | Content |
| --- | --- | --- |
| Status Badge | Top-left | Pill badge: Active (green), On Hold (amber), Completed (blue), Archived (gray) |
| Project Name | Below badge | 20px/600 Inter, links to project detail |
| Client Name | Below project name | 14px/400, secondary color |
| Scope Meter | Center | Horizontal progress bar showing % of contracted scope used. Green/amber/red thresholds |
| Metrics Row | Below scope meter | Deliverables: X/Y | Revisions: X/Y | Open Flags: N |
| Timeline | Bottom | Start date → End date with days remaining badge |
| Quick Actions | Bottom-right | Icon buttons: View | Add Deliverable | View Flags |
| Element | Specification |
| --- | --- |
| Breadcrumb | Projects > [Client Name] > [Project Name] |
| Project Status | Editable status badge with dropdown: Active, On Hold, Completed, Archived |
| Client Info | Client name + email, click opens client detail |
| Date Range | Start date → End date, calculated from SOW timeline |
| Scope Meter | Full-width progress bar: % of scope used with color thresholds (green/amber/red) |
| Key Metrics | Deliverables: X/Y complete | Revisions: X/Y rounds used | Open Flags: N |
| Tab | Badge | Content Summary |
| --- | --- | --- |
| Brief | Score badge (e.g., 87/100) | Brief clarity score, submitted fields, version history, AI flags |
| Deliverables | Count awaiting review | File/link deliverables, upload, feedback, annotation, approval status |
| Scope Guard | Open flag count | Active SOW clauses, scope flags, monitoring status, flag history |
| Change Orders | Pending CO count | Generated COs, status tracking, client acceptance, SOW updates |
| Activity Log | None | Complete audit trail: every event, actor, timestamp, metadata |
| Element | Specification |
| --- | --- |
| Clarity Score | Large circular gauge (0-100), color-coded: red (<50), amber (50-69), green (70-100) |
| Score Timestamp | When the AI last scored this brief version |
| Brief Status | Badge: Submitted | Scoring | Scored | Held (Clarification Needed) | Approved |
| Flag Count | Number of AI-identified ambiguity flags on current version |
| Action Button | Approve Brief (if scored >= threshold) | View Clarification Requests (if held) |
| Column | Content | Sort |
| --- | --- | --- |
| Status | Icon + badge: Draft | Delivered | In Review | Changes Requested | Approved | Default sort |
| Title | Deliverable name, clickable to expand detail | Alphabetical |
| Type | File | Figma | Loom | YouTube | By type |
| Revision Round | Current / Max with color bar | By usage % |
| Last Activity | Relative timestamp of last feedback or status change | Chronological |
| Actions | View | Send Reminder | Mark Approved | N/A |
| Element | Specification |
| --- | --- |
| SOW Status | Badge: Active (green) | Draft (amber) | Inactive (gray) |
| Parsed Clauses | Grouped display: Deliverables (count) | Exclusions (count) | Revision Limits | Timeline | Payment Terms |
| Edit Button | Opens structured clause editor for manual adjustments |
| Re-Parse Button | Triggers AI re-parse of the uploaded SOW document |
| Source File | Link to download the original uploaded SOW PDF/text |
| Last Parsed | Timestamp of most recent AI parsing operation |
| Column | Content |
| --- | --- |
| Severity Badge | HIGH (red), MEDIUM (amber), LOW (blue) — pill badge |
| Client Message | Truncated to 120 characters, expandable on click |
| SOW Clause | The specific clause the message was matched against |
| Confidence | Percentage bar with color coding: >80% green, 60-80% amber, <60% gray |
| Status | Pending | Confirmed | Dismissed | Snoozed | Change Order Sent | Resolved |
| Created At | Relative timestamp |
| Actions | View Detail | Confirm & Generate CO | Dismiss | Snooze 24h |
| Column | Content |
| --- | --- |
| CO Title | AI-generated title describing the scope change |
| Amount | Calculated from rate card, formatted as currency |
| Status | Draft | Sent to Client | Accepted | Declined | Expired |
| Source Flag | Link to the scope flag that triggered this CO |
| Sent Date | When the CO was delivered to the client |
| Client Response | Accepted/Declined with timestamp, or “Awaiting” |
| SOW Impact | Shows which SOW clauses were updated upon acceptance |
| Actions | Edit (if Draft) | Resend | Download PDF | View in Portal |
| Panel | Position | Content |
| --- | --- | --- |
| Field Library | Left sidebar (280px) | Draggable field type blocks: Short Text, Long Text, Single Choice, Multiple Choice, Date/Date Range, File Upload, Conditional Logic |
| Form Canvas | Center (flex) | Drop zone showing the live form layout with real field rendering. Fields are draggable for reordering. Each field has inline edit (label, placeholder, required toggle, help text) |
| AI Settings | Below field library | Minimum clarity score threshold (slider: 50-90, default 70), action when below threshold (Hold / Notify / Allow), custom AI instructions textarea |
| Preview Button | Top-right | Opens the form in a modal exactly as the client will see it, including agency branding |
| Publish Button | Top-right | Generates the public form URL and iframe embed code |
| Field Type | Input Control | Configurable Properties |
| --- | --- | --- |
| Short Text | Single-line input | Label, placeholder, required, max length, validation (email/URL/none) |
| Long Text | Multi-line textarea | Label, placeholder, required, max length, min length |
| Single Choice | Radio buttons | Label, options list (add/remove/reorder), required |
| Multiple Choice | Checkboxes | Label, options list, required, min/max selections |
| Date / Date Range | Date picker / range picker | Label, required, min date, max date |
| File Upload | Drag-and-drop + browse | Label, required, accepted file types, max file size (up to 50MB per brief) |
| Conditional Logic | If/Show rules | Trigger field, trigger value, fields to show/hide |
| Settings Page | Key Controls |
| --- | --- |
| Workspace | Agency name, logo upload (PNG/SVG/JPG up to 2MB), primary brand color (hex picker with live preview), timezone, default currency |
| Portal Branding | Logo placement, color scheme, subdomain slug ({slug}.scopeiq.com), custom domain setup (CNAME + DNS verification status), “Powered by ScopeIQ” toggle (Studio+ plans only) |
| Team Members | Invite by email, role assignment (Owner/Admin/Member/Viewer), remove members, pending invitations list |
| Rate Card | Service types with hourly rates, used for auto-pricing change orders. Add/edit/delete rows: Service Name, Hourly Rate, Unit |
| Approval Reminders | Default reminder schedule: Step 1 (hours), Step 2 (hours), Step 3 (hours). Silence-as-approval toggle + timeframe. Per-project override toggle |
| Brief Builder Defaults | Default clarity score threshold, default hold action, default template selection for new projects |
| Billing | Current plan badge, usage metrics (projects, clients, team members), Stripe Customer Portal link for plan changes and payment method management, invoice history |
| Integrations | Connected services: Stripe (connected/not), Slack (v1.5), Figma (v1.5), Notion (v1.5). Each shows status + connect/disconnect button |
| Data & Privacy | Export all workspace data (GDPR), delete workspace (with confirmation), data retention policy display |
| Property | Specification |
| --- | --- |
| Access URL | portal.scopeiq.com/{workspace_slug}/{project_token} or {custom-domain}/{project_token} |
| Authentication | No account required. Project token is a cryptographically secure random string (32 chars). Token is single-project scoped — no cross-project access |
| Session | Browser session cookie, 30-day expiry, auto-refresh on activity |
| Client Identity | Client identified by email address entered on first visit (stored in clients table). Returning visitors recognized by session cookie |
| Branding | Agency logo, primary color, and secondary color applied via CSS variables injected server-side per workspace. Zero ScopeIQ branding on paid plans |
| Tab | Visible When | Purpose |
| --- | --- | --- |
| Brief | Brief template exists and hasn’t been fully approved | Submit and revise the project brief |
| Review Work | At least one deliverable has been delivered | View deliverables, annotate, approve or request changes |
| Messages | Always visible | View change order requests, scope-related communications, and project updates |
| Feature | Specification |
| --- | --- |
| Pagination | Questions split into steps of 4-5 each. Progress bar shows: Step X of Y + percentage complete |
| Auto-Save | Form state saved to localStorage every 30 seconds and on step transition. Returning clients see their saved progress |
| Validation | Required fields validated on step transition. Inline error messages below fields. Cannot proceed to next step with errors |
| File Uploads | Drag-and-drop zone with browse fallback. Shows upload progress. Accepted types and size limits shown. Files uploaded via presigned R2 URL |
| Conditional Logic | Fields show/hide based on previous answers per template configuration. Transitions animate with 200ms ease |
| Submission | Final step shows review summary of all answers. “Submit Brief” button with loading state. Success screen with “Thank you” message and expected next steps |
| Zone | Content |
| --- | --- |
| Revision Counter (Top) | Persistent bar: “Revision round X of Y — Z remaining” with progress bar. Color thresholds: green (0-50% used), amber (51-80%), red (80%+). At-limit message: “You’ve used all included revision rounds. Additional rounds will be billed separately.” |
| Deliverable Preview (Left, 60%) | Full-size rendering of the deliverable. Images: inline with zoom on click. PDFs: multi-page viewer via React-PDF. Figma: embedded iframe via oEmbed. Loom/YouTube: embedded player. Pin markers overlaid on images/PDFs for annotation. |
| Feedback Panel (Right, 40%) | Comment list showing all placed pins as numbered items. Each pin is clickable to scroll the preview to that location. “+ Add General Note” button for non-location-specific feedback. Overall feedback textarea at the bottom. |
| Action Buttons (Bottom) | Two buttons only: “Approve This Version” (green, primary) and “Request Changes” (outline). Approve triggers confirmation modal. Request Changes submits all feedback and increments revision counter. |
| Feature | Specification |
| --- | --- |
| Pin Placement | Click anywhere on image/PDF to place a numbered pin. Pin coordinates stored as x%/y% (device-agnostic). PDF annotations include page number |
| Pin Comment | 3-character minimum. Threaded replies supported (agency can reply to client pins). Comment panel auto-scrolls to active pin |
| Pin Resolution | Agency-only action. Resolved pins hidden from client view but preserved in audit history |
| Multi-Page PDF | Page navigation with pin count per page shown in page thumbnails |
| Mobile | Tap-to-pin on touch devices. Feedback panel collapses to bottom sheet on screens < 768px |
| Element | Specification |
| --- | --- |
| Header | “Scope Change Request” with amber accent bar |
| Description | AI-generated prose explaining what new work is being proposed and why it falls outside the original scope |
| Original SOW Reference | The specific SOW clause that the request was checked against, quoted for context |
| Pricing | Itemized: service type, estimated hours, hourly rate, total. All values from the agency’s rate card |
| Revised Timeline | If applicable, the new delivery date with explanation of timeline impact |
| Acceptance | Two buttons: “Accept & Authorize” (green) and “Decline” (outline red). Accept requires typed name + timestamp as legal acceptance. Decline requires a reason text input |
| History | If the client has multiple COs, a list view with status badges for each |
| Reminder Step | Email Template | Tone | Portal State |
| --- | --- | --- | --- |
| Step 1 (Default: 48h) | REMIND-01: Gentle nudge | Friendly: “Just checking in — your feedback on [deliverable] is ready for review.” | No change in portal. Deliverable shows “Awaiting your feedback” badge |
| Step 2 (Default: 96h) | REMIND-02: Deadline warning | Professional urgency: “Your review is holding up the next phase. Please respond by [date].” | Amber banner in portal: “Feedback requested — please review soon” |
| Step 3 (Default: 7 days) | REMIND-03: Final + silence clause | Direct: “This is a final reminder. Per our agreement, if no feedback is received by [date], this version will be considered approved.” | Red banner: “Final review period — will be auto-approved on [date]” |
| Auto-Approval | APPROVED-AUTO: Confirmation | Neutral: “[Deliverable] has been approved as delivered per our agreement terms.” | Status changes to “Approved (Auto)” with timestamp in audit log |
| State | Triggered By | Agency Sees | Client Sees | Next States |
| --- | --- | --- | --- | --- |
| draft | Template created, no submission yet | “Waiting for client” | Active form | pending_score |
| pending_score | Client submits form | “Scoring...” spinner | “Thank you, we’re reviewing” | scored, clarification_needed |
| scored | AI returns score >= threshold | Score + flags displayed | “Submitted successfully” | approved |
| clarification_needed | AI returns score < threshold | “Held — awaiting clarification” + override button | Clarification form with questions | pending_score (re-submit) |
| approved | Agency clicks Approve or overrides | “Brief approved” badge | “Your brief has been approved” | Terminal |
| State | Triggered By | Agency Sees | Client Sees | Next States |
| --- | --- | --- | --- | --- |
| draft | Agency creates deliverable entry | Edit / Upload interface | Not visible | delivered |
| delivered | Agency uploads file + clicks Deliver | “Delivered — awaiting review” | Deliverable appears in Review Work tab | in_review, approved |
| in_review | Client opens the deliverable | “In Review” + reminder countdown | Review interface with annotation tools | changes_requested, approved |
| changes_requested | Client submits feedback + clicks Request Changes | Feedback summary + revision task list | “Feedback submitted” confirmation | delivered (new round) |
| approved | Client clicks Approve OR silence-as-approval triggers | “Approved” green badge + timestamp | “Approved” confirmation | Terminal |
| State | Triggered By | Next States |
| --- | --- | --- |
| pending | AI detects out-of-scope message with confidence > 0.6 | confirmed, dismissed, snoozed |
| snoozed | Agency clicks Snooze (defers 24h) | pending (auto-returns after 24h) |
| confirmed | Agency clicks Confirm & Generate CO | change_order_sent |
| dismissed | Agency clicks Mark In-Scope (with reason) | Terminal (logged for AI training) |
| change_order_sent | Change order delivered to client | resolved (if CO accepted/declined) |
| resolved | Client accepts or declines the change order | Terminal |
| State | Triggered By | Next States |
| --- | --- | --- |
| draft | Agency confirms scope flag, CO auto-generated | sent (agency sends to client) |
| sent | Agency clicks Send to Client | accepted, declined, expired |
| accepted | Client clicks Accept & Authorize (typed name confirmation) | Terminal — SOW auto-updated |
| declined | Client clicks Decline (with reason) | Terminal — agency notified |
| expired | No client response within configured timeframe | Terminal — agency notified |
| Step | Actor | Action | System Response |
| --- | --- | --- | --- |
| 1 | Client | Fills brief form on portal and clicks Submit | Core API creates brief record (status: pending_score), stores all field values in brief_fields table |
| 2 | System | Core API dispatches BullMQ job | Job payload: { job_type: score_brief, brief_id }. Job enters Redis queue |
| 3 | AI Worker | Picks up job from queue | Fetches brief fields from DB. Constructs Claude prompt with structured output schema |
| 4 | Claude API | Returns structured JSON | { score: int, flags: [{field_key, reason, severity}] } |
| 5 | AI Worker | Stores results | Updates brief.clarity_score and brief.status. Stores flags in brief_fields. Writes audit_log entry |
| 6 | System | Real-time push | Supabase real-time subscription pushes score update to agency dashboard. If score < threshold: dispatches Resend email to client with clarification questions |
| 7 | Agency | Reviews scored brief on dashboard | Sees clarity gauge, flags, and approve/override buttons on Brief tab |
| Step | Actor | Action | System Response |
| --- | --- | --- | --- |
| 1 | Client | Sends message via portal, email, or agency pastes manually | Message stored in DB with source channel. BullMQ job dispatched: { job_type: check_scope, message_id } |
| 2 | AI Worker | Picks up job | Fetches message + all active sow_clauses for project. Constructs scope analysis prompt |
| 3 | Claude API | Returns analysis | { is_in_scope, confidence, matching_clauses[], severity, suggested_response } |
| 4 | System | Evaluates result | If !is_in_scope AND confidence > 0.6: creates scope_flags record. Pushes real-time notification to dashboard. If agency doesn’t view within 2h: sends email notification |
| 5 | Agency | Reviews flag on Scope Guard tab | Sees full context: message, clause, confidence, severity, suggested response. Takes action: Confirm / Dismiss / Snooze |
| 6 | System | Processes action | Confirm: generates change order. Dismiss: logs reason (trains AI). Snooze: defers 24h. All actions write to audit_log |
| Step | Actor | Action | System Response |
| --- | --- | --- | --- |
| 1 | Agency | Clicks “Confirm & Generate CO” on scope flag | AI generates CO prose from flag context + SOW + rate card. Agency reviews/edits in inline editor |
| 2 | Agency | Clicks “Send to Client” | CO rendered as React-PDF. Sent via portal + email with Accept/Decline action links. CO status: sent |
| 3 | Client | Clicks Accept & Authorize | Client types name (legal acceptance). CO status: accepted. SOW clauses auto-updated. Scope meter adjusted. Invoice queued |
| 4 | Client (alt) | Clicks Decline | Client provides reason. CO status: declined. Agency notified immediately. Project flagged for scope discussion |
| Breakpoint | Width | Agency Dashboard | Client Portal |
| --- | --- | --- | --- |
| Desktop | >= 1280px | Full sidebar (240px) + content area. Two-column layouts where applicable | Centered content (max-width 960px). Side-by-side preview + feedback panel |
| Tablet | 768-1279px | Sidebar collapses to 64px icon-only. Content fills remaining width. Tables scroll horizontally | Same as desktop but preview and feedback stack vertically |
| Mobile | < 768px | Sidebar becomes bottom tab bar (5 key items). Full-width content. Card layouts stack vertically | Single column. Feedback panel becomes bottom sheet. Annotation uses tap-to-pin. Progress bar simplifies |
| Permission | Owner | Admin | Member | Viewer |
| --- | --- | --- | --- | --- |
| View all projects | ✓ | ✓ | ✓ | ✓ |
| Create/edit projects | ✓ | ✓ | ✓ | ✗ |
| Upload deliverables | ✓ | ✓ | ✓ | ✗ |
| Action scope flags | ✓ | ✓ | ✓ | ✗ |
| Send change orders | ✓ | ✓ | ✗ | ✗ |
| Manage team members | ✓ | ✓ | ✗ | ✗ |
| Edit workspace settings | ✓ | ✓ | ✗ | ✗ |
| Manage billing/plan | ✓ | ✗ | ✗ | ✗ |
| Delete workspace | ✓ | ✗ | ✗ | ✗ |
| Action | Permitted | Notes |
| --- | --- | --- |
| Submit/revise brief | Yes | Only for the project they have a token for |
| View delivered work | Yes | Only deliverables with status >= delivered |
| Annotate and comment | Yes | Cannot edit or delete placed comments after 5 minutes |
| Approve or request changes | Yes | Approval is irreversible without agency intervention |
| Accept/decline change orders | Yes | Accept requires typed name as legal confirmation |
| View other projects | No | Token is single-project scoped |
| View agency dashboard | No | Separate authentication domain entirely |
| Access raw SOW or internal flags | No | Clients see change orders, never the underlying scope flags |
| Metric | Target | Measurement Method |
| --- | --- | --- |
| Page load time (agency dashboard) | < 2 seconds on 4G | Lighthouse Performance score >= 85 |
| Page load time (client portal) | < 1.5 seconds on 4G | Lighthouse Performance score >= 90 (simpler page) |
| AI brief scoring response | < 10 seconds p95 | Measured from submission to score visible on dashboard |
| AI scope flag detection | < 5 seconds p95 | Measured from message ingestion to flag appearing in UI |
| Change order generation | < 5 seconds | Measured from confirm-click to draft CO visible |
| File upload (500MB) | < 3 minutes on standard broadband | Direct-to-R2 presigned URL upload |
| Real-time updates | < 500ms latency | Supabase real-time subscription push |
| Search results (global search) | < 200ms | PostgreSQL full-text search with GIN index |
| Uptime SLA | 99.5% for paid plans | Monitored via external uptime checker |
| Template ID | Trigger | Recipient | Subject Line Pattern |
| --- | --- | --- | --- |
| ONBOARD-01 | New paying customer signup | Agency user | Welcome to ScopeIQ — your quick start guide |
| ONBOARD-02 | Day 2, checklist < 50% complete | Agency user | You’re 2 steps from your first protected project |
| ONBOARD-03 | Day 3, no scope flag yet | Agency user | Need help getting set up? [Personal from founder] |
| BRIEF-SUBMIT | Client submits brief | Agency user | [Client] submitted a brief for [Project] |
| BRIEF-CLARIFY-01 | Brief scored below threshold | Client | [Agency]: Your brief needs a few more details |
| BRIEF-APPROVED | Agency approves brief | Client | [Agency]: Your brief has been approved |
| DELIVER-01 | Agency delivers work for review | Client | [Agency]: Your [Deliverable] is ready for review |
| REMIND-01 | No response after step 1 threshold | Client | [Agency]: Just checking in on [Deliverable] |
| REMIND-02 | No response after step 2 threshold | Client | [Agency]: Your review of [Deliverable] is needed |
| REMIND-03 | No response after step 3 threshold | Client | [Agency]: Final reminder — [Deliverable] review |
| APPROVED-AUTO | Silence-as-approval triggers | Both | [Deliverable] has been approved as delivered |
| SCOPE-FLAG | Scope flag detected (agency not viewing) | Agency user | Scope flag: [Client] — [Severity] |
| CO-SENT | Change order sent to client | Client | [Agency]: Scope change request for [Project] |
| CO-ACCEPTED | Client accepts change order | Agency user | [Client] accepted your change order for [Project] |
| CO-DECLINED | Client declines change order | Agency user | [Client] declined your change order for [Project] |
| NPS-SURVEY | Day 14 of customer lifecycle | Agency user | How’s ScopeIQ working for you? (Quick survey) |
| Phase | Timeline | Portal Deliverables | User Flow Unlocked |
| --- | --- | --- | --- |
| Phase 1 | Weeks 1-4 | Agency: Global shell, nav, dashboard home, project list/detail. Client: Brief submission form. Shared: Auth, workspace setup, branding config | Agency creates project → Client submits brief → AI scores brief → Agency reviews |
| Phase 2 | Weeks 5-10 | Agency: Deliverables tab, upload flow, feedback view, reminder config. Client: Deliverable review, annotation system, approve/request changes. Shared: Revision counter, reminder sequences | Agency delivers work → Client reviews + annotates → Agency resolves feedback → Client approves |
| Phase 3 | Weeks 11-16 | Agency: Scope Guard tab, SOW upload/parser, flag list, flag detail modal, CO generator + editor. Client: Change order view, accept/decline flow. Shared: Scope meter, real-time flag notifications | SOW parsed → Client message flagged → Agency generates CO → Client accepts → SOW updated |
| Phase 4 | Weeks 17-24 | Agency: Settings (all pages), billing integration, team management. Client: Multi-deliverable navigation, message history. Shared: Email template suite, notification system | Full platform operational with billing, team roles, and complete email lifecycle |