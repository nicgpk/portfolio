# Playbook Cover Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the playbook tenet table (inside a mock browser) with a native 3/2/2 editorial cover-card grid; open each pattern in a page `<dialog>` modal reusing existing detail UI.

**Architecture:** Keep `data-pb-playbook` as the root. Home view becomes `.pb-grid` of `.pb-cover` buttons. Detail moves into `<dialog class="pb-modal" data-pb-modal>` containing the existing `.pb-detail` markup. `playbook.js` switches from hide/show home↔detail to `dialog.showModal()` / `dialog.close()`, with Escape and backdrop close. CSS atmospheres are pure CSS (gradients + pseudo geometry), tinted by tenet family.

**Tech Stack:** Static HTML, CSS (`playbook-mock.css`), vanilla JS (`playbook.js`), native `<dialog>`. No new dependencies. Verify in Cursor browser / local `http.server`.

**Spec:** `docs/superpowers/specs/2026-07-27-playbook-cover-cards-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| `partner-growth-programs.html` | Section markup: remove product-shot chrome; add cover grid + dialog; bump cache versions |
| `css/playbook-mock.css` | Cover cards, 3/2/2 grid, modal shell; retire unused table-row home styles as needed |
| `js/playbook.js` | Wire open/close to `<dialog>`; keep render / prev / next / pattern data |

---

### Task 1: Restructure HTML — native section + cover grid + dialog shell

**Files:**
- Modify: `partner-growth-programs.html` (Program tenets & patterns section ~lines 128–272)

- [ ] **Step 1: Replace the product-shot figure with native section content**

Find the block starting at:

```html
<figure class="product-shot">
```

through the closing `</figure>` and the screenshot caption. Replace with:

```html
      <div class="pb-ui" data-pb-playbook>
        <div class="pb-home" data-pb-home>
          <p class="pb-eyebrow">Partner program product playbook</p>
          <h3 class="pb-title">Reusable product design patterns</h3>
          <p class="pb-lede">Four tenets and seven repeatable flows for scaling and mature partner programs.</p>

          <div class="pb-grid" data-pb-grid>
            <!-- Row 1: Activate -->
            <button type="button" class="pb-cover pb-cover--activate" data-pb-open="discover" data-pb-tenet="activate">
              <span class="pb-cover-atmosphere" aria-hidden="true"></span>
              <span class="pb-cover-copy">
                <span class="pb-cover-cue">01 · Activate</span>
                <span class="pb-cover-title">Easily discoverable</span>
                <span class="pb-cover-blurb">Program discovery, entry points, and relevance signals.</span>
              </span>
            </button>
            <button type="button" class="pb-cover pb-cover--activate" data-pb-open="confidence" data-pb-tenet="activate">
              <span class="pb-cover-atmosphere" aria-hidden="true"></span>
              <span class="pb-cover-copy">
                <span class="pb-cover-cue">01 · Activate</span>
                <span class="pb-cover-title">Convincing pre-activation confidence</span>
                <span class="pb-cover-blurb">Benefits, ROI, eligibility, FAQs, and comparison patterns.</span>
              </span>
            </button>
            <button type="button" class="pb-cover pb-cover--activate" data-pb-open="activate" data-pb-tenet="activate">
              <span class="pb-cover-atmosphere" aria-hidden="true"></span>
              <span class="pb-cover-copy">
                <span class="pb-cover-cue">01 · Activate</span>
                <span class="pb-cover-title">Self-serve activation</span>
                <span class="pb-cover-blurb">Terms, configuration, confirmation, and activation states.</span>
              </span>
            </button>

            <!-- Row 2: Manage + Track -->
            <button type="button" class="pb-cover pb-cover--manage" data-pb-open="settings" data-pb-tenet="manage">
              <span class="pb-cover-atmosphere" aria-hidden="true"></span>
              <span class="pb-cover-copy">
                <span class="pb-cover-cue">02 · Manage</span>
                <span class="pb-cover-title">Program settings to fine-tune setup</span>
                <span class="pb-cover-blurb">Fencing, pause, blackout dates, versions, and program controls.</span>
              </span>
            </button>
            <button type="button" class="pb-cover pb-cover--track" data-pb-open="analytics" data-pb-tenet="track">
              <span class="pb-cover-atmosphere" aria-hidden="true"></span>
              <span class="pb-cover-copy">
                <span class="pb-cover-cue">03 · Track</span>
                <span class="pb-cover-title">Program performance analytics</span>
                <span class="pb-cover-blurb">Impact KPIs, comparisons, reporting, and recommendations.</span>
              </span>
            </button>

            <!-- Row 3: Deactivate -->
            <button type="button" class="pb-cover pb-cover--deactivate" data-pb-open="deactivate" data-pb-tenet="deactivate">
              <span class="pb-cover-atmosphere" aria-hidden="true"></span>
              <span class="pb-cover-copy">
                <span class="pb-cover-cue">04 · Deactivate</span>
                <span class="pb-cover-title">Self-serve deactivation</span>
                <span class="pb-cover-blurb">Reason capture, impact disclosure, confirmation, and follow-up.</span>
              </span>
            </button>
            <button type="button" class="pb-cover pb-cover--deactivate" data-pb-open="retention" data-pb-tenet="deactivate">
              <span class="pb-cover-atmosphere" aria-hidden="true"></span>
              <span class="pb-cover-copy">
                <span class="pb-cover-cue">04 · Deactivate</span>
                <span class="pb-cover-title">Counter-offer for retention</span>
                <span class="pb-cover-blurb">Targeted alternatives that match the program and reason for leaving.</span>
              </span>
            </button>
          </div>
        </div>

        <dialog class="pb-modal" data-pb-modal aria-labelledby="pb-modal-title">
          <div class="pb-detail" data-pb-detail>
            <div class="pb-nav">
              <button type="button" class="pb-back" data-pb-back title="Back to all patterns">
                <svg class="pb-back-icon" aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.5 8 2l5.5 4.5"/><path d="M4 6v7h8V6"/></svg>
                <span class="pb-back-text">Home</span>
              </button>
              <div class="pb-nav-seq">
                <button type="button" class="pb-prev" data-pb-prev>
                  <span aria-hidden="true">&larr;</span> Previous
                </button>
                <button type="button" class="pb-next" data-pb-next>
                  Next <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>
            <div class="pb-detail-head">
              <p class="pb-eyebrow" data-pb-tenet></p>
              <h3 class="pb-title" id="pb-modal-title" data-pb-title></h3>
              <p class="pb-lede" data-pb-summary></p>
            </div>
            <div class="pb-ex" data-pb-ex aria-hidden="true"></div>
            <ol class="pb-steps" data-pb-steps></ol>
          </div>
        </dialog>
      </div>
```

Notes:
- Remove `hidden` from detail — dialog closed state handles visibility.
- Remove the screenshot caption under the old figure (or replace with nothing; section lede already explains).
- Keep the section `<h2>Program tenets &amp; patterns</h2>` and intro paragraph above this block.

- [ ] **Step 2: Bump cache-bust versions**

In `partner-growth-programs.html` head/scripts:

```html
<link rel="stylesheet" href="css/playbook-mock.css?v=79">
```

```html
<script src="js/playbook.js?v=79"></script>
```

- [ ] **Step 3: Commit**

```bash
git add partner-growth-programs.html
git commit -m "Restructure playbook section into cover grid and dialog shell."
```

---

### Task 2: Cover card + 3/2/2 grid CSS

**Files:**
- Modify: `css/playbook-mock.css`

- [ ] **Step 1: Adapt `.pb-ui` for native page context**

Near the top of `css/playbook-mock.css`, update `.pb-ui` so it no longer assumes a nested product-shot screen:

```css
.pb-ui {
  --pb-bg: transparent;
  --pb-card: #ffffff;
  --pb-ink: #111827;
  --pb-muted: #6b7280;
  --pb-line: #e5e7eb;
  --pb-blue: #2563eb;
  --pb-blue-soft: #eff6ff;
  --pb-blue-border: #93c5fd;
  font-family: var(--hp-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
  background: transparent;
  color: var(--pb-ink);
  padding: 0;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  text-align: left;
  position: relative;
}
```

Keep `.pb-eyebrow`, `.pb-title`, `.pb-lede` (they still style home + modal headers). If page-level `h2` already covers the section title, the home eyebrow/title/lede can stay as a secondary intro inside the block — match existing case-study density; do not duplicate a giant second H2 look. Slightly reduce home title size if it competes with the section `h2`:

```css
.pb-home > .pb-title {
  font-size: clamp(1.2rem, 2vw, 1.45rem);
}
```

- [ ] **Step 2: Add grid + cover styles**

Add after the home header rules (and leave old `.pb-table` / `.pb-row` rules in place for now — unused CSS is fine until Task 4 cleanup):

```css
.pb-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.pb-cover {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 168px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  color: #fff;
  isolation: isolate;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
  box-shadow: 0 10px 28px -18px rgba(15, 20, 25, 0.45);
}

.pb-cover:nth-child(-n + 3) {
  grid-column: span 2;
}

.pb-cover:nth-child(n + 4) {
  grid-column: span 3;
}

.pb-cover:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px -16px rgba(15, 20, 25, 0.5);
}

.pb-cover:focus-visible {
  outline: 2px solid var(--pb-blue);
  outline-offset: 3px;
}

.pb-cover:active {
  transform: scale(0.985);
}

.pb-cover.is-active {
  outline: 2px solid rgba(255, 255, 255, 0.55);
  outline-offset: -2px;
}

.pb-cover-atmosphere {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(circle at 78% 18%, rgba(255, 255, 255, 0.22), transparent 42%),
    linear-gradient(160deg, var(--pb-atm-1), var(--pb-atm-2) 55%, var(--pb-atm-3));
}

.pb-cover-atmosphere::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      -32deg,
      transparent,
      transparent 17px,
      rgba(255, 255, 255, 0.045) 17px,
      rgba(255, 255, 255, 0.045) 18px
    );
  opacity: 0.9;
  pointer-events: none;
}

.pb-cover-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
  padding: 1rem 1.05rem 1.05rem;
  background: linear-gradient(to top, rgba(8, 12, 22, 0.72) 0%, rgba(8, 12, 22, 0.28) 55%, transparent 100%);
}

.pb-cover-cue {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.8;
}

.pb-cover-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.015em;
  text-wrap: balance;
}

.pb-cover-blurb {
  font-size: 12px;
  line-height: 1.35;
  opacity: 0.88;
  text-wrap: pretty;
}

/* Tenet atmospheres */
.pb-cover--activate {
  --pb-atm-1: #152238;
  --pb-atm-2: #3d5f96;
  --pb-atm-3: #8eb0d8;
}

.pb-cover--activate:nth-child(2) {
  --pb-atm-1: #1a2a44;
  --pb-atm-2: #4a6fa8;
  --pb-atm-3: #7aa0d0;
}

.pb-cover--activate:nth-child(3) {
  --pb-atm-1: #182840;
  --pb-atm-2: #5a82b8;
  --pb-atm-3: #90b4dc;
}

.pb-cover--manage {
  --pb-atm-1: #1e3348;
  --pb-atm-2: #3d6a78;
  --pb-atm-3: #7aadb8;
}

.pb-cover--track {
  --pb-atm-1: #243848;
  --pb-atm-2: #4a7a6a;
  --pb-atm-3: #8abb9a;
}

.pb-cover--deactivate:nth-child(6) {
  --pb-atm-1: #3a2430;
  --pb-atm-2: #8a4a5c;
  --pb-atm-3: #c48898;
}

.pb-cover--deactivate:nth-child(7) {
  --pb-atm-1: #342838;
  --pb-atm-2: #7a5a88;
  --pb-atm-3: #b89ac8;
}

@media (max-width: 800px) {
  .pb-grid {
    grid-template-columns: 1fr;
  }

  .pb-cover:nth-child(-n + 3),
  .pb-cover:nth-child(n + 4) {
    grid-column: auto;
  }

  .pb-cover {
    min-height: 148px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pb-cover,
  .pb-cover:hover,
  .pb-cover:active {
    transition: none;
    transform: none;
  }
}
```

- [ ] **Step 3: Verify grid visually**

Open `http://127.0.0.1:5501/partner-growth-programs.html` (or restart `python -m http.server 5501` in the portfolio root). Confirm:
- No browser chrome around the section
- Desktop shows 3 / 2 / 2
- Cards show title + blurb + tenet cue
- Clicking does nothing useful yet (JS still expects old detail show/hide) — OK for this task

- [ ] **Step 4: Commit**

```bash
git add css/playbook-mock.css partner-growth-programs.html
git commit -m "Style playbook cover cards in a 3/2/2 editorial grid."
```

---

### Task 3: Modal CSS for `<dialog>`

**Files:**
- Modify: `css/playbook-mock.css`

- [ ] **Step 1: Add modal shell styles**

Append (or place near detail/nav rules):

```css
.pb-modal {
  width: min(920px, calc(100vw - 2rem));
  max-height: min(90vh, 900px);
  margin: auto;
  padding: 0;
  border: 1px solid rgba(15, 20, 25, 0.12);
  border-radius: 16px;
  background: var(--pb-card, #fff);
  color: var(--pb-ink, #111827);
  box-shadow:
    0 24px 64px -24px rgba(15, 20, 25, 0.45),
    0 8px 24px -12px rgba(15, 20, 25, 0.2);
  overflow: hidden;
}

.pb-modal::backdrop {
  background: rgba(15, 20, 25, 0.48);
  backdrop-filter: blur(4px);
}

.pb-modal .pb-detail {
  max-height: min(90vh, 900px);
  overflow-y: auto;
  padding: 1rem 1.15rem 1.35rem;
  background: var(--pb-card, #fff);
}

.pb-modal .pb-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  margin: 0 0 1rem;
  background: color-mix(in srgb, var(--pb-card, #fff) 88%, transparent);
  backdrop-filter: blur(12px) saturate(1.3);
  -webkit-backdrop-filter: blur(12px) saturate(1.3);
}

/* Detail no longer toggles via .pb-ui.is-detail home swap */
.pb-ui.is-detail .pb-home {
  /* keep home visible behind modal — do not hide */
}
```

Update/remove conflicting rules:
- Find `.pb-ui.is-detail .pb-home { display: none; }` or `[hidden]` coupling and neutralize so home stays visible under the modal.
- Keep detail entrance animation if desired, scoped to `.pb-modal[open] .pb-detail`.

Mobile modal:

```css
@media (max-width: 480px) {
  .pb-modal {
    width: calc(100vw - 1rem);
    max-height: calc(100vh - 1rem);
    border-radius: 14px;
  }

  .pb-modal .pb-detail {
    padding: 0.85rem 0.85rem 1.1rem;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add css/playbook-mock.css
git commit -m "Add dialog modal shell styles for playbook pattern detail."
```

---

### Task 4: Wire `playbook.js` to `<dialog>`

**Files:**
- Modify: `js/playbook.js`

- [ ] **Step 1: Resolve modal element and adjust open/close**

Near the top queries (after `var detail = ...`), add:

```javascript
  var modal = root.querySelector('[data-pb-modal]');
```

Replace `openPattern` body so it opens the dialog instead of swapping home/detail visibility:

```javascript
  function openPattern(id, trigger) {
    var pattern = patterns[id];
    if (!pattern) return;
    currentId = id;
    lastTrigger = trigger || lastTrigger || null;
    openButtons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-pb-open') === id);
    });
    render(pattern);
    root.classList.add('is-detail');
    if (detail) detail.hidden = false;
    stripRecs();
    updateNextButton();
    if (modal && typeof modal.showModal === 'function') {
      if (!modal.open) modal.showModal();
    }
    if (back && typeof back.focus === 'function') {
      try { back.focus(); } catch (err) { /* ignore */ }
    }
  }
```

Replace `closePattern`:

```javascript
  function closePattern() {
    root.classList.remove('is-detail');
    openButtons.forEach(function (btn) {
      btn.classList.remove('is-active');
    });
    currentId = null;
    stripRecs();
    if (modal && modal.open && typeof modal.close === 'function') {
      modal.close();
    }
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      try { lastTrigger.focus(); } catch (err) { /* ignore */ }
    }
  }
```

- [ ] **Step 2: Backdrop click + native `close` event**

After the existing click listener block, add:

```javascript
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closePattern();
    });
    modal.addEventListener('close', function () {
      root.classList.remove('is-detail');
      openButtons.forEach(function (btn) {
        btn.classList.remove('is-active');
      });
      currentId = null;
      if (lastTrigger && typeof lastTrigger.focus === 'function') {
        try { lastTrigger.focus(); } catch (err) { /* ignore */ }
      }
    });
  }
```

Important: avoid double-focus thrash — if `closePattern` already calls `modal.close()`, the `close` event will also run. Prefer:

```javascript
  function closePattern() {
    if (modal && modal.open && typeof modal.close === 'function') {
      modal.close(); // 'close' listener does the rest
      return;
    }
    root.classList.remove('is-detail');
    openButtons.forEach(function (btn) {
      btn.classList.remove('is-active');
    });
    currentId = null;
    stripRecs();
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      try { lastTrigger.focus(); } catch (err) { /* ignore */ }
    }
  }

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.close();
      }
    });
    modal.addEventListener('close', function () {
      root.classList.remove('is-detail');
      openButtons.forEach(function (btn) {
        btn.classList.remove('is-active');
      });
      currentId = null;
      stripRecs();
      if (lastTrigger && typeof lastTrigger.focus === 'function') {
        try { lastTrigger.focus(); } catch (err) { /* ignore */ }
      }
    });
  }
```

Home button (`data-pb-back`) should still call `closePattern()` via the existing delegated click handler.

Remove any logic that sets `home.setAttribute('hidden', '')` / removes it — home stays visible.

- [ ] **Step 3: Re-query open buttons after DOM change**

`openButtons` / `patternOrder` already come from `[data-pb-open]` — covers keep that attribute, so order remains discover → … → retention. No change needed if markup order matches.

- [ ] **Step 4: Manual verify in browser**

Checklist:
1. Click Discover → modal opens with discover content  
2. Next / Previous cycle patterns; disabled at ends  
3. Home closes modal and returns focus to the card  
4. Escape closes modal  
5. Backdrop click closes modal  
6. Body does not scroll behind open dialog (native `showModal` behavior)  
7. Mobile: grid stacks; modal usable  

- [ ] **Step 5: Commit**

```bash
git add js/playbook.js partner-growth-programs.html
git commit -m "Open playbook patterns in a native dialog modal."
```

---

### Task 5: Polish, cleanup, and final verify

**Files:**
- Modify: `css/playbook-mock.css` (remove dead home-table styles if unused)
- Modify: `partner-growth-programs.html` (cache bump if needed)
- Optionally: `js/playbook.js` (small a11y tweaks)

- [ ] **Step 1: Remove unused table-home CSS that no longer applies**

Delete or leave unused (prefer delete to reduce confusion):
- `.pb-table`, `.pb-tenet`, `.pb-tenet-label`, `.pb-flows`, `.pb-row`, `.pb-flow-title`, `.pb-flow-desc`, `.pb-stage`, `.pb-pill`, `.pb-pill--open` and related hover rules — **only if** no remaining HTML uses them.

Keep all `.pb-ex-*`, `.pb-step*`, `.pb-nav`, `.pb-back`, etc.

- [ ] **Step 2: Contrast / motion pass**

- Confirm overlay text sits on dark scrim (already in cover-copy gradient).  
- Ensure `@media (prefers-reduced-motion: reduce)` covers cover hover and any modal animation.  
- If modal animates open, use opacity/transform only; disable under reduced motion.

- [ ] **Step 3: Final browser pass + cache bump**

Bump to `?v=80` on both CSS and JS in `partner-growth-programs.html` after polish.

Hard-refresh and re-run the Task 4 checklist plus:
- Section sits between Process and The Programs without product-shot frame  
- Stat pill “7” lifecycle patterns still consistent with seven cards  

- [ ] **Step 4: Commit**

```bash
git add css/playbook-mock.css js/playbook.js partner-growth-programs.html
git commit -m "Polish playbook cover modal and remove unused table styles."
```

---

## Spec coverage check

| Spec requirement | Task |
| --- | --- |
| Remove product-shot chrome | Task 1 |
| 3/2/2 cover grid | Tasks 1–2 |
| CSS/SVG atmospheres by tenet | Task 2 |
| Title + blurb overlay | Task 1–2 |
| Page modal with existing detail | Tasks 1, 3, 4 |
| Prev/Next/Home + Escape/backdrop | Task 4 |
| Mobile stack | Task 2 |
| Reduced motion | Tasks 2, 5 |
| Reuse playbook.js pattern data | Task 4 |
| No generated bitmaps | All tasks |

## Placeholder / consistency check

- Pattern IDs: `discover`, `confidence`, `activate`, `settings`, `analytics`, `deactivate`, `retention` — consistent across HTML and JS.
- Classes: `pb-cover`, `pb-grid`, `pb-modal`, `data-pb-modal` — consistent across tasks.
- No TBD / “implement later” steps remain.
