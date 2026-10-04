# Monochrome case studies with one orange accent

## Direction and scope

Partner Growth Programs, Discounting 2.0 and Developer Portal now share a grayscale reading system with orange as the only accent family. The homepage and selected-work gallery retain their approved design. White openings replace the previous charcoal slabs; each pairs the existing project thesis and role with a purpose-built illustrative diagram. The project name is explicit on every opening. Ubuntu Mono and Manrope remain self-hosted.

The palette is white #fff, pale gray #f5f5f5, charcoal #202020, secondary gray #646464 and neutral gray borders. Orange #ff510a marks actions, selected states and the evidence panel's top edge. A darker shade #b93608 keeps small orange text readable on white; lightened orange is reserved for hover in the dark interface. These are contrast variants of one accent, not separate project colors.

## Project-specific graphics

- Growth uses eight existing program glyphs around one hub. The visual describes the existing information-architecture direction, not an additional feature or outcome.
- Discounting shows the original illustrative $150 starting rate, $127.50 after 15%, and $114.75 after a further 10%. Bars represent 100%, 85% and 76.5% of the original balance. Commission and taxes remain excluded.
- Developer Portal shows the existing Environment → Rollout → Review workflow, staging-mesh, 24 cores, 24 Gi, Canary percentages and the three original data-center locations.

The case routes omit the unused 16,433-byte gallery stylesheet. Their scoped case stylesheet is 14,104 bytes, and is not loaded by the homepage.

All diagrams are labeled Updated concept, decorative and excluded from the focus order. They are HTML/SVG with no runtime package or generated bitmap dependency.

## Reading and interaction

The problem and role have a clearer editorial hierarchy. Decision titles sit beside their rationale on wide screens and stack naturally on narrow screens. Every case has one neutral evidence panel with all existing primary metrics, supporting figures and measurement limits. Figures align at the top; supporting evidence remains open by default.

The section navigation stays below the site header on wide screens and returns to ordinary page flow on mobile. Anchor targets and developer workflow headings reserve space for both navigation bars. Mobile uses a two-column section menu. Full concepts keep their existing search, categories, disclosures, calculations and developer flow, using charcoal surfaces and orange state cues. Leftover colored borders and error treatments are replaced with neutral/orange equivalents.

The developer research image is displayed through a grayscale CSS filter. A caption discloses this presentation choice. Its original file, full-size link and source colors are unchanged. Original cases and artifacts retain their historical appearance and are directly accessible. Routes, resume and contact links remain intact.

## Validation and evidence

`review/monochrome-cases/checks.json` compares all three pages against 78c8646. Existing normalized body text and anchor destinations remain identical after excluding the new project label, decorative diagram and research presentation note. Program records, role claims, metrics, calculations, outcome limitations and source conflicts are preserved.

The color audit checks rendered text, fills, backgrounds, borders, outlines and generated pseudo-elements across 12 route/viewport combinations, plus expanded program details, invalid/reset calculator states and all developer steps. Every observed color is neutral or in the orange accent family. Navigation targets and workflow headings are checked against the sticky navigation. Forced colors hides decorative diagrams.

The broader review covers six routes at 320/390/768/1440px, automated WCAG A/AA rules, links, calculations, filtering, keyboard focus, no JavaScript and preferences. Before/after openings, full pages, evidence and concepts are in `review/monochrome-cases/`. Final local cold-cache mobile observations in `performance.json` recorded LCP 2.040s / 2.064s / 2.056s for Growth / Discounting / Developer Portal, with CLS below 0.001. Each used 390px, 4x CPU slowdown, 1.6Mbps, 150ms latency and reduced motion, with other browser reviews stopped. An earlier observation overlapped other browser reviews and is retained in `performance-initial.json`; it is not a valid controlled comparison. None of these values are production performance.

Safari, Firefox, actual mobile devices, screen readers, real browser zoom and recruiter response remain unverified. Monochrome research display can reduce differentiation in the source image; the unaltered original remains available. Historical originals retain legacy styling and numerical discrepancies. Work remains on the separate redesign branch and draft PR, without a merge or production publication.
