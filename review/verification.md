# Verification — current bold Partner hero and color pass

Installed Chrome / loopback preview, October 2, 2026. No production deployment or main merge.

- `npm run check:html` passes all root HTML routes.
- `npm test`: 24 page/theme/width checks across six primary pages at 390/1440px. Zero axe WCAG findings, document overflow, broken images, failed local resources, or page errors. No-JS navigation, skip link, theme state and dialog Escape pass. Evidence: checks.json and final/.
- `npm run test:extended`: normal-motion home at 390/768/1440, real Tab/Enter Projects and Resume routes, keyboard-opened pattern dialog with contained focus and restored trigger, native disclosure Enter/Space, expanded source evidence axe and overflow, solid reduced-transparency navigation, no-JS disclosure. All pass; extended-checks.json.
- `npm run test:concepts`: 24 route/theme/width state checks at 390/768/1440. Searches cover results and empty states; calculator covers all four eligible promotion combinations; developer keyboard steps retain the service identity's document position. Rapid repeated input yields one final panel without blocking input. Normal motion starts the lead project arrival; live reduced-motion change cancels it. No-JS leaves a static example with inactive controls and links to original artifacts. Zero axe findings or overflow; concept-checks.json.
- `npm run test:roles`: 12 index/Projects viewport/theme checks assert all three factual roles follow their titles; zero axe findings or overflow. Evidence: role-metadata-checks.json.
- `node scripts/check-receipt.cjs`: source illustrative receipt remains discount $37.50 / net $262.50.
- `node scripts/verify-dark-logo.cjs`: actual rendered glyph #edf2f9 on adjacent glass #151515, 16.23:1, all six primary routes at 390/1440. Evidence dark-logo-checks.json and dark-logo/.
- Existing case main text is exactly unchanged relative to eef6661 after excluding only the new concept section: Partner 8940, Discount 4765, Developer 7648 normalized characters. All source image assets unchanged. content-preservation.json.

Local mobile Lighthouse on the latest hero and heading semantics: Performance 98, Accessibility 100, Best Practices 100, SEO 100; LCP 2.10s, CLS 0, no run warnings. Reports lighthouse-glass.report.json/html. Earlier glass pass was 95 / LCP 2.9s; the current hero is semantic HTML rather than a raster screenshot, so these are different implementations and local lab measurements, not production field guarantees.

`review/concepts/` includes first viewports, project explorations, and full home captures at 390/768/1440. Fixed-navigation screenshot overlays found by the independent reviewer were recaptured from document top with focus cleared. Explorations are visibly labeled newly authored concepts/sample values and do not represent shipped redesigns. Original artifacts remain accessible in every case and from the home catalog link.

Detector ran once on new concept CSS; findings were advisory additions to color/type/radius documentation. Independent finish review confirmed the direction and scored both requested fixes resolved, disposition ship at that fix-list scope. DESIGN.md and schemaVersion 2 sidecar now match current code, with eight scoped component previews. See concepts-finish-review.md.

Limits: installed Chrome verification is not a full manual screen-reader/Safari audit or WCAG certification. Existing raw research datasets were not supplied. The owner's resume eight-pattern statement versus case seven-pattern statement remains preserved pending owner clarification. Reference sites inform hierarchy and motion; none of their assets or commercial features were imported.

Current owner-directed revision: restored Partner Growth hero, black/white oversized opening, saturated red/violet/blue full-width project planes and asymmetric interfaces. One 780ms lateral operating-surface arrival now replaces the prior 650ms rise; direct focus/pointer input interrupts it and reduced motion cancels it. Reduced-transparency checks at all three widths preserve the opaque red hero and white project title.

Before/after: color-revision/before-*.png preserves abf55fd; color-revision/after-*.png shows current 390/768/1440 captures. Case main text INCLUDING prior labeled concepts exactly matches abf55fd: Partner10675,Discount5562,Developer8974 normalized chars; sourceimagesunchanged. See color-revision/content-preservation.json.

Fresh independent full review accepted the captures and confirmed that the build answers the owner's “too safe” feedback through scale, contrast, saturation and composition. No visual changes requested. The sole material fix was current design documentation; it is resolved, disposition ship at that persistence-fix scope. See color-revision/finish-review.md.
