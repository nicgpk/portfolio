# Detail Pages — Layout Fix Plan

## Problem
Everything is wrapped in `.card` — creates monotonous "box after box" feel. No visual rhythm or hierarchy between sections.

## Proposed Flow (top to bottom)

### 1. Hero (no change)
Stats + meta row already work well. Keep.

### 2. Pull quote → move up
Currently sits between My Role and Problem. Move it right after hero. Sets tone immediately, before any content.

### 3. The Problem (card)
Keep the card here — it's the core thesis statement. But drop the screenshot into a tighter layout: card on top, image below with caption.

### 4. Process (no outer card)
Process items already have numbered circles + borders between them. Wrapping them in another card is redundant. Drop the outer `.card`, let process-items sit directly in `.container`. More breathing room.

### 5. Solutions (card-grid — keep)
Works fine, stays.

### 6. Results (card — keep)
Bar chart needs a container. Keep.

### 7. Reflections (card-grid — keep)
Works fine, stays.

### What gets dropped
- **My Role section** — the hero meta row already says "Role: Product Design Lead". The pull quote now carries the personality. The narrative moved into The Problem section (first sentence sets context). Saves a full section.

### What changes
- **Screenshots** in Problem section get tighter: card → screenshot below, not floating
- **Process items** lose the outer card wrapper
- **Pull quote** moves up immediately after hero stats

## Pages affected
- `partner-growth-programs.html`
- `discounting.html`
- `dev-portal.html`

## Risk
- Dev Portal Problem section has multiple images (3 "before" screenshots + goals card). Keep the goals card, images outside.
- Losing My Role means one less place for the personal narrative. Mitigated by pull quote carrying the key line.
