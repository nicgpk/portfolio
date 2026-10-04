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

The framed monochrome direction keeps Singapore red as one shared accent. Nicholas Gwee is the dominant identity, with a smaller role, restrained red underline and compact centered opening. The authored Horizon uses three layered cloud forms, organic halftone variation, a clear center behind the copy and a bounded cursor brush. Selected work follows immediately, with Partner Growth Programs first. The original `>` logo, static footer landscape and existing content remain. See `docs/craft-motion.md` for the latest visual and motion pass; earlier direction notes remain historical context.

Selected work stays in ordinary page flow with no sticky stage or vertical runway. On fine-pointer screens at least 900px wide, regular wheel input over projects or their visible side margins moves horizontally, releasing to normal page scrolling at either end. Native horizontal gestures, arrows and focused-gallery Left/Right/Home/End remain available. Touch/narrow screens and no JavaScript retain natural scrolling; pause and reduced motion use immediate horizontal paging. Expanded metric context uses ordinary vertical reading. The scrollbar is hidden and resizing preserves selection. See `docs/horizontal-gallery.md`.

Ubuntu Mono supplies labels, technical values and calculations, paired with Manrope for headings and reading text. Three self-hosted Latin WOFF2 files total 77,884 bytes; font sources and licenses are in `fonts/README.md`.

Developer Portal now supplies the shared charcoal/Singapore red interface language for every home preview and full concept. Growth pairs its catalog with program details; Discounting pairs its result with the ordered calculation. All three individual cases now use white editorial openings with project-specific monochrome diagrams, neutral evidence panels and section navigation for a faster review. Singapore red is their only accent family, with neutral reading text and one exact accent value. See `docs/monochrome-case-studies.md`. The three homepage previews and full concepts now share explicit typography, unbranded headers, pane divisions, field geometry and neutral/Singapore red states through `css/concept-system.css`. See `docs/concept-standardization.md`. The Work page now reuses the exact homepage cards, metrics, source-context disclosures and standardized previews through the shared gallery generator. See `docs/work-page.md`. See `docs/developer-project-system.md` for this pass and its source-content audit.

Growth's full concept uses a scannable resource list, search, categories, expandable mechanics and clear empty-state recovery for all eight existing programs. Discounting shows the result first, followed by each sequential deduction's basis, cut and remaining balance with exact proportional bars. Developer Portal retains its approved dark composition, with grouped fields, explicit next-step actions and a complete six-group review. Interfaces use concise workflow headings and existing content and settings; repeated concept/source captions are removed. They do not enroll properties, save settings or deploy infrastructure. UX and typography decisions are in `docs/concept-refinement.md`.

Cases retain problem, role, decisions, evidence and outcomes. Each project has one neutral gray evidence panel with its original context. Home metrics sit in the left description, with supporting context in a native disclosure; case evidence opens by default. All three home cards share an intrinsic height at every breakpoint, growing together when context expands and shrinking again when it closes. No fixed height clips content. See `docs/equal-height-gallery.md`. The $521M+ figure describes 2025 program portfolio revenue, not revenue caused by the 2026 hub. The discount complaint ranking conflict remains disclosed. Program estimates are not summed or reconciled to that total. Updated per-night calculations correct the original arithmetic discrepancy. Full original cases and artifacts remain at `originals/`.

Reading links now share 16px text, 24px Lucide icons and 48px minimum control heights across all six routes. Program icons use matching 32px outlines. Long labels wrap, and the original logo remains. The icons are locally hosted with their source and ISC license. See `docs/link-system.md` and `review/link-system/`.

Each evidence panel emphasizes one lead metric and includes project-specific Singapore red linework that draws once for 900ms while visible. Numbers remain stationary. Pause, offscreen suspension, reduced motion and static no-JavaScript fallbacks remain. Home and Work previews now support program selection, sample discount toggles and deployment tabs, with stable card heights and brief shared feedback. The complete cases use the same selection and reveal motion. See `docs/craft-motion.md` and `review/craft-motion/`.

The screen resume now matches the shared monochrome/Singapore red portfolio, with a larger identity, clear PDF action and ruled experience sections. Existing content/downloads and the separate print layout are preserved. See `docs/resume-restyle.md` and `review/resume-style/`.

## Accent

The current six routes use one `--accent: #ed2939` token in `css/folio.css`; every visual accent references it directly. Original archived artifacts retain their historical colors. See `docs/accent-system.md` and `review/accent-system/`.

## Authoring

`scripts/build-pages.py` and `scripts/studio_design.py` generate the five portfolio pages from audited content and original metadata. Run `npm run build:pages` after authoring changes. The resume body is preserved separately. The generated source cloud image and shader-rendered static posters are committed in `images/`; their prompt and provenance are documented. With the preview running, use `node scripts/build-cloud-poster.mjs` to regenerate the responsive posters. The earlier vector landscape and generator remain historical source.

`css/studio.css` defines the current shared visual system over existing case and concept styles. `css/concepts.css` refines the three interfaces and preview typography; `css/project-system.css` shares the Developer Portal surfaces across previews, cases and the detailed index. `css/personal-landing.css` refines identity, complete card sizing, evidence and the landscape footer. `css/case-studies.css` is scoped to the three individual case routes, with diagrams authored in `scripts/case_design.py`. `js/showcase.mjs` handles gallery navigation and scoped wheel paging without adding page height; `js/kinetics.mjs` handles bounded motion and persistent pause; `js/clouds.mjs` lazily initializes the original WebGL renderer in `js/halftone.mjs`. Desktop hero drawing is capped at 24fps and stops offscreen, when hidden or paused. Touch, narrow views, reduced motion, no JavaScript and unavailable graphics retain a static halftone poster. Fonts and review dependencies are project-local. No global package or new runtime dependency is required.

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

Open http://127.0.0.1:4183/review/index.html for before/after screenshots and recordings. The current comparisons and interaction recording are in `review/craft-motion/`; `npm run review:craft` verifies the new interactive previews and source preservation. The latest case-study comparison is in `review/monochrome-cases/`, with a rendered color/content audit and individual case loading observations. The compact-description comparison is in `review/gallery-refinement/`. The original main revision is in `review/before/`; the latest personal-opening/card/footer comparison is in `review/personal-landing/`; the previous shared-project styling comparison is in `review/developer-system/`. Current full pages and concepts are in `review/after/`, with the hero opening, cursor recording and rendering checks in `review/etch-revision/`. Earlier revision directories remain historical evidence. Other results are in `review/checks.json`, `review/developer-system/checks.json`, `review/kinetic-checks.json`, `review/showcase-checks.json`, and `review/browserbase-revision/wheel-after.json`. Review scripts initialize the project-local browser cache before importing Playwright.

The optional `node scripts/review-cloud-performance.mjs` records a warm desktop pointer/rendering observation. It measures draw submissions and main-thread activity rather than GPU time or guaranteed visual frame rate.

## Delivery limits

Reviewed in Chromium on Windows with emulated mobile views. Safari, Firefox, actual devices, real 200% browser zoom, real screen-reader sessions and recruiter response remain unverified. Local lab performance is not production measurement. The bundled fonts cover Latin, with system fallbacks for other characters. Preserved originals retain legacy styling and scripts; resume content and existing PDF downloads remain intact. Work stays on the separate redesign branch in an open draft PR; no merge or production publication is included.
