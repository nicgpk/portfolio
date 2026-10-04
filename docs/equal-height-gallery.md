# Equal-height project gallery

The homepage gallery now uses a single intrinsic CSS grid row. All three project cards stretch to the tallest content at each width. Expanded metric context grows the row; closing it restores the collapsed height. JavaScript no longer writes a different track height for each selected project. This also works without JavaScript.

Metric panels use a neutral gray surface (#f5f5f5), charcoal text (#202020) and gray borders. The pale orange surface is removed. Orange remains the existing action and selected-state accent. Original metric values, context and supporting evidence are unchanged.

Desktop previews fill the shared right column with captions at its foot. Below 1000px, descriptions, previews and captions stack. Shorter previews align at the top of their available space; captions retain a common bottom edge. Equal heights create extra space under the shorter mobile previews. This is the tradeoff for stable card geometry and readable source evidence.

The later `docs/horizontal-gallery.md` refinement removes the page-driven scene. Scoped horizontal wheel paging, touch overflow, hidden scrollbar, arrows, keyboard controls and reduced-motion/pause fallbacks remain. Expanded metric context uses normal vertical reading. No fixed-height crop, runtime package or global installation is introduced.

## Review evidence

- `review/personal-landing/checks.json`: equal collapsed/expanded heights and neutral panel colors at 320/390/768/1440px; original metric inventory; no-JavaScript expansion/collapse at 320/1440px.
- `review/showcase-checks.json`: six responsive gallery layouts, native gestures, keyboard navigation, responsive selection, four no-JavaScript layouts and preference fallbacks.
- `review/gallery-refinement/scroll-checks.json` and `review/browserbase-revision/wheel-after.json`: page-margin wheel input, boundary release, rapid keys, live preferences and expanded context.
- `review/equal-height-gallery/before/` captures the committed c2676af gallery; `after/` captures this refinement. Three desktop cards now measure 673.22px each, and three 390px mobile cards measure 1562.41px each. These are measurements of that refinement before the later shared concept system. They are local component measurements after fonts load, not fixed CSS dimensions.

Review uses project-local Chromium on Windows with emulated sizes. Safari, Firefox, real devices and screen-reader sessions remain unverified. Existing case-study styling, facts, routes, original artifacts and contact/resume destinations are preserved. Work stays on the redesign branch and draft PR, without production publication or merging.
