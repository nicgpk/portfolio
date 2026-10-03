# Monochrome selected-work refinement

Reference reviewed live on 3 October 2026: [Firecrawl](https://www.firecrawl.dev/). Its feature sections use centered headings, generous whitespace, fine structural rules, softly framed neutral surfaces and a restrained orange accent. This pass translates that treatment into the portfolio's existing content and workflows. No reference assets, code, copy or business claims were reused.

## Scope and palette

The selected-work section now has a centered introduction, a separate navigation bar and integrated project panels. Ownership remains next to each updated concept. Growth and Discounting use white interface windows on neutral gray surfaces; the Developer Portal preview retains its approved layout with neutral charcoal and the same orange accent. The divider and home footer also use neutral surfaces. The animated halftone hero, original logo, case-study layouts, evidence-card context, full concept workflows, resume and contact destinations remain preserved.

Tokens: white `#ffffff`, surface `#f7f7f7`, rule `#e5e5e5`, ink `#242424`, muted text `#666666`, orange `#ff510a`. Small orange text uses `#b93608` for contrast. The darker shade and pale tints belong to the same accent hue. Existing locally hosted IBM Plex Sans and Mono remain. No font, image or runtime dependency was added.

## Layout and interaction

The gallery still uses native horizontal overflow with a hidden scrollbar, desktop mouse-wheel paging and boundary release, touch/horizontal gestures, previous/next controls and keyboard navigation. A smaller desktop peek shows the next panel's edge without a strip of cropped letters. Captions retain the updated-concept labels and their context.

Below 1000px, the ownership header spans the panel above the interface. This keeps the focusable case link compact enough for native keyboard reveal in short landscape windows, including when JavaScript is unavailable. Mobile stacks the heading and ownership within that header. Existing reduced-motion/transparency and pause behavior remain.

No calculator values, program records, example settings, metrics, outcomes or contributions changed. Orange rate bars retain their exact proportions rather than serving as decorative scores. The full concepts and accessible originals retain their existing routes.

## Review evidence

Before/after openings, full home pages and all three project panels at 390px and 1440px are in `review/firecrawl-revision/`. `content-checks.json` compares audited section text, all six routes' link destinations and the unchanged hero markup against `a3004d5`.

The six-route accessibility/layout review, gallery review and regular-wheel checks are rerun for this revision. Current results and performance observations are documented in `review/final-review.md`. Windows Chromium and emulated mobile views do not verify Safari, Firefox, real devices, real screen readers or production performance. Work stays on `codex/portfolio-bold-redesign` in the existing draft PR; no merge or production publication.
