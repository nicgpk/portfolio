# Glass redesign verification

Latest brief: modern, minimalistic glass UI with the same supported portfolio content. No main merge or production publication.

- Shared CSS rebuilt deterministically with npm run build:css; three blocking shared stylesheet requests become one. Source stylesheets remain editable.
- npm run check:html passed all root HTML documents.
- npm test passed24 route/theme/viewport combinations: six primary pages,390/1440px, light/dark, reduced motion. Zero axe WCAG2 A/AA,2.1AA and2.2AA findings, horizontal overflow, broken images, missing fragment anchors, local resource failures or page errors.
- npm run test:extended passed normal-motion home rendering, keyboard Tab/Enter Projects and Resume navigation, keyboard-opened pattern dialog with contained Tab cycle and focus restored after Escape, and keyboard-native disclosures. Expanded case evidence has zero axe findings and overflow at390/768/1440px. Reduced-transparency emulation produces solid navigation without blur. Native disclosures also work without JavaScript. Results: extended-checks.json.
- Case main-content text compared exactly with commit84cabd7 after removing only new disclosure summaries: Partner8754characters, Discount4626, Developer7202, unchanged normalized source text. Original source PNGs remain untouched.
- Illustrative receipt arithmetic: discount37.50, net262.50; scripts/check-receipt.cjs passes.
- Dark navigation logo remains distinct from the background; all three expanded mobile deployment headers have no geometric overlap and were visually inspected.
- Independent Impeccable finish review matched the current minimal glass world and identified mobile resume overlap and role eyebrows. After fixes and refreshed captures, both were scored resolved, disposition ship. This verdict covers the named fixes, not whole-site accessibility certification.
- Detector ran once on glass.css: only advisory undocumented type-ramp steps. DESIGN.md records the intentional ramp; documentation handoff verifies current tokens and sidecar.

## Loading

Local mobile Lighthouse after the glass/style/loading pass: Performance95, Accessibility100, Best Practices100, SEO100; LCP2.9seconds, CLS0, total blocking time0ms. Reports: lighthouse-glass.report.html/json. The earlier split design scored92 with LCP3.2s. These lab runs are not identical production field comparisons; final small resume/role corrections are below the home first viewport. LCP still exceeds the2.5s target. No improvement beyond the measured figures is claimed.

Hero derivatives retain the full existing Developer catalog composition:400px22416bytes,700px51298bytes,1000px77442bytes. Mobile Lighthouse selected700px. Explicit sizes, priority discovery and sans-font preload support loading; the priority artifact has no entrance animation. images/developer-catalog.provenance.json records source and derivative hashes.

## Review artifacts and limits

final/ contains refreshed primary routes at390/1440light plus home390dark. glass-home-390/768/1440.png show normal settled first viewports; before-glass-home.png preserves the rejected prior split-hero rendering. The blank local page was not reproduced: visible hero and three projects, HTTP200, zero failed local resources/page errors. Loopback preview remains at http://127.0.0.1:4173/.

Dense source text requires full-size original image links on small screens. Screenshots and axe do not replace a full screen-reader/manual WCAG audit; supported verification used installed Chrome. No raw project research dataset was supplied. The resume's eight-pattern statement conflicts with the Partner case's seven; preserve owner content pending confirmation. Home npm investigation is private outside this repository and excluded from publication.
