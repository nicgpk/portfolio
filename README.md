# Nicholas Gwee — portfolio

Static personal portfolio. Serve the committed HTML, CSS and JavaScript without a framework or runtime package.

## Local preview

From this project directory:

```sh
npm ci
npm run preview
```

Open http://127.0.0.1:4183/. The server listens only on the local computer. The resume PDF and ATS resume remain in `files/`.

## Current design

The [Browserbase reference](https://www.browserbase.com/) informs the framed hero, orange headline band and animated monochrome halftone clouds. A quiet center keeps the content readable. Partner Growth Programs leads the opening. Below it, a [Firecrawl reference](https://www.firecrawl.dev/) informs centered headings, fine rules and softly framed neutral project surfaces with orange as the single accent. Three horizontal panels pair concise ownership with updated interface concepts. The original `>` logo remains throughout. Decisions and provenance are in `docs/browserbase-direction.md`, `docs/cloud-art-direction.md` and `docs/firecrawl-refinement.md`.

Scroll over the gallery with a regular mouse wheel on desktop to advance projects. At either end the page continues scrolling. Horizontal trackpad input and touch stay native; previous/next buttons and focused-gallery Left/Right/Home/End also work. The scrollbar is hidden. Mobile vertical scrolling stays native. No-JavaScript sideways scrolling and case links remain available.

Ubuntu Mono supplies labels, technical values and calculations, paired with Manrope for headings and reading text. Three self-hosted Latin WOFF2 files total 77,884 bytes; font sources and licenses are in `fonts/README.md`.

Developer Portal now supplies the shared charcoal/orange interface language for every home preview and full concept. Growth pairs its catalog with program details; Discounting pairs its result with the ordered calculation. All three cases have consistent dark openings, pale orange evidence panels and direct section links for a faster review. The detailed work index uses the same palette. See `docs/developer-project-system.md` for this pass and its source-content audit.

Growth's full concept uses a scannable resource list, search, categories, expandable mechanics and clear empty-state recovery for all eight existing programs. Discounting shows the result first, followed by each sequential deduction's basis, cut and remaining balance with exact proportional bars. Developer Portal retains its approved dark composition, with grouped fields, explicit next-step actions and a complete six-group review. All concepts are labeled and use existing content and settings. They do not enroll properties, save settings or deploy infrastructure. UX and typography decisions are in `docs/concept-refinement.md`.

Cases retain problem, role, decisions, evidence and outcomes. Each project has one colored evidence panel with its original context. The $521M+ figure describes 2025 program portfolio revenue, not revenue caused by the 2026 hub. The discount complaint ranking conflict remains disclosed. Program estimates are not summed or reconciled to that total. Updated per-night calculations correct the original arithmetic discrepancy. Full original cases and artifacts remain at `originals/`.

## Authoring

`scripts/build-pages.py` and `scripts/studio_design.py` generate the five portfolio pages from audited content and original metadata. Run `npm run build:pages` after authoring changes. The resume body is preserved separately. The generated source cloud image and shader-rendered static posters are committed in `images/`; their prompt and provenance are documented. With the preview running, use `node scripts/build-cloud-poster.mjs` to regenerate the responsive posters. The earlier vector landscape and generator remain historical source.

`css/studio.css` defines the current shared visual system over existing case and concept styles. `css/concepts.css` refines the three interfaces and preview typography; `css/project-system.css` shares the Developer Portal surfaces across previews, cases and the detailed index. `js/showcase.mjs` handles gallery navigation; `js/kinetics.mjs` handles bounded motion and persistent pause; `js/clouds.mjs` lazily initializes the original WebGL renderer in `js/halftone.mjs`. Desktop hero drawing is capped at 24fps and stops offscreen, when hidden or paused. Touch, narrow views, reduced motion, no JavaScript and unavailable graphics retain a static halftone poster. Fonts and review dependencies are project-local. No global package or new runtime dependency is required.

## Review

Install the review browser inside the project cache:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD/node_modules/.cache/ms-playwright"
./node_modules/.bin/playwright.cmd install chromium
npm test
npm run review
```

On macOS/Linux, use `PLAYWRIGHT_BROWSERS_PATH="$PWD/node_modules/.cache/ms-playwright" ./node_modules/.bin/playwright install chromium`.

The preview must be running. Reviews cover six routes at 320/390/768/1440 pixels, automated WCAG A/AA rules, local links, calculations, filtering, developer workflow, keyboard focus, no-JavaScript, pause and preference fallbacks. Gallery checks cover short viewports, wheel boundary release, horizontal trackpad input, emulated touch, resizing and exact discount proportions. Original-artifact checks cover archived playbook links, images, Escape and restored focus.

Open http://127.0.0.1:4183/review/index.html for before/after screenshots and recordings. The original main revision is in `review/before/`; the latest shared-project styling comparison is in `review/developer-system/`. Current full pages and concepts are in `review/after/`, with the hero opening, cursor recording and rendering checks in `review/etch-revision/`. Earlier revision directories remain historical evidence. Other results are in `review/checks.json`, `review/developer-system/checks.json`, `review/kinetic-checks.json`, `review/showcase-checks.json`, and `review/browserbase-revision/wheel-after.json`. Review scripts initialize the project-local browser cache before importing Playwright.

The optional `node scripts/review-cloud-performance.mjs` records a warm desktop pointer/rendering observation. It measures draw submissions and main-thread activity rather than GPU time or guaranteed visual frame rate.

## Delivery limits

Reviewed in Chromium on Windows with emulated mobile views. Safari, Firefox, actual devices, real 200% browser zoom, real screen-reader sessions and recruiter response remain unverified. Local lab performance is not production measurement. The bundled fonts cover Latin, with system fallbacks for other characters. Preserved originals retain legacy styling and scripts; resume content and existing PDF downloads remain intact. Work stays on the separate redesign branch in an open draft PR; no merge or production publication is included.
