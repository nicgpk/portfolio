# Work page shares the landing-page gallery

`projects.html` now uses `project_showcase(work_page=True)` from the same generator as the homepage. Cards, project order, roles, descriptions, neutral metric panels, complete source-context disclosures and standardized concept previews are identical. Both routes load the shared concept stylesheet and the growth/discount preview dependencies.

Work has one page-level Selected work heading, retains its introduction and active navigation state, and omits the gallery's redundant All work self-link. The GovTech archive is unchanged. Three direct original-case links remain below the gallery. The footer uses the same monochrome landscape treatment as the homepage.

The gallery retains equal heights, a hidden scrollbar, arrows, keyboard controls, scoped mouse-wheel paging, touch/native horizontal scrolling and no-JavaScript access. It has no vertical runway or expanding scroll container. No case-study routes, metrics, calculation rules, claims, resume or contact destinations change. The old index-specific graphics are superseded; their earlier captures remain in the review history.

`scripts/review-work-page.mjs` verifies exact shared card/archive markup, equal card heights, concept surfaces, overflow, active navigation, arrows, Home/End keys, fixed-page wheel scrolling and a mobile no-JavaScript gallery. Automated WCAG checks cover 320/390/768/1440px. `review/work-page/` contains opening and gallery before-after screenshots; the baseline is 2229a20. Existing route and concept audits cover content, original destinations and interactive case workflows. The obsolete index-graphics review is replaced in the review command by this current gallery review.

Verification uses project-local Chromium with emulated widths. Actual devices, Safari, Firefox and screen readers remain unverified. Work stays on the redesign branch and draft PR; production is unchanged.
