<!-- converted from ScopeIQ_DesignUXSpec.docx -->

ScopeIQ
Design & UX Specification
Inspired by Family.co  |  Novabots Design  |  v1.0  |  2026
Micro-interactions, motion design, and component specifications for Figma implementation

# 1. Design Philosophy — Family.co Inspiration
ScopeIQ's design language draws from Family.co's approach to making complex workflows feel delightful and approachable. The core inspiration translates as follows:
## 1.1 Principles Adapted from Family.co
## 1.2 Key Differentiators from Wireframes
The wireframes document defines layout and information architecture. This document adds the motion, interaction, and visual polish layer that makes ScopeIQ feel like Family.co's level of craft applied to agency operations.

# 2. Motion Design System
Every stateful UI change in ScopeIQ is animated. Animations serve three purposes: confirming user actions, providing spatial orientation, and creating delight. All animations use Framer Motion with the following base configurations.
## 2.1 Animation Tokens
## 2.2 Key Animated Interactions

# 3. Extended Color System
Colors are defined as CSS variables for theme consistency. The client portal inherits the agency's brand_color as --primary, overriding the default teal. All other colors remain fixed.
## 3.1 Primary Palette
## 3.2 Status Colors
## 3.3 Neutral Palette

# 4. Component Specifications
All components use Radix UI primitives with custom ScopeIQ styling. Dimensions are defined in pixels at 1x; Tailwind classes map directly.
## 4.1 Buttons
## 4.2 Cards
## 4.3 Status Badges

## 4.4 Revision Counter (Family.co-inspired)
The revision counter is a signature UI element that draws from Family.co's animated progress indicators. It communicates urgency through color progression and numerical animation.
## 4.5 Scope Meter (Family.co-inspired)
A radial or linear meter showing overall scope utilization across a project. Inspired by Family.co's circular asset allocation visualizations.

# 5. Figma Implementation Guide
The ScopeIQ Figma file should be organized to support both design exploration and developer handoff. Structure mirrors the component hierarchy in packages/ui/.
## 5.1 Figma File Structure
## 5.2 Figma Variable Modes
Set up two variable modes in Figma to support the dual-interface nature of ScopeIQ:

# 6. Responsive Design

# 7. Empty States & Loading Patterns
Following Family.co's approach to making every screen feel intentional, even when there's no data. Empty states use playful illustrations and clear CTAs. Loading states use skeleton screens (never spinners for content areas).
## 7.1 Empty States
## 7.2 Loading Patterns

# 8. Marketing Site — Family.co Layout Reference
The ScopeIQ marketing site follows Family.co's section-based landing page architecture with full-viewport sections, bold headlines, and feature showcases.
## 8.1 Section Order
## 8.2 Marketing Site Animation Spec
| Family.co Pattern | ScopeIQ Translation | Implementation |
| --- | --- | --- |
| Clean white canvas with generous whitespace | Dashboard uses surface-subtle (#F8FAFC) backgrounds with white cards floating above | 12px card border-radius, 24px card padding, 16px inter-card gap |
| Smooth micro-animations on every interaction | All state changes animate: scope flags slide in, revision counters count up, status badges morph | Framer Motion: 0.3s spring transitions, staggered children (0.05s delay) |
| Card-based progressive disclosure | Summary cards on dashboard; detail panels expand on click without page navigation | Expandable cards with height animation; detail sheet slides from right |
| Horizontal scrolling social proof | Testimonial marquee on marketing site; activity feed auto-scrolls in dashboard | CSS marquee with pause-on-hover; IntersectionObserver for lazy load |
| Bento grid feature showcase | Dashboard metric cards in 2x2 bento grid; feature sections on landing page | CSS Grid with auto-fill; cards have subtle hover scale (1.02) |
| Playful personality with serious utility | Emoji accents in empty states; celebration animations on approvals; warm copy | Confetti on first scope flag generated; checkmark animations on approval |
| Minimal color, maximum signal | Color only carries meaning (status, urgency, type); never decorative | 4 status colors + 1 accent; all other UI is gray-scale |
| Section-based page scrolling with clear dividers | Each dashboard section scrollable independently; portal pages scroll with snap | scroll-snap-type for portal; sticky section headers on dashboard |
| Token | Value | Use Case |
| --- | --- | --- |
| spring-snappy | { type: 'spring', stiffness: 500, damping: 30 } | Button presses, toggle switches, badge morphs |
| spring-smooth | { type: 'spring', stiffness: 300, damping: 25 } | Card expansions, panel slides, modal entrances |
| spring-gentle | { type: 'spring', stiffness: 200, damping: 20 } | Page transitions, section reveals on scroll |
| ease-out | { duration: 0.2, ease: [0, 0, 0.2, 1] } | Hover states, focus rings, opacity changes |
| stagger-fast | { delayChildren: 0.05, staggerChildren: 0.03 } | List item reveals (scope flags, deliverables) |
| stagger-slow | { delayChildren: 0.1, staggerChildren: 0.08 } | Dashboard card entrance on page load |
| exit-quick | { duration: 0.15, ease: 'easeIn' } | Dismissals, card removals, resolved feedback pins |
| Interaction | Animation | Family.co Parallel |
| --- | --- | --- |
| Scope flag appears | Slides in from right with spring-smooth; left red border grows from 0 to 4px; card pulsates once with subtle glow | Wallet notification slide-in |
| Revision counter increment | Number rolls up like an odometer (digit-by-digit animation); progress bar width animates; color transition green > amber > red | Price chart number animation |
| Brief clarity score reveal | Circular progress fills from 0 to score over 1.5s; number counts up; flags stagger-reveal below | Asset value counter animation |
| Change order sent | Card status badge morphs from 'Draft' (gray) to 'Sent' (blue) with scale bounce; confetti particles if first CO ever | Transaction confirmation animation |
| Client approves deliverable | Green checkmark draws (SVG path animation); status badge morphs; celebration ripple effect on card | Successful transfer animation |
| Drag-and-drop (brief fields) | Lifted item scales to 1.05 with drop shadow increase; placeholder slot pulses; snap-to with spring-snappy | Wallet drag-and-drop NFT sorting |
| Dashboard page load | Metric cards stagger-slow entrance (fade up + scale from 0.95); activity feed items cascade in with stagger-fast | Home screen asset list load |
| Portal tab navigation | Content cross-fades with 0.2s; tab indicator slides with spring-snappy; outgoing content exits left, incoming enters right | Feature tab switching |
|  | Token | Hex | Usage |
| --- | --- | --- | --- |
|  | primary-teal | #0F6E56 | Primary buttons, active nav, accent borders, links |
|  | primary-teal-mid | #1D9E75 | Hover states, badge backgrounds, focus rings |
|  | primary-teal-light | #E1F5EE | Info banners, selected row backgrounds, tag fills |
|  | primary-teal-dark | #0A5843 | Active/pressed button state, emphasis text |
|  | Token | Hex | Usage |
| --- | --- | --- | --- |
|  | status-red | #DC2626 | Scope flags, errors, critical alerts, out-of-scope |
|  | status-red-light | #FEF2F2 | Scope flag card background, error banner fill |
|  | status-amber | #D97706 | Warnings, approaching revision limit, pending items |
|  | status-amber-light | #FEF9C3 | Warning banner fill, approaching-limit highlight |
|  | status-green | #059669 | Approvals, completions, success, in-scope confirmed |
|  | status-green-light | #ECFDF5 | Success banner, approved deliverable highlight |
|  | status-blue | #2563EB | In-progress, informational notices, links |
|  | status-blue-light | #EFF6FF | Info banner fill, in-review state background |
|  | Token | Hex | Usage |
| --- | --- | --- | --- |
|  | text-primary | #0D1B2A | Headings, labels, high-emphasis content |
|  | text-secondary | #4B5563 | Body text, descriptions, secondary labels |
|  | text-muted | #9CA3AF | Placeholders, timestamps, metadata, helper text |
|  | border-default | #D1D5DB | Input borders, dividers, table borders |
|  | border-subtle | #E5E7EB | Card borders, section dividers |
|  | surface-subtle | #F8FAFC | Page backgrounds, alternate row fills |
|  | surface-white | #FFFFFF | Card backgrounds, modal backgrounds, input fills |
|  | surface-code | #F1F5F9 | Code block backgrounds, tag backgrounds |
| Property | Specification |
| --- | --- |
| Height | 40px (default), 32px (compact), 48px (hero) |
| Border Radius | 8px (all variants) |
| Font | Inter 14px/500 (default), 12px/500 (compact), 16px/600 (hero) |
| Padding | 0 16px (default), 0 12px (compact), 0 24px (hero) |
| Primary | bg: #0F6E56; text: white; hover: #1D9E75 (0.15s ease); active: #0A5843; focus: 2px ring #1D9E75 offset 2px |
| Secondary | bg: white; border: 1px #0F6E56; text: #0F6E56; hover: bg #E1F5EE |
| Danger | bg: #DC2626; text: white; hover: #B91C1C; use for destructive/irreversible only |
| Ghost | bg: transparent; text: #4B5563; hover: bg #F1F5F9; use for tertiary actions |
| Loading State | Text replaced by spinner (16px Lucide Loader2, spin animation 0.8s linear); button disabled; width preserved to prevent layout shift |
| Disabled | opacity: 0.5; cursor: not-allowed; no hover effect |
| Animation | spring-snappy scale on press (0.97); release back to 1.0 |
| Property | Specification |
| --- | --- |
| Border Radius | 12px |
| Background | surface-white (#FFFFFF) |
| Border | 1px solid border-subtle (#E5E7EB) |
| Shadow | 0 1px 3px rgba(0,0,0,0.04) (rest); 0 4px 12px rgba(0,0,0,0.08) (hover/focus) |
| Padding | 24px (desktop), 16px (mobile < 640px) |
| Hover | translateY(-1px) with spring-snappy; shadow elevates; border darkens to #D1D5DB |
| Metric Card | Large number: Inter 32px/700; label: 12px/500 text-muted; trend arrow: green up or red down |
| Scope Flag Card | Left border: 4px solid status-red; bg: status-red-light; 3 action buttons at bottom |
| Entrance | fade in + translateY(8px) over 0.3s with stagger-slow for groups |
| Property | Specification |
| --- | --- |
| Shape | Pill: height 22px, border-radius 11px, padding 0 8px |
| Font | Inter 11px/500 uppercase tracking-wide |
| Approved | bg: #ECFDF5, text: #059669, border: 1px #059669 |
| In Review | bg: #EFF6FF, text: #2563EB, border: 1px #2563EB |
| Pending | bg: #FEF9C3, text: #D97706, border: 1px #D97706 |
| Flagged | bg: #FEF2F2, text: #DC2626, border: 1px #DC2626 |
| Draft | bg: #F1F5F9, text: #4B5563, border: 1px #D1D5DB |
| Morph Animation | When status changes: old badge scales to 0.8 + fades out (0.15s); new badge scales from 0.8 to 1.0 + fades in (0.2s spring-snappy); color transitions smoothly |
| Property | Specification |
| --- | --- |
| Layout | Horizontal progress bar (100% width of container) + label text above + fraction text right-aligned |
| Bar Height | 6px, border-radius: 3px |
| Track | bg: #E5E7EB (border-subtle) |
| Fill Color Progression | 0-50%: #059669 (green); 51-80%: #D97706 (amber); 81-100%: #DC2626 (red) — smooth color transition using CSS gradient interpolation |
| Fill Animation | Width animates from previous value to new value with spring-smooth (0.6s) |
| Label | Inter 12px/500 text-muted above bar: 'Revision round X of Y' |
| Number Animation | When round increments: number rolls (odometer style, digit slides up out, new digit slides up in, 0.3s spring-snappy) |
| At-Limit Behavior | Bar fills to 100% red; pulse glow animation (box-shadow oscillates 2x); label changes to 'Revision limit reached' in status-red |
| Client Portal | Same bar but larger (8px height); text below: 'You have X rounds remaining' in body text size |
| Property | Specification |
| --- | --- |
| Style | Semi-circular arc (180 degrees) with thick stroke (8px) |
| Size | 200px diameter on project detail; 120px on dashboard card |
| Track | stroke: #E5E7EB, stroke-width: 8px |
| Fill | stroke: gradient green-to-amber-to-red based on percentage; stroke-linecap: round |
| Center Text | Percentage in Inter 32px/700; label 'scope used' in 12px/400 text-muted below |
| Animation | SVG stroke-dashoffset animates from 0% to current on mount (1.2s spring-gentle); number counts up simultaneously |
| Hover Detail | Tooltip shows breakdown: 'Deliverables: 4/6, Revisions: 3/4, Change Orders: 1' |
| Page | Contents |
| --- | --- |
| Cover | Project cover with ScopeIQ branding, version number, and last-updated date |
| Design Tokens | Color swatches as Figma styles; typography scale as text styles; spacing scale as grid definitions; shadow tokens; border-radius tokens |
| Components | All UI components as Figma components with variants: Button (primary/secondary/danger/ghost x default/hover/active/disabled/loading), Input (default/focus/error/disabled), Card (default/hover/scope-flag/metric), Badge (all status types), Revision Counter (all states), Scope Meter (all percentages) |
| Agency Dashboard | All dashboard screens: Overview, Projects List, Project Detail (5 tabs), Brief Builder, Scope Flag Detail, Settings |
| Client Portal | All portal screens: Brief Submission (4 steps), Deliverable Review (annotate mode), Change Order View, Approval Confirmation |
| Marketing Site | Landing page, pricing page, changelog, login/signup (Family.co-inspired layouts) |
| Prototyping | Interactive prototype flows connecting key user journeys: onboarding, brief-to-approval, scope flag resolution |
| Developer Handoff | Annotated specs with exact pixel values, animation timings, and CSS variable references |
| Mode | Description |
| --- | --- |
| Agency Mode | Full design system with all colors, components, and layouts. Uses ScopeIQ teal (#0F6E56) as primary. Higher information density. Professional dashboard aesthetic. |
| Portal Mode | Client-facing white-label mode. Primary color becomes a Figma variable that maps to the agency's brand_color. Reduced density. Maximum 3 actions per screen. No ScopeIQ branding. Plain English copy only. |
| Breakpoint | Width | Layout Changes |
| --- | --- | --- |
| Mobile | < 640px | Single column; nav collapses to bottom tab bar; cards full-width; metric grid 1x4 vertical; brief form fills viewport width |
| Tablet | 640-1023px | Two column dashboard; nav stays sidebar but collapsible; metric grid 2x2; portal forms have side padding |
| Desktop | 1024-1439px | Full three-column layout where applicable; 240px sidebar + content + detail panel (when open); standard experience |
| Wide | >= 1440px | Max content width 1280px, centered; extra whitespace on sides; wider cards with more horizontal info display |
| Screen | Empty State Design |
| --- | --- |
| No Projects | Illustration: blank clipboard with sparkles. Headline: 'Your first project is waiting.' Subtext: 'Create a project to start protecting your scope.' CTA: 'Create Project' (primary button) |
| No Scope Flags | Illustration: shield with checkmark. Headline: 'All clear.' Subtext: 'No out-of-scope requests detected. Your SOW is doing its job.' No CTA needed — this is a positive state. |
| No Briefs Yet | Illustration: paper airplane. Headline: 'Share your brief link.' Subtext: 'Send your intake form to clients and their responses will appear here.' CTA: 'Copy Brief Link' + 'Preview Form' |
| No Deliverables | Illustration: upload cloud with arrow. Headline: 'Upload your first deliverable.' Subtext: 'Share work with your client for review and approval.' CTA: 'Upload Deliverable' |
| First Login | Full-screen welcome with animated ScopeIQ logo. Headline: 'Welcome to ScopeIQ, [Name].' Subtext: 'Let’s set up your workspace in 3 steps.' CTA: 'Get Started' — triggers onboarding checklist overlay |
| Context | Pattern |
| --- | --- |
| Dashboard Load | Skeleton cards: gray rectangles pulsing with shimmer gradient (left-to-right sweep, 1.5s infinite). Cards shaped exactly like real content for zero layout shift. |
| AI Processing | Inline progress indicator with animated dots (...) and contextual label: 'Scoring your brief...' or 'Analyzing scope...' — no generic spinner. Shows elapsed time after 5s. |
| File Upload | Progress bar (thin, status-blue fill) under the deliverable card. Percentage text animates. Cancel button visible. On complete: bar fills green + checkmark draw animation. |
| Button Action | Button text swaps to spinning Loader2 icon. Width locked to prevent shift. Returns to text on completion with brief green flash confirmation. |
| # | Section | Family.co-Inspired Treatment |
| --- | --- | --- |
| 1 | Hero | Full viewport height. Bold headline: 'Stop working for free.' Subtext + dual CTAs (Start Free Trial / Watch Video). Background: subtle grid pattern or gradient. |
| 2 | Feature Showcase | Three-column bento grid showing Brief Builder, Approval Portal, Scope Guard. Each card has icon + short description + animated preview (like Family's send/swap/receive tabs). |
| 3 | How It Works | Horizontal step flow (1 > 2 > 3) with connector lines. Steps animate in on scroll. Similar to Family's onboarding flow showcase. |
| 4 | Social Proof Marquee | Horizontal scrolling testimonial strip (infinite CSS marquee, pause on hover). Quote cards with avatar, name, and role. Exactly like Family's 'Friends of Family' section. |
| 5 | Feature Deep-Dives | Three alternating left/right sections (image + text). Each has: section label, headline, description, feature list. Scroll-triggered reveal animations. |
| 6 | Pricing | Three-tier pricing table (Solo / Studio / Agency). Highlighted 'Most Popular' card. Toggle: monthly/annual. Simple, clean, Family.co style. |
| 7 | FAQ Accordion | Expandable question/answer pairs. Smooth height animation on expand. Chevron rotates. Matches Family's FAQ section. |
| 8 | Final CTA | Clean full-width banner: 'Protect your first project in 30 minutes.' Single primary CTA button. Minimal. |
| Element | Animation |
| --- | --- |
| Hero headline | Words fade in sequentially (0.1s stagger per word); slight Y-translate from 20px to 0. Total entrance: ~0.8s |
| Bento feature cards | IntersectionObserver trigger at 30% visibility. Cards stagger in (scale 0.95 > 1.0 + opacity 0 > 1). 0.1s stagger between cards. |
| Pricing toggle | Monthly/Annual toggle slides indicator with spring-snappy. Price numbers count-down (annual discount) with odometer animation. |
| Scroll progress | Thin line at very top of page (1px) fills primary-teal from left to right tracking scroll position. Subtle but polished. |
| Testimonial marquee | CSS animation: translateX(-50%) over 30s linear infinite. Pauses on hover. Duplicated content for seamless loop. |
| FAQ accordion | Content height animates 0 > auto with spring-smooth. Arrow icon rotates 180 degrees. Border appears below on open. |
| Navbar | Transparent on hero; gains white bg + shadow on scroll past hero (transition 0.2s). Logo stays visible throughout. |