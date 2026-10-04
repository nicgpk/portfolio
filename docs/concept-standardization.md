# A shared concept interface system

The three concepts previously shared colors but used different composition rules: Growth had a large editorial heading and boxed detail panel, Discounting had app chrome, and Developer Portal had a compact toolbar and rollout tracker. They now share explicit interface primitives in `css/concept-system.css`, loaded only by the homepage and three case routes.

## Visual contract

- Palette: workspace #1c1c1c, raised surface #242424, divider #414141, text #f5f5f5, secondary text #bdbdbd, and the existing orange accent family. Evidence stays neutral gray. No new accent color is introduced.
- Type: Manrope for interface titles and explanatory copy; Ubuntu Mono for field labels, values and utility text. All preview titles share a 28px desktop / 24px mobile scale. Full concepts share an 18px header title and 12px utility labels.
- Geometry: 24px desktop / 18px mobile interior spacing, 12px shell radius, 6px field radius and 44px visible field frames. Full headers share padding and borders. Search text clears its icon; monetary prefixes stay outside editable numbers.
- Home previews: unbranded heading, a two-pane body separated by a fine rule, and a source/context footer. Desktop frames and footer notes align. Narrow previews stack the two panes. Previews are decorative; interactive controls remain in the full concepts.
- States: neutral selected/expanded surfaces, orange state indicators, shared visible focus rings and unchanged native error guidance. Growth disclosures/filtering, calculator eligibility/rounding and developer validation/review keep their existing behavior.

Layout still follows the task: discovery uses a catalog; discounting uses an ordered ledger; deployment uses its existing Environment / Rollout / Review progression. Adding those steps to the other concepts would invent a workflow. Growth and Developer Portal retain their existing contextual sidebars on wide screens. Brand marks are visually omitted from the concept headers; the portfolio's original `>` logo is unchanged.

## Source and verification

`review/concept-system/checks.json` checks four widths, matching preview/header/field primitives, aligned desktop frames and footer notes, mobile search spacing, and exact existing main text/link destinations across six routes against c53f0e8 after excluding decorative home previews. Full case text and links are also preserved by the existing monochrome audit. Original program descriptions/mechanics, developer settings, metrics and source limitations are unchanged. The calculator still yields $114.75 for $150 × 0.85 × 0.90 before commission and taxes.

Current desktop/mobile captures of every preview and full concept are in `review/concept-system/after/`; `before/` captures c53f0e8. The review page presents these comparisons before historical refinements. Responsive and accessibility checks use project-local Chromium. Safari, Firefox, actual devices and screen-reader sessions remain unverified. Equal-height cards leave extra space on shorter mobile previews; full concepts have their own content-driven height. Work remains on the redesign branch and draft PR without merging or publishing production.
