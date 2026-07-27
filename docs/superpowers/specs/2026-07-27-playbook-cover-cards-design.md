# Playbook home redesign — pattern cover cards + modal

**Date:** 2026-07-27  
**Page:** `partner-growth-programs.html`  
**Status:** Approved for planning

## Goal

Re-imagine the “Reusable product design patterns” home as a native page section (no mock browser chrome) with seven clickable editorial cover cards. Clicking a card opens the existing pattern detail in a page modal.

## Decisions locked

| Topic | Choice |
| --- | --- |
| Information architecture | Replace tenet table with 7 pattern cards |
| Visual style | Editorial abstract — CSS/SVG atmospheres (no generated bitmaps) |
| Grid | 3 / 2 / 2 rows |
| Overlay copy | Tenet cue + title + short blurb |
| Framing | Native case-study section — remove `product-shot` browser chrome for this block |
| Open pattern | Page modal / drawer over the page |
| Implementation approach | CSS/SVG abstract covers |

## Layout

### Section chrome
- Keep section-level heading content (eyebrow / title / lede), aligned with other case-study sections.
- Do **not** wrap this block in `.product-shot` / `.product-shot-frame` / URL chrome.

### Grid (desktop)
1. **Row 1 (3):** Discover · Confidence · Activate  
2. **Row 2 (2):** Settings · Analytics  
3. **Row 3 (2):** Deactivate · Retention  

Equal card height within each row. Gap ~12px. Border-radius ~14–16px.

### Grid (mobile)
- Stack to a single column.
- Preserve pattern order.
- Touch targets remain full-width cards.

## Cover card

Each card is a `<button type="button">` (or equivalent accessible control) with:

- `data-pb-open="<patternId>"` — same IDs as today (`discover`, `confidence`, `activate`, `settings`, `analytics`, `deactivate`, `retention`)
- CSS atmosphere background unique per pattern, tinted by tenet family:
  - **01 Activate** — blue family
  - **02 Manage** — teal family
  - **03 Track** — green family
  - **04 Deactivate** — plum family
- Subtle geometry / grain via pseudo-elements or inline SVG (no external image assets)
- Bottom gradient scrim for text contrast
- Overlay text:
  - Tenet cue (e.g. `01 · Activate`)
  - Pattern title
  - One-line blurb (existing flow descriptions)

Hover/focus: slight lift or atmosphere shift; clear focus ring. Active: subtle scale.

## Modal detail

### Contents
Reuse the existing detail surface from `playbook.js` / `.pb-detail`:
- Home / Previous / Next nav
- Eyebrow, title, summary
- Example mock UI (`.pb-ex`)
- Step cards (`.pb-steps`)

### Behavior
- Open on card click; close on Home, Escape, or backdrop click
- Previous / Next cycle the same `patternOrder` as today
- Lock body scroll while open
- Focus trap inside modal; restore focus to the opening card on close
- Prefer `<dialog>` (or equivalent accessible modal pattern) over a custom div-only overlay

### Visual
- Large centered panel (or near-full on mobile), not framed as a browser mock
- Preserve recent nav polish (black pills, etc.) inside the modal

## Components (logical)

1. **PatternCoverCard** — atmosphere + overlay + open trigger  
2. **PatternGrid** — 3/2/2 layout container  
3. **PatternModal** — dialog shell hosting existing detail markup/logic  

Keep pattern data and mock UIs in `js/playbook.js`. Prefer adapting home markup in `partner-growth-programs.html` and styles in `css/playbook-mock.css` (plus small HTML/JS wiring) over a new framework.

## Out of scope

- Generated bitmap / AI image assets for covers
- Keeping the product-shot browser chrome around this section
- Changing pattern mock UI content (except as needed for modal layout)
- Redesigning other case-study sections

## Success criteria

- Section reads as part of the page, not a nested product screenshot
- All 7 patterns open correctly in the modal with working Prev/Next/Home
- Desktop shows clear 3/2/2; mobile stacks cleanly
- Text on covers meets contrast (≥4.5:1 for body overlay text)
- Reduced-motion: no required motion for understanding; transitions disable under `prefers-reduced-motion`
