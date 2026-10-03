# Concept UX and typography pass

3 October 2026. The approved Developer Portal composition is the internal reference: deliberate information groups, precise data, visible workflow state and controls that explain their next action. The monochrome/orange home direction and halftone hero remain. No product capability, project metric, business outcome or contribution is added.

## Typography

[Ubuntu Mono](https://design.ubuntu.com/font) supplies utility labels, captions, identifiers, calculations and technical values. [Manrope](https://www.sharanda.com/manrope) supplies headings, interface names and reading text. Its proportional shapes give the fixed-width labels clear contrast without another display family. Utility type in the home previews is enlarged rather than copying the older tiny sizes.

The current pair uses three local WOFF2 files: Manrope variable 400–700, Ubuntu Mono regular and bold. Total payload: 77,884 bytes. Both faces use immediate system fallbacks and `font-display: swap`; regular faces are preloaded. The current six routes, including resume and its print styles, use the pair without requests to a remote font service. Preserved originals and existing PDF downloads stay unchanged. Font sources and licenses are recorded in `../fonts/README.md`.

Typography self-review: 9/10 for hierarchy, role contrast, useful numeric distinction and responsive legibility in the reviewed Chromium views. A 10/10 assessment would require real-device reading, real 200% browser zoom, broader language coverage and reader feedback; those remain unverified. The bundled web fonts cover Latin; other scripts and unsupported symbols use the declared system fallbacks.

## Concepts

- **Growth:** replace large generic tiles with an aligned resource list. Names, descriptions and category chips support scanning across all eight programs. The whole summary is a native disclosure with a rotating chevron; opening shows the existing mechanics in context. Search and category changes update the count and heading; a visible empty state and Clear filters restore a useful list and return focus to search. Without JavaScript, filtering is honestly disabled and all native disclosures remain available. Sidebar labels retain the existing workspace context and are not presented as working navigation.
- **Discounting:** show the resulting rate before the detailed receipt. Every deduction states its percentage, the balance it applies to, its monetary cut and the new remaining balance. Bars encode those exact balances. Total discount is derived from the same cent-rounded helper, not a new business metric. Invalid rates remove stale totals, ledger rows and the formula. Existing promotions, eligibility example, reset, currency and commission/tax exclusions remain.
- **Developer Portal:** preserve the dark composition and existing Environment → Rollout → Review flow. Group environment/source, resources, strategy and targets with semantic fieldsets. Distinguish the current and completed steps with shape/labels as well as orange. Continue names the destination. A complete review includes all six configuration groups, including in the static version. Values survive back navigation in memory; the preview still saves and deploys nothing.

The environment-name pattern had a legacy unescaped hyphen that current HTML validation treated as an invalid regular expression, allowing spaces through. The literal hyphen is now escaped: letters, numbers, underscores and hyphens remain the intended allowed characters. This is covered by an invalid-name regression check.

The larger preview type also exposed an existing native horizontal-wheel trap over the catalog's clipped decorative introduction. `overflow: clip` retains the visual crop without making that banner a nested scroll container. Proximity snapping could also undo small horizontal gestures in mobile landscape, so native gestures now move freely while buttons, keyboard navigation and desktop vertical-wheel paging still target complete projects. Reflow-generated scroll events wait for the resize handler to restore the selected project. The full gallery checks pass across six viewport sizes and four static cases.

## Evidence and delivery

`review/concept-refinement/checks.json` compares case framing, decisions, evidence, supporting artifacts, program records, developer example values, resume content and all link destinations against `63d1ff9`. Hero markup remains identical; only its type and utility sizes inherit the new pair. Concept labels, preview limits and accessible original links remain visible.

Before/after concepts, gallery panels and typography openings at 390/1440px are in `review/concept-refinement/`. The focused review covers keyboard disclosures, filter recovery, calculation bases/cuts/balances/proportions, invalid states, developer orientation and static fallbacks. General route, gallery, wheel, motion, cloud and original-artifact checks are also rerun. Review scripts initialize the browser cache before importing Playwright so tooling uses the project-local browser binaries.

The branch remains `codex/portfolio-bold-redesign` in draft PR #2. No merge or production publication. Current performance observations and remaining browser/device/accessibility limits are in `review/final-review.md`.
