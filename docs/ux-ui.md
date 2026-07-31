# Hospital UI — UX/UI Design Guidance

**Last updated:** 2026-07-31 — informed by the `ui-ux-pro-max` skill's design-intelligence guidance
(Quick Reference tables: Accessibility, Touch & Interaction, Style Selection, Layout & Responsive,
Typography & Color, Forms & Feedback, Navigation, Charts & Data), applied to a clinical/healthcare
SaaS product. This doc sets the direction; it is not a component library.

## Style Direction

**Trustworthy, calm, high information density without clutter.** Clinical staff use this system
under time pressure on shared terminals — the UI must prioritize scan-ability and predictability
over visual flourish. Avoid: glassmorphism/heavy blur (reduces text legibility at a glance),
decorative animation, playful/bold color schemes. Prefer: a clean flat/soft-elevation style (subtle
shadows for card hierarchy, not skeuomorphic depth), generous but not wasteful whitespace, and a
restrained accent-color usage so **color is reserved for meaning** (status, urgency), not
decoration — directly following the skill's `color-not-decorative-only` rule.

## Color

- **Semantic tokens only, never raw hex in components** (`color-semantic` rule) — tenant branding
  drives `--primary`/`--brand-*`; everything else (surface, border, muted-foreground, destructive,
  success, warning) comes from the existing shared design-token set already used across
  pos-ui/inventory-ui/library-ui.
- **Reserve red for genuinely critical states** (overdue lab result, controlled-substance
  discrepancy, ICU severity flag) — not for routine negative actions like "cancel" or informational
  badges. A clinical UI that overuses red for non-urgent things trains staff to ignore it, which is
  a patient-safety problem, not just an aesthetic one.
- **Never convey status by color alone** (`color-not-only` rule) — every status badge pairs color
  with an icon and/or text label (e.g. a red dot alone for "critical" fails colorblind users and
  anyone glancing quickly; "🔴 Critical" as icon+text does not).
- Follow the platform's existing light-theme-default rule (`frontends-default-light-theme.md`) — do
  not introduce a healthcare-specific dark mode as default.

## Typography

- Base 16px body text minimum (avoids iOS auto-zoom, meets the skill's `readable-font-size` rule) —
  clinical forms are often filled on tablets at the bedside.
- Use **tabular/monospaced figures for data columns** (`number-tabular` rule) — vitals, lab values,
  bed numbers, invoice amounts must not visually jitter as digits change.
- Match the existing fleet's font pairing (whatever `library-ui`/`pos-ui` already use via
  `shared-ui-lib`) rather than introducing a new typeface — brand consistency across the whole
  Codevertex product family matters more than a healthcare-specific typographic identity.

## Layout Patterns — Data-Dense Clinical Screens vs. Dashboards

**Clinical entry screens (patient queue, vitals entry, prescription forms):**
- Favor **single-column, top-to-bottom forms** with visible labels (never placeholder-only, per
  `input-labels`) over multi-column dense grids — clinicians filling these under pressure need an
  unambiguous next-field path, not a form to visually parse.
- **Inline validation on blur, not keystroke** (`inline-validation`), with the error message stating
  the fix, not just "invalid" (`error-clarity`).
- **Autosave drafts on long forms** (`form-autosave`) — a triage/examination note lost to an
  accidental tab-close is a real clinical-workflow failure, not just an inconvenience.
- Queue/worklist views (OPD queue, lab worklist, pharmacy dispensing queue) are **tables, not
  cards**, sortable, with the current-user's-relevant items visually prioritized — this is a
  "get through my worklist fast" screen, not a browsing screen.

**Dashboards / reporting screens (occupancy, revenue, throughput):**
- Follow the skill's Charts & Data guidance: match chart type to data type (trend → line,
  comparison → bar, proportion → donut only for ≤5 categories), always show a legend, provide a
  table alternative for accessibility, and show a meaningful empty state ("No data yet") rather than
  a blank axis when a new tenant has no history.
- Stat tiles (patients today, beds occupied, pending lab results, today's revenue — the Sprint-0
  placeholder dashboard already has these slots) use the shared `StatCard` component pattern already
  established in `treasury-ui`/`pos-ui`, not a new bespoke component.

## Accessibility (non-negotiable per the skill's CRITICAL-priority rules)

- 4.5:1 contrast minimum for body text, 3:1 for large text/icons.
- Every icon-only button gets an `aria-label`.
- Full keyboard navigation — a busy ward clerk on a shared keyboard-and-mouse terminal should never
  be forced to reach for a mouse for a repetitive action (e.g. advancing an OPD queue).
- Visible focus rings — never removed for aesthetic reasons.
- Respect `prefers-reduced-motion`.

## Navigation

- Sidebar (desktop) / drawer (mobile), matching every sibling frontend — do not introduce a
  different navigation paradigm for this one product.
- **Module visibility is subscription-driven** (see `architecture.md` § Standalone-Chemist Mode) —
  a pharmacy-only tenant's sidebar shows only Pharmacy + Billing, not a greyed-out full hospital
  menu. Hiding beats disabling for modules a tenant has never purchased (per the platform's existing
  `feedback_shared_core_reference_data.md`-adjacent "show-don't-hide" precedent used elsewhere in
  the fleet — check with the current subscription-gating UI pattern before diverging).

## What this doc does NOT cover

Component-by-component specs, exact Tailwind class names, or page-by-page wireframes — those are
sprint-level implementation details, produced when each sprint's pages are actually built (see
`docs/sprints/`), informed by this direction and by re-invoking the `ui-ux-pro-max` skill for the
specific screen being built at that time.
