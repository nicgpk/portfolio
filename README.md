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

Growth's full concept provides search, categories and expandable mechanics for all eight existing programs. Discounting retains sequential calculation, validation, reset, existing promotions and eligibility context; its static preview shows exact remaining-rate proportions. Developer Portal retains its environment, rollout and review workflow. All concepts are labeled and use existing content and settings. They do not enroll properties, save settings or deploy infrastructure.

Cases retain problem, role, decisions, evidence and outcomes. Each project has one colored evidence panel with its original context. The $521M+ figure describes 2025 program portfolio revenue, not revenue caused by the 2026 hub. The discount complaint ranking conflict remains disclosed. Program estimates are not summed or reconciled to that total. Updated per-night calculations correct the original arithmetic discrepancy. Full original cases and artifacts remain at `originals/`.

## Authoring

`scripts/build-pages.py` and `scripts/studio_design.py` generate the five portfolio pages from audited content and original metadata. Run `npm run build:pages` after authoring changes. The resume body is preserved separately. The generated source cloud image and shader-rendered static posters are committed in `images/`; their prompt and provenance are documented. With the preview running, use `node scripts/build-cloud-poster.mjs` to regenerate the responsive posters. The earlier vector landscape and generator remain historical source.

`css/studio.css` defines the current shared visual system over existing case and concept styles. `js/showcase.mjs` handles gallery navigation; `js/kinetics.mjs` handles bounded motion and persistent pause; `js/clouds.mjs` lazily initializes the original WebGL renderer in `js/halftone.mjs`. Desktop hero drawing is capped at 24fps and stops offscreen, when hidden or paused. Touch, narrow views, reduced motion, no JavaScript and unavailable graphics retain a static halftone poster. Fonts and review dependencies are project-local. No global package or new runtime dependency is required.

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

Open http://127.0.0.1:4183/review/index.html for before/after screenshots and recordings. The original main revision is in `review/before/`; the selected-work refinement is compared in `review/firecrawl-revision/`. Current full pages and concepts are in `review/after/`, with the hero opening, cursor recording and rendering checks in `review/etch-revision/`. Earlier revision directories remain historical evidence. Other results are in `review/checks.json`, `review/kinetic-checks.json`, `review/showcase-checks.json`, and `review/browserbase-revision/wheel-after.json`.

The optional `node scripts/review-cloud-performance.mjs` records a warm desktop pointer/rendering observation. It measures draw submissions and main-thread activity rather than GPU time or guaranteed visual frame rate.

## Delivery limits

Reviewed in Chromium on Windows with emulated mobile views. Safari, Firefox, actual devices, real screen-reader sessions and recruiter response remain unverified. Local lab performance is not production measurement. Preserved originals and the resume retain legacy content styling and scripts. Work stays on the separate redesign branch in an open draft PR; no merge or production publication is included.
