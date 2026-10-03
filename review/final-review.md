# Final review

Branch: `codex/portfolio-bold-redesign`, based on main `9cd719f`. Delivery remains a local preview and open draft PR. No merge, auto-merge, deployment or production source change.

## Current visual direction

The user explicitly requested horizontal project cards like Rauno. Home now presents three large white covers on gray, with a compact name/role masthead and Partner Growth Programs first. A visible neighboring card, position count, Previous/Next and All work make the sequence clear. Each coherent card link contains the existing role and ownership, custom graphic and updated-concept label.

The graphics remain custom: an acid-yellow eight-program property hub, cobalt sequential rate ladder and coral developer signal. Detailed interactions stay in the work index and full case studies. No factual content, metrics, contributions, original artifacts, routes, resume or contact links were replaced. There is no separate repetitive hero. The prior vertical version is preserved in `horizontal-revision/before/`.

The latest revision replaces flat program glyphs with a generated cobalt enamel/aluminum family and a larger center property model. All nine transparent 256px WebP assets total 118,634 bytes. Discovery reuses the same objects, while forced colors restores the vector symbols. Exact prompts and provenance are in `../docs/dimensional-graphics.md`. Discount bars keep their exact proportional front widths and add static physical thickness. Developer blocks have distinct top/side faces with consistent lighting. The preceding flat-symbol gallery is preserved in `3d-revision/before/`.

Independent visual review found no material desktop/tablet/mobile readability blocker. Independent interaction review prompted fixes for selected-card retention on resizing and destination focus when using a shortcut from a card link. Their regressions are included in the horizontal browser review.

The review also isolated a Chromium media-notification race when repeatedly reading the media query in active animation frames. Motion now reads an event-updated preference value; the regression changes the preference while a spring is moving.

## Scrolling and motion

Native desktop document scrolling drives the row's horizontal position within a sticky stage. There is no wheel/touch cancellation. Horizontal gestures synchronize with the document position. Scrolling past the final project reaches normal document content. Card focus, arrow keys, Home/End and Previous/Next reveal destinations without a keyboard trap.

Phones use native swipe scrolling. Reduced motion, explicit pause, no JavaScript and smaller/shorter viewports use an unpinned native horizontal gallery. Pausing/resuming retains the selected project and OS reduced motion takes precedence. Resize retains the selected project. Decorative spring motion settles at rest; the developer signal crosses its diagram once on entry. Reduced transparency retains opaque navigation.

## Verification evidence

- Page generation and four calculation tests pass.
- Six routes at 320/390/768/1440 pixels: automated WCAG A/AA rules, overflow, local links and browser errors are recorded in `checks.json` and `layout-checks.json`.
- The normal-motion desktop rail also receives an automated WCAG A/AA audit. `horizontal-checks.json` covers initial scroll position, native wheel progression, card controls, card focus, Home/End destination focus, desktop/mobile/back resizing, pause/reduced-motion retention, scrolling beyond the rail, emulated touch swipe and no-JavaScript card links.
- Full discovery, calculator and developer interactions, keyboard step visibility, static rate fallback, edge-case calculations, spring settling and pause persistence are recorded in `kinetic-checks.json` and `checks.json`. The detailed index retains the controls previously shown on home.
- Original artifact links, seven archived playbook patterns, dynamic images and Escape/focus restoration are checked. Baseline preservation is recorded in `content-preservation.json`; the original artifacts and resume files were not edited by this revision.
- Dependency audit reports no vulnerabilities. All dependencies are project-local; the runtime uses native JavaScript and static assets.
- `dimensional-checks.json` records image loading, transparency, decorative labels and vector fallback checks. The added surfaces use no new animation loop or runtime dependency.
- Exact cold-cache Chromium mobile laboratory observations are in `checks.json`, with 4x CPU throttling, 1.6Mbps bandwidth and 150ms RTT. These are not production performance scores.

`after/horizontal-motion.webm` records the home interaction checks, including verification pauses. `after/motion-demo.webm` records the detailed work-index interaction checks. Separate desktop/mobile captures show every card, since full-page screenshots cannot expose an entire horizontal row at once. Reduced-motion captures document the native fallback; `horizontal-opening-1440.png` shows normal motion.

## Remaining limitations

Safari, Firefox, actual mobile devices and real screen-reader sessions were not tested. Touch is browser-emulated. Automated rules do not establish full accessibility. Recruiter response and production performance were not measured. Source omissions/conflicting metric details remain disclosed. Preserved originals retain historical styling, external font references and arithmetic discrepancies. Concepts do not enroll properties, save settings, connect to Agoda or deploy infrastructure. Horizontal presentation requires discovery; All work provides a direct overview.

The icon objects are pre-rendered cutouts with fixed lighting and camera; the shared motion supplies bounded tilt, not an interactive 3D scene. Small icon details remain secondary to readable program names. Adding the optimized assets increases initial request count and transfer size; local performance is measured rather than assumed.
