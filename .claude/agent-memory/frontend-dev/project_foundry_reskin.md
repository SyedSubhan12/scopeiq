---
name: Foundry Re-skin Migration
description: ScopeIQ migrated to Microsoft Azure AI Foundry design language — token, typography, component chrome changes; all logic/routing preserved.
type: project
---

ScopeIQ underwent a full visual re-skin to match the Microsoft Azure AI Foundry design language as of 2026-05-01.

**Why:** Product alignment with Azure AI Foundry ecosystem aesthetic for B2B SaaS positioning.

**How to apply:** When modifying UI components, all styling must follow Foundry conventions below — do not reintroduce old teal/serif patterns.

## Files changed
- `packages/ui/globals.css` — complete token replacement (Foundry blue, neutrals, status, RGB triplets, shell tokens, spacing, radii, shadows, easing)
- `apps/web/src/app/globals.css` — typography, nav shimmer removed, layout widths, badge/table/form/modal/dropdown updates
- `apps/web/src/app/layout.tsx` — all Google Fonts removed except JetBrains Mono (for `--font-mono`); Segoe UI Variable drives `--font-sans` via CSS
- `apps/web/src/components/shared/Sidebar.tsx` — Foundry sidebar: light gray bg (#F3F3F3), dark header contrast, left-border-2 active indicator, no spring animations, no pill, no gradient upgrade card
- `apps/web/src/components/shared/TopBar.tsx` — Foundry dark header (#1B1B1B solid), no backdrop-blur, dark search input (#2D2D2D/#3D3D3D), white text, no ChevronDown or font-serif on workspace name

## Critical Foundry rules
- Primary blue: #0078D4 (RGB triplet: `0, 120, 212`)
- No teal (#0F6E56 or any `--raw-teal-*`)
- No Fraunces, IBM Plex Sans, Sora, DM Sans
- Border radius max 6px on cards/inputs/buttons; `--radius-full` (9999px) for toggle pill only
- Easing: `cubic-bezier(0.1, 0.9, 0.2, 1)` for ease-out; no spring/bounce
- Duration: fast=100ms, normal=167ms, slow=267ms
- Sidebar: `bg-[rgb(var(--shell-sidebar-bg))]` = #F3F3F3, active item uses `border-l-2 border-[rgb(var(--primary))]`
- Header: `bg-[#1B1B1B]` solid, h-12
- Status badge: `border-radius: 2px`, no dot indicator
- Table header: `text-transform: none`, `letter-spacing: 0`, `font-size: 12px`, `color: #616161`
- Form inputs: `height: 32px`, `border: 1px solid #C8C6C4`, focus → `box-shadow: var(--shadow-focus)`
- Shadow focus: `0 0 0 2px #FFFFFF, 0 0 0 4px #0078D4`
