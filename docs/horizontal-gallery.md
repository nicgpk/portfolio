# Horizontal projects without vertical scroll space

The previous page-driven gallery reserved a vertical runway and pinned its stage. Reproduction at 1440×900 measured 1,260px of extra scroll space. At the 3000px-tall screenshot viewport, the section measured 2,497.41px with a 1,400px runway. The project stage itself was only 795.22px tall.

That runway, sticky styling and page-position synchronization are removed. The same section now measures 1,097.41px at both reviewed desktop heights, with its normal heading, toolbar, complete cards and padding. Wheel paging leaves its height and the page's vertical position unchanged.

On fine-pointer screens at least 900px wide, an unmodified vertical wheel gesture over the project track or its visible side margins advances one project per burst. At the first/last project, outward scrolling returns to the page. Arrows and focused-gallery keyboard controls still align projects. Native horizontal/modified input remains native; touch, narrow screens and no JavaScript retain horizontal overflow. Reduced motion and pause use immediate horizontal movement.

Opening metric context still grows real content. While a metric disclosure is open, regular wheel input reads vertically instead of switching projects. Closing it restores the shared collapsed height. Resizing preserves selection without coupling it to page position. Card styling, project facts, routes, contact/resume links and full concepts are unchanged.

`review/horizontal-surface/checks.json` verifies no runway/sticky stage, stable section geometry/page position during margin input, boundary release, rapid keys, responsive selection, native modified input and expanded-context reading. `before/` captures 813d1be; `after/` captures the fixed section at the same viewport. The existing six-viewport gallery review also passes native trackpad/touch gestures, four no-JavaScript layouts and preference fallbacks. Review is project-local Chromium; real devices, Safari, Firefox and screen-reader sessions remain unverified. Work stays on the separate branch and draft PR without merging or production publication.
