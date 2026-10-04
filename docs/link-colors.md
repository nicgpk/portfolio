# Neutral reading links

The former #b93608 small-text token looked like a separate brown accent beside #ff510a. It now resolves to the current section's ink color. Reading links and editorial labels are monochrome across the homepage, project index, three case studies and resume. Dark concept state colors remain unchanged.

Existing text-link borders stay visible. Homepage case links and the flagship footnote now have persistent underlines. Hover uses the established orange for underline/border cues while text stays neutral; keyboard focus retains its contrasting outline. The footer email keeps an orange decorative arrow and hover rule with neutral text. This avoids low-contrast bright-orange small text on white.

`scripts/review-link-colors.mjs` checks neutral reading-link colors across six routes at 390/1440px, plus the Discounting hero link's hover border and visible focus. Desktop/mobile before-after opening and body-link captures are in `review/link-colors/`. The wider route review checks automated contrast/accessibility, overflow and destinations; the monochrome case review checks preserved text/links and rendered palettes in twelve layouts and interaction states.

Review uses project-local Chromium. Actual devices, Safari, Firefox and screen-reader sessions remain unverified. No routes, metrics, original artifacts or destinations change.
