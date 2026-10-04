# One Singapore red accent

The current homepage, Work gallery, all three cases and resume share one authored accent value in `css/folio.css`:

```css
--accent: #ed2939;
```

This is the site's screen interpretation of Singapore red. The National Heritage Board specifies Pantone 032 for the flag; it does not supply a universal web hex on its [National Flag page](https://www.nhb.gov.sg/what-we-do/our-work/community-engagement/education/resources/national-symbols/national-flag).

Historical signal, workspace, growth, discount, cobalt, coral, orange, orchid and lime accent variables are removed from current styles. Icons, hero emphasis, selected states, rules, focus rings and motion signatures now reference `--accent` directly. Warm tinted panels and cool tinted neutral surfaces are grayscale. Original archived artifacts and downloadable resume files are preserved.

Red is reserved for emphasis and state. Small reading text, percentage labels, calculation explanations, error messages and deployment action labels use neutral ink or white for contrast. Deployment actions retain a red border. No alternate red text or hover shade is authored. Forced-colors mode substitutes the system Highlight color for the same token.

## Verification

- Six routes at 320, 390, 768 and 1440 pixels pass automated WCAG A/AA checks.
- A computed palette audit finds only neutral colors or the exact shared red on current visible UI elements. A temporary token substitution proves every inspected red property follows the shared token.
- Three cases pass source text/link preservation and their existing interaction/state audit, including calculator validation and developer review.
- Reading links stay neutral; red hover rules and keyboard focus remain visible.
- Evidence icons preserve two bounded cycles, pause, offscreen suspension, reduced motion and no-JavaScript behavior.
- Resume text, links, downloads, keyboard access, responsive layout and separate print behavior pass existing checks.

Before/after captures at 390 and 1440 pixels are in `review/accent-system/`, based on `d3088b9`. Open `review/index.html` for comparisons. This is a local preview and draft branch update; no merge or production release.

Automated contrast and Chromium checks do not replace a manual assistive-technology review or a real-device/color-calibrated display review. Original screenshots within archived artifacts retain their historical colors.
