# Project Detail Pages — Optimization Plan

## Goal
Optimize content structure, fix bugs, and improve UI across 3 detail pages (partner-growth-programs, discounting, dev-portal).

## Issues Found

### 🐛 Bug
- **dev-portal.html Process section** (line 87-93): broken HTML — stray `class="badge"` text, unclosed divs, images floating outside container. Renders broken.

### Content Issues
1. **Stat pills duplicated** — hero section shows stats, Results section repeats the same stats verbatim. Cut one.
2. **Meta card disconnected** — Role/Team/Platform/Duration sits in its own card section. Could merge into hero.
3. **No section nav** — long scroll with no way to jump between sections.
4. **Process sections inconsistent** — 7, 5, and 6 steps across pages. Varying depth.
5. **All-card monotony** — every section is the same `.card` wrapper. No visual rhythm.
6. **Images inconsistent** — inline `style`, no captions, varying layouts.

## Proposed Changes

### 1. Fix dev-portal.html
Repair broken Process section markup. This is blocking.

### 2. Consolidate hero area
Move meta info (Role/Team/Platform/Duration) into hero as a compact horizontal row *below* the stat pills. Remove standalone meta card. Saves a full section of vertical space.

### 3. Result stat pills → bar chart only
Keep the hero stat pills (they're the headline). In Results, show ONLY the bar chart + brief narrative. No duplicate stat pills. Cleaner, less repetitive.

### 4. Add "On this page" sticky nav
Left sidebar or top inline nav with jump links: Role → Problem → Process → Solutions → Results → Reflections. Only on 640px+. Gives structure to long pages.

### 5. Process: condense + add AI tags
Reduce to 4-5 key steps each. Add subtle `AI: ...` tags where relevant (matching the new landing Process vibe). Consistent depth across all 3 pages.

### 6. Pull-quote callout between Problem → Process
Extract one strong line from "My Role" as a centered pull quote. Breaks the card monotony. Example: "Learning Kubernetes wasn't optional — it was the price of entry."

### 7. Standardize images
Wrap screenshots in `.screenshot` container with consistent border + caption. Single class, no inline styles.

### 8. Add "What I'd do differently" to Reflections
Replace one reflection card with a self-critical one. Adds authenticity.

## Files Changed
- `partner-growth-programs.html`
- `discounting.html`
- `dev-portal.html`
- `css/teletype.css` — new classes: `.meta-row`, `.section-nav`, `.pull-quote`, `.screenshot`

## Priority
1. Bug fix (dev-portal) — **immediate**
2. Remove duplicate stat pills — **quick win**
3. Consolidate hero + meta — **structural improvement**
4. Section nav — **UX improvement**
5. Process condensing + AI tags — **content**
6. Pull quotes, screenshots, reflections — **polish**
