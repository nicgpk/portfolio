# Shared links and icons

Reading links use 16px text with a 24px line height and a 48px minimum control height across the homepage, Work, three cases and screen resume. The hero's primary and secondary actions have matching heights. Long labels can wrap instead of clipping. Gallery arrows use 48px square controls. Navigation retains the original `>` logo.

Lucide supplies one locally hosted outline family for directional links, search, disclosures, workflow actions and eight program categories. Action icons use a 24px square frame; program and diagram icons use 32px frames, with program categories in 44px containers. SVGs inherit the existing monochrome/single-orange palette. Decorative icons are hidden from assistive technology; the visible label remains the accessible name.

The official sources are pinned to `500620a2e8123f8d1db191538886dc0c223f69a9` in `images/icons/lucide/SOURCE.json`. Original downloaded SVGs and the ISC license are retained alongside them. `scripts/vendor-interface-icons.mjs` builds the two local sprites from that pinned revision; no runtime package or external icon request is required. Source: [Lucide](https://lucide.dev/) and [official repository](https://github.com/lucide-icons/lucide).

`scripts/interface_icons.py` applies decorative icons during page generation, while `js/interface-icons.mjs` preserves the same icons when Developer Portal changes steps. `css/link-system.css` owns the common scale. Resume sizing applies on screen to preserve its print layout.

`review/link-system/after/checks.json` checks 24 route/viewport combinations at 320, 390, 768 and 1440px: link size, minimum height, resolved SVG symbols, equal hero actions, original logo and absence of document overflow. Dynamic workflow arrows and the final check icon are verified. Before/after action, footer and case-link screenshots are in `review/link-system/`. The source-content audits ignore decorative icons and legacy directional glyphs when comparing text; narrative workflow arrows, factual copy and all destinations remain audited.

Automated Chromium checks and screenshot inspection do not establish real-device or screen-reader behavior. Long wrapped links can be taller than 48px to preserve readable content.
