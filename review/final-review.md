# Final review

Branch: `codex/portfolio-bold-redesign`, based on main `9cd719f`. Delivery is a local preview and open draft PR. No merge, auto-merge, deployment or production source change.

## Current visual direction

The [Browserbase reference](https://www.browserbase.com/) informs a framed white layout, orange headline highlights, pale blue product surfaces and fine rules. Monochrome cloud artwork now gives Partner Growth Programs the flagship opening, replacing the colored pixel landscape. Desktop cursor movement adds slight drift and local light while text and labels stay stationary. The selected-work entry uses a compact program browser, avoiding a repeated hero composition. The original monospace `>` logo remains across all six routes with its 44px home-link target.

Horizontal project compositions pair role and ownership with revised product examples. Growth has a searchable catalog, category filters and expandable mechanics for the eight existing programs. Discounting uses an ordered financial receipt with exact deductions, remaining balances and proportional bars. The approved dark Developer Portal concept retains its environment, rollout and review workflow. Shared case headers, colored evidence panels, leadership, experience, archive and contact follow the new visual system.

All concepts are labeled. The previews use existing content: Promotions, Agoda Growth Program and Boost Rank; $150 × 0.85 × 0.90 = $114.75 before commission and taxes; staging-mesh, 24 cores, 24 Gi and the original Canary settings. The cloud image is generated decorative artwork, not a project artifact. Responsive WebP assets are 38KB/14KB. Rendering uses HTML/CSS/SVG with local fonts and no new runtime dependency. Design decisions and provenance are in `../docs/browserbase-direction.md` and `../docs/cloud-art-direction.md`.

## Scrolling and access

The gallery uses native horizontal overflow, proximity snapping and a hidden scrollbar. On desktop at 900px or wider with a fine pointer, an unmodified vertical mouse wheel advances one project per bounded burst while over the gallery. At the first/last project, outward wheel input resumes ordinary page scrolling. Horizontal gestures, modified input, zoom, touch and input elsewhere remain native. Previous/next controls, a project indicator and a next-card peek provide alternatives and orientation.

ArrowLeft/Right/Home/End apply when the gallery itself has focus; Tab reveals case links. Keyboard navigation brings the selected heading below the fixed navigation. The selected card controls the gallery's natural height after scrolling settles. Resize preserves selection. Without JavaScript, native sideways scrolling and full-width case links remain available; enhanced controls are hidden. No-JavaScript calculator inputs are inactive and accompanied by a labeled static example rather than stale editable totals.

The hero signal animation ends after ten seconds; rate bars reveal once. Text is immediately readable. Persistent pause, OS reduced motion, reduced-transparency navigation and forced-colors fallbacks remain. The detailed-index spring stops at rest, offscreen and when hidden.

## Content preservation

`browserbase-revision/content-checks.json` records comparison against the preceding revision `9b6249b`: all three cases' problem/role framing, decisions, evidence and supporting artifacts have unchanged normalized text. Original-artifact/contact/download links, the resume main content, all eight program records, original files and the calculation helper are preserved.

Portfolio revenue remains business scale rather than a causal result of the later hub launch. Conflicting source rankings and missing measurement details remain disclosed. Program estimates are not summed or reconciled to the portfolio total. Updated per-night calculations correct the historical arithmetic discrepancy; originals remain accessible.

## Verification

- Page generation and all four calculation tests pass.
- `checks.json` and `layout-checks.json`: six routes at 320/390/768/1440 pixels; zero automated WCAG A/AA violations, document overflow, broken local links or page errors. Functional search/filter/disclosure, calculation validation/reset, developer workflow, keyboard focus and preference fallbacks pass.
- `showcase-checks.json`: six viewport sizes including short landscape, native horizontal gestures, desktop wheel behavior, buttons, keyboard focus, resize, hidden scrollbar, no JavaScript, pause and preferences. Discount bars match the remaining-rate proportions; decorative covers have no focusable controls.
- `browserbase-revision/wheel-after.json`: regular wheel advances projects in normal and reduced motion; document position stays stable inside the gallery and releases at both ends. The reproduced pre-fix failure is in `wheel-before.json`.
- `kinetic-checks.json`: all eight keyboard program selections, calculation edge cases, workflow stages, settled motion and persistent pause. Original-artifact checks pass for seven playbook links, images, Escape and restored focus.
- Cloud-specific checks in `cloud-revision/checks.json` pass for cursor response, stationary text/labels, idle frame settling, pointer exit, pause, live reduced motion, touch/no-JavaScript and forced colors. Screenshots and a cursor recording are in `cloud-revision/`.
- Latest local mobile cold-cache observation: LCP 1.672 seconds, CLS 0.0060, 241,964 resource bytes and 14 requests at 390px, 4× CPU slowdown, 1.6Mbps and 150ms latency. This is one local Chromium lab observation, not a production score.
- Before/after screenshots and motion recordings are linked from `index.html`. The immediately preceding design is in `browserbase-revision/before/`; current openings and covers are in `browserbase-revision/after/`, with full routes and concepts in `after/`.

## Remaining limitations

Safari, Firefox, real mobile devices, real screen-reader sessions and recruiter response are unverified. Automated checks do not establish complete accessibility. Production performance is unmeasured. A purely vertical desktop trackpad gesture is indistinguishable from vertical mouse-wheel input and follows the same gallery paging behavior; horizontal trackpad gestures stay native. Without JavaScript, the gallery retains the tallest card's height. Preserved originals retain historical styling, external font references and numerical discrepancies. Home scenes are previews; full interactions live in the index and cases. Concepts do not enroll properties, save settings, connect to Agoda or deploy infrastructure.
