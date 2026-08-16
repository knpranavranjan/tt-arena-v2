---
name: motion-system
description: framer-motion conventions for TT Tournament Management — when to animate, which duration/easing tokens to use, and the reference variants in src/lib/motion.ts. Load before building any animated component (cards, bracket, live match, page/stage transitions).
---

# Motion System — TT Tournament Management

Source of truth for animation on this project. Read this before adding any
`framer-motion` usage. Shared tokens and variants live in
[src/lib/motion.ts](../../../src/lib/motion.ts) — import from there instead of
hand-rolling durations/easings per component.

## Rule: motion must communicate, not decorate

Every animation should express cause → effect (a state changed, a stage
advanced, a value updated). If removing an animation wouldn't make the UI
harder to understand, don't add it. This product is "premium sports
software," not a template — restraint is part of the visual identity (see
brief §6, §53, §54).

## Tokens (`src/lib/motion.ts`)

- `duration.micro` (150ms) — hover/press/focus feedback
- `duration.standard` (250ms) — card entrances, tab/stage switches, toasts
- `duration.complex` (400ms) — bracket progression, modal/sheet open, page transitions
- `ease.out` — entrances (cubic-bezier `[0.16, 1, 0.3, 1]`)
- `ease.inOut` — looping/ambient motion (e.g. the LIVE dot)
- `ease.spring` — physical, reversible interactions (drag, seeding reorder)

Never exceed ~400ms for a UI transition. Never animate `width`/`height`/`top`/
`left` — use `transform`/`opacity` only (see `pressable`, `fadeUp`, `scaleIn`).

## What gets motion (and which variant to use)

| Interaction | Variant / pattern | Notes |
|---|---|---|
| Card/list entrance (players, tournaments, events) | `fadeUp` + `staggerChildren(40)` | Stagger 30–50ms per item, never all-at-once |
| Button/card hover-press | `pressable` | Scale 0.98–1.01 only, restore on release |
| Score change (Scoreboard, MatchCard) | old value exits, new value enters, brief highlight flash | No bounce. Crossfade, not layout shift |
| Tournament stage progress (`TournamentProgress`) | current stage emphasized (color + scale), completed stages resolved/dim, future stages subdued | Direction = forward only, no backward animation |
| Knockout bracket advance | winner's slot animates into the next round's slot (shared-element feel) | This is the one place a slightly longer (`duration.complex`) transition is justified |
| `LIVE` status indicator | `liveDotPulse` | Opacity pulse only, respects reduced-motion |
| Modal / sheet / dialog | scale+fade or slide from trigger, `duration.standard` | Exit ~60–70% of enter duration |
| Route/tab change inside a dashboard shell | crossfade, `duration.standard` | Don't animate the shell chrome, only the content region |
| Toasts | `fadeUp`, auto-dismiss 3–5s | See ui-ux-pro-max `toast-dismiss` |

## What does NOT get motion

- Static informational text, tables (row-by-row entrance only if the whole
  table is the primary content, not on every re-render/filter)
- Admin/data-dense screens in general — motion here should be rarer and
  faster than on public/marketing pages
- Anything that would run every time data auto-refreshes (live matches,
  standings) — only animate the values that actually changed

## Accessibility

Every non-essential animation must be skippable via `prefers-reduced-motion`.
Wrap ambient/looping motion (bracket lines, ball-trajectory hero effects,
`liveDotPulse`) with a check against
`window.matchMedia("(prefers-reduced-motion: reduce)")` (or the equivalent
`useReducedMotion` hook from `framer-motion`) and fall back to the static end
state — never to nothing (e.g. a LIVE badge must still read "LIVE" without
the pulse).

## Where this plugs into the phased build

Phase 1 (foundation) ships the tokens and `pressable`/`fadeUp` only. Bracket
and live-match-specific motion (table above) gets built alongside those
features in their respective phases (§15 Step 7 Knockout, §26 Live Matches in
the brief) — don't pre-build animation for screens that don't exist yet.
