# Graph Report - apps/web/src  (2026-04-11)

## Corpus Check
- Large corpus: 226 files · ~92,540 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 636 nodes · 847 edges · 50 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `Responsive Breakpoints System` - 13 edges
2. `ApiClient` - 9 edges
3. `scheduleSave()` - 6 edges
4. `update()` - 6 edges
5. `useBreakpoint()` - 5 edges
6. `normalizeFieldOrder()` - 5 edges
7. `mapAuditLogEntryToNotification()` - 5 edges
8. `fetchWithAuth()` - 5 edges
9. `GSAP Animation Library` - 5 edges
10. `mapTemplateRecord()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Hyperedges (group relationships)
- **Animation Library Ecosystem** — animations_md_gsap_library, animations_md_lenis_library, animations_md_anime_library, animations_md_barba_library [EXTRACTED 1.00]
- **Responsive Component System** — responsive_readme_container, responsive_readme_grid, responsive_readme_card, responsive_readme_responsiveimage, responsive_readme_navbar, responsive_readme_modal, responsive_readme_herosection [EXTRACTED 1.00]
- **Responsive Hook Suite** — responsive_readme_usemediaquery, responsive_readme_usebreakpoint, responsive_readme_usedevicetype, responsive_readme_conveniencehooks [EXTRACTED 1.00]
- **Animation Components Suite** — animations_md_scrollrevealobjserver, animations_md_notfoundanimation, animations_md_herofloatinglotties, animations_md_pagetransitionprovider [EXTRACTED 1.00]
- **Animation Hooks Suite** — animations_md_useleniascroll, animations_md_useAnimeAnimation, animations_md_animation_config [EXTRACTED 1.00]

## Communities

### Community 0 - "API Integration"
Cohesion: 0.03
Nodes (6): getClientsQueryOptions(), useClients(), getWorkspaceTimelineQueryOptions(), useWorkspaceTimeline(), getRateCardQueryOptions(), useRateCard()

### Community 1 - "UI Components"
Cohesion: 0.05
Nodes (2): getWorkspaceQueryOptions(), useWorkspace()

### Community 2 - "ConfirmDialog.tsx"
Cohesion: 0.07
Nodes (18): addCondition(), addOption(), removeCondition(), removeOption(), update(), updateCondition(), setValue(), toggleMulti() (+10 more)

### Community 3 - "Domain Models"
Cohesion: 0.06
Nodes (0): 

### Community 4 - "app-loading-overlay.tsx"
Cohesion: 0.07
Nodes (2): GlobalNotificationHydrator(), isDashboardShellRoute()

### Community 5 - "Domain Models"
Cohesion: 0.09
Nodes (10): mapBriefAttachments(), mapBriefFields(), mapBriefFlags(), mapBriefRecord(), mapBriefVersionRecord(), mapTemplateRecord(), mapTemplateVersionRecord(), normalizeTemplateBranding() (+2 more)

### Community 6 - "middleware.ts"
Cohesion: 0.07
Nodes (6): checkSession(), middleware(), TopBar(), useSearchShortcutKbdHint(), useMarkStepComplete(), useUpdateOnboardingProgress()

### Community 7 - "UI Components"
Cohesion: 0.08
Nodes (6): goNext(), handleFileSelection(), isFieldAnswered(), uploadAttachment(), getPortalProject(), validatePortalToken()

### Community 8 - "UI Components"
Cohesion: 0.09
Nodes (4): getChangeOrdersQueryOptions(), useChangeOrders(), getScopeFlagsQueryOptions(), useScopeFlags()

### Community 9 - "Domain Models"
Cohesion: 0.1
Nodes (0): 

### Community 10 - "UI Components"
Cohesion: 0.11
Nodes (0): 

### Community 11 - "Domain Models"
Cohesion: 0.12
Nodes (2): handleCreate(), resetCreate()

### Community 12 - "Responsive Layout"
Cohesion: 0.12
Nodes (16): Accessibility Standards Rationale, Responsive Breakpoints System, Card Component, Container Component, Responsive Convenience Hooks, Design Tokens System, Grid Component, HeroSection Component (+8 more)

### Community 13 - "Custom Hooks"
Cohesion: 0.13
Nodes (2): handleFileSelect(), validateFile()

### Community 14 - "Responsive Layout"
Cohesion: 0.18
Nodes (2): getDashboardQueryOptions(), useDashboard()

### Community 15 - "Utilities"
Cohesion: 0.24
Nodes (10): getEntityHref(), getNotificationBody(), getNotificationTitle(), getNotificationType(), mapAuditLogEntryToNotification(), getAuditLogQueryOptions(), getNotificationsQueryOptions(), useAuditLog() (+2 more)

### Community 16 - "Custom Hooks"
Cohesion: 0.26
Nodes (8): useBreakpoint(), useDeviceType(), useIsDesktop(), useIsMobile(), useIsTablet(), useMediaQuery(), usePrefersReducedMotion(), useRetinaDisplay()

### Community 17 - "UI Components"
Cohesion: 0.33
Nodes (7): createField(), generateKey(), insertField(), moveField(), normalizeFieldOrder(), removeField(), updateField()

### Community 18 - "API Integration"
Cohesion: 0.4
Nodes (2): ApiClient, fetchWithAuth()

### Community 19 - "Custom Hooks"
Cohesion: 0.29
Nodes (2): getProjectsQueryOptions(), useProjects()

### Community 20 - "InviteTeamMember.tsx"
Cohesion: 0.25
Nodes (0): 

### Community 21 - "portal-theme.ts"
Cohesion: 0.32
Nodes (3): generatePortalTheme(), hexToRgb(), lightenHex()

### Community 22 - "ChangeOrderEditor.tsx"
Cohesion: 0.33
Nodes (2): ensureLineItems(), resetForm()

### Community 23 - "Animation System"
Cohesion: 0.29
Nodes (7): ANIMATION_CONFIG Utility, GSAP Animation Library, HeroFloatingLotties Component, PageTransitionProvider Component, GPU-Accelerated Properties Performance Rationale, ScrollRevealObserver Component, ScrollTrigger Replaces IntersectionObserver Rationale

### Community 24 - "Responsive Layout"
Cohesion: 0.4
Nodes (0): 

### Community 25 - "Domain Models"
Cohesion: 0.83
Nodes (3): getScopeColor(), getScopeLabel(), ScopeMeter()

### Community 26 - "Responsive Layout"
Cohesion: 0.5
Nodes (0): 

### Community 27 - "UI Components"
Cohesion: 0.5
Nodes (0): 

### Community 28 - "Animation System"
Cohesion: 0.67
Nodes (0): 

### Community 29 - "UI Components"
Cohesion: 0.67
Nodes (0): 

### Community 30 - "Domain Models"
Cohesion: 0.67
Nodes (0): 

### Community 31 - "Animation System"
Cohesion: 0.67
Nodes (0): 

### Community 32 - "typography.tsx"
Cohesion: 0.67
Nodes (0): 

### Community 33 - "Animation System"
Cohesion: 0.67
Nodes (3): Anime.js Animation Library, NotFoundAnimation Component, useAnimeAnimation Hook

### Community 34 - "Animation System"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "NavItem.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "State Management"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "LottiePlayer.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Page Structure"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "UI Components"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Page Structure"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Animation System"
Cohesion: 1.0
Nodes (2): Lenis Smooth Scrolling Library, useLenisScroll Hook

### Community 42 - "vitest.d.ts"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "breadcrumb.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Page Structure"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "UI Components"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Domain Models"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "PortalTabs.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "PortalHeader.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Page Structure"
Cohesion: 1.0
Nodes (1): Barba.js Page Transitions Library

## Knowledge Gaps
- **22 isolated node(s):** `NotFoundAnimation Component`, `HeroFloatingLotties Component`, `PageTransitionProvider Component`, `useLenisScroll Hook`, `useAnimeAnimation Hook` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Animation System`** (2 nodes): `useAnimeAnimation.ts`, `useAnimeAnimation()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `NavItem.tsx`** (2 nodes): `NavItem.tsx`, `NavItem()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `State Management`** (2 nodes): `PageTransitionProvider.tsx`, `PageTransitionProvider()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `LottiePlayer.tsx`** (2 nodes): `LottiePlayer.tsx`, `LottiePlayer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Structure`** (2 nodes): `Navbar.tsx`, `handleScroll()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `UI Components`** (2 nodes): `PoweredByBadge.tsx`, `PoweredByBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Structure`** (2 nodes): `route.ts`, `GET()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Animation System`** (2 nodes): `Lenis Smooth Scrolling Library`, `useLenisScroll Hook`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `vitest.d.ts`** (1 nodes): `vitest.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `breadcrumb.tsx`** (1 nodes): `breadcrumb.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Structure`** (1 nodes): `SidebarSettingsTree.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `UI Components`** (1 nodes): `Card.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domain Models`** (1 nodes): `ProjectIntelligence.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PortalTabs.tsx`** (1 nodes): `PortalTabs.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PortalHeader.tsx`** (1 nodes): `PortalHeader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Structure`** (1 nodes): `Barba.js Page Transitions Library`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiClient` connect `API Integration` to `API Integration`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `fetchWithAuth()` connect `API Integration` to `API Integration`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `Responsive Breakpoints System` (e.g. with `Mobile-First Philosophy Rationale` and `Container Component`) actually correct?**
  _`Responsive Breakpoints System` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `NotFoundAnimation Component`, `HeroFloatingLotties Component`, `PageTransitionProvider Component` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Integration` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `ConfirmDialog.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._