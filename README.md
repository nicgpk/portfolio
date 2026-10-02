# Nicholas Gwee portfolio

Static HTML, CSS, and JavaScript. No application compilation or production dependencies.

For local review:

```sh
npm ci
npm run preview
```

Open http://127.0.0.1:4173/. Keep the preview running in a separate terminal for checks:

```sh
npm run check:html
npm test
```

Browser tests use installed Chrome on Windows. Set `CHROME_PATH` to an installed Chromium browser on other systems, or install Playwright Chromium and adapt the launcher. Tests cover the six primary pages, light/dark, 390px/1440px, reduced motion, axe WCAG rules, overflow, assets, no-JS navigation, theme state, and dialog Escape.

Review evidence is in `review/final/` and `review/checks.json`. Read `docs/hiring-redesign-audit.md` for content provenance, factual caveats, and design direction. The WebP artifacts are lossless conversions of the existing PNG assets; originals remain available.

For shared CSS changes, run `npm run build:css`. Run `npm run test:extended` for normal motion, 768px layout, expanded evidence, keyboard navigation/dialog focus, and reduced-transparency checks. The original source PNGs remain unchanged; responsive hero derivatives resize those same pixels.

The current project covers are clearly labeled semantic HTML interface explorations using only existing project content. Original artifacts stay accessible in the case studies. Run `npm run test:concepts` for live search, calculator combinations, keyboard deployment steps, rapid input, no-JS fallback, motion/reduced-motion and 390/768/1440 light/dark checks. `npm run test:roles` verifies role metadata stays below each project title. Current concept screenshots and reports are in `review/concepts/` and `review/concept-checks.json`.
