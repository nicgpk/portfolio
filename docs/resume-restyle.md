# Resume in the portfolio system

The screen resume now uses the same white/charcoal palette, single orange accent, Manrope reading type and Ubuntu Mono metadata as the portfolio. A larger identity header and 48px PDF action lead into ruled sections. Desktop section labels occupy a narrow left column; role/company/location hierarchy and dates make the experience scannable. Narrow layouts stack these elements in ordinary document flow, with name and role preceding the download action visually.

`css/resume-portfolio.css` applies the screen styling after the existing resume and shared portfolio styles. The legacy print rules remain separate; print explicitly hides site navigation, the return-to-projects section and other screen chrome. The obsolete teletype script is removed from this page, so its cursor layer and legacy button enhancement do not run. The resume requires no JavaScript or added dependency.

All existing resume content is preserved: summary, five roles, 19 achievement bullets, education, certification, skills and contact details. The source's metric wording and figures are unchanged by this styling pass. The downloadable `files/NicholasGwee_Resume.pdf` and ATS artifact are unchanged. Browser printing is a separate document and does not replace that download.

`scripts/review-resume-style.mjs` checks 320/390/768/1440px layouts, automated WCAG rules, neutral reading links, the 48px download button, keyboard skip access, no-JavaScript reading and print visibility. It compares the resume body and every link/download destination against `f8ba6b7`. `review/resume-style/` contains desktop/mobile before-after captures, print-layout capture and a browser print PDF. `scripts/capture-resume-before.mjs` uses the committed baseline for repeatable before captures.

Real devices, screen-reader sessions, printer output and PDF accessibility are unverified. The existing downloadable PDF retains its prior design and content.

## Contact layout refinement

The screen contact block now uses a full-width location row, an aligned email/phone row on desktop and grouped profile links below. At narrower widths it returns to a consistent left-aligned stack. The empty two-column gaps are removed, with 48px contact link targets retained. Resume text, destinations, ATS hooks, original downloads and print styling are unchanged.

`review/resume-contact/` holds before/after captures and geometry checks at 320, 390, 768, 1072, 1440 and 1600px. The existing resume review also passes automated accessibility, exact source/link preservation, keyboard skip, no-JavaScript and browser print checks. Actual-device and manual screen-reader/real-printer reviews remain unverified.
