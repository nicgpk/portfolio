# Nicholas Gwee — portfolio

Static personal portfolio. No framework, build step or runtime package is required to serve the committed HTML, CSS and JavaScript.

## Local preview

From this project directory:

```sh
npm ci
npm run preview
```

Open http://127.0.0.1:4183/. The server listens only on the local computer. The existing resume PDF and ATS resume remain in `files/`.

## Review

All review dependencies live in this project's `node_modules/`. No global packages are required. For browser checks, install Chromium into the project cache:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD/node_modules/.cache/ms-playwright"
./node_modules/.bin/playwright.cmd install chromium
npm test
npm run review
```

On macOS/Linux, use `PLAYWRIGHT_BROWSERS_PATH="$PWD/node_modules/.cache/ms-playwright" ./node_modules/.bin/playwright install chromium`.

The preview must be running for `npm run review`. It checks six routes at 320, 390, 768 and 1440 pixels, axe WCAG A/AA rules, local links, calculator math, discovery filtering, developer walkthrough, keyboard skip navigation, no-JavaScript content, and reduced-motion/transparency behavior. The kinetic review also checks native scrolling, eight keyboard program selections, home rate calculations, workflow stages, settled animation frames and pause persistence. It records an interaction video and a throttled performance observation. `review/checks.json` and `review/kinetic-checks.json` contain the evidence.

Open http://127.0.0.1:4183/review/index.html for before/after screenshots. `review/before/` holds the original main revision; `review/after/` holds desktop/mobile full pages, selected work, concept details and `motion-demo.webm`. `review/rauno-revision/before/` preserves the previous gallery. `review/gallery-revision/before/` preserves the rejected flat-panel draft; `review/work-first/before/` preserves the previous identity hero; `review/color-revision/before/` preserves the earlier color direction. Cropped artifact captures hide fixed navigation; full-page captures wait for deferred research images to load.

## Authoring & content

`scripts/build-pages.py` is the authoring source for the five redesigned pages. It uses Python's standard library and the original page metadata, without third-party Python dependencies. `npm run build:pages` regenerates and formats the pages. CSS and interaction modules are edited directly. The résumé body is preserved; only its navigation is replaced.

Complete existing case studies and product artifacts remain at `originals/`. Their internal routes return to the current portfolio. These snapshots retain the original interface, calculations and source discrepancies; they are explicitly original artifacts, rather than additional updated concepts. IBM Plex fonts are locally hosted with their OFL license.

Home leads with one Partner Growth Programs chapter and a custom eight-program SVG diagram. Discounting uses a live sequential rate ladder; Developer Portal uses a selectable three-stage signal path. Updated graphics reuse original content, mechanics and example settings. `images/program-symbols.svg` contains the new glyphs. `js/kinetics.mjs` handles bounded spring motion and persistent pause. Native scrolling and readable static content remain available with motion off.

Original mockup captures remain archived with provenance in `review/work-artifacts.json`. Full original artifacts remain accessible from each project. Rauno's home and Craft are the primary references for the user's chosen direction; research and limits are in `docs/portfolio-reference-review.md`.

The evidence cards preserve reported results and context. The $521M+ figure describes 2025 program portfolio revenue, not a causal result of the 2026 hub. The discount complaint ranking conflicts in the source, and program estimates are not summed or reconciled to the portfolio total. Updated discount calculations fix the original per-night arithmetic discrepancy. Concepts perform local simulations and do not enroll properties, save settings or deploy infrastructure.

## Delivery limits

Reviewed in Chromium on Windows. Browser automation cannot replace recruiter feedback, screen-reader review on actual devices, or Safari/Firefox testing. Local lab performance is not a production Lighthouse score or real-user measurement. Preserved originals and the resume retain legacy styling, typography and scripts. New portfolio runtime needs no third-party JavaScript packages. No production publication, merge or auto-merge is part of this branch.
