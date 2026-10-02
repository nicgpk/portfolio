# Review verification

Source baseline: `9cd719f1b2480bcd48ac3b6317a285079d3e5050`. Branch: `codex/portfolio-hiring-redesign`.

- `npm run check:html`: passed on all root HTML pages, including the redirect and verification page.
- `node scripts/verify.cjs`: passed; 24 page/theme/viewport combinations, zero axe WCAG 2 A/AA, 2.1 AA, 2.2 AA violations, zero horizontal overflow, broken images, missing anchors, local resource failures, or page JavaScript errors.
- Additional functional checks: no-JavaScript home-to-project navigation; first keyboard focus on skip link; theme state change; pattern dialog open and Escape close.
- `node --check js/teletype.js` and `node --check js/theme.js`: passed.
- `git diff --check`: passed.
- Impeccable detector on `css/hiring.css`: `[]` (no findings).
- Independent design review: the initial listed findings were addressed, then parent review identified further defects. Follow-up fixes cover dark logo contrast, full-size artifact links, consistent illustrative receipt totals, and mobile deployment header wrapping. Broader visual rhythm, duplicate Partner imagery, optional deep evidence, and complete keyboard/dialog focus auditing remain open. This is a reviewable draft, not a whole-site accessibility certification.

Final Lighthouse mobile lab run on local Chrome: Performance **92**, Accessibility **100**, Best Practices **100**, SEO **100**. LCP **3.2 seconds**, CLS **0**, total blocking time **0 ms**. LCP remains above the 2.5-second target on simulated mobile throttling. These are local lab measurements, not production field data. Reports: `lighthouse-final.report.html` and `.json`.

Screenshots in `final/` cover every primary route at 390px and 1440px in light theme, plus the home at 390px in dark theme. Browser checks additionally cover both themes on every route. Images were settled before capture and inspected.

Existing case-study measurements have no independently supplied raw study dataset. The resume's eight lifecycle patterns conflicts with the seven in the Partner case; preserved resume requires owner confirmation. New project summaries avoid unsupported or conflicting activation-lift / complaint-ranking claims. All displayed project previews use existing artifacts. Product reconstructions are labelled and retain illustrative values.

No main merge or production publication performed.


Follow-up: normal-motion home visibly rendered, three flagship projects present, dark logo foreground/background distinct, three mobile wizard headers geometrically non-overlapping and visually inspected. Receipt arithmetic checked with scripts/check-receipt.cjs. Browser blank view not reproduced; HTTP200, visible hero/projects, zero local failed assets and page errors confirmed on the live loopback server. Latest Lighthouse predates these follow-up fixes; scores have not been remeasured.
