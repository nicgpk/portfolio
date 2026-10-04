# Centered introduction and direct transition to work

The introduction now sits at the vertical center of the halftone stage, with equal top and bottom space. A responsive minimum height and symmetric padding replace the separate landscape spacer; the stage can grow with wrapped text. Desktop stage height is 580px, down from 682px. The checked 320/390/768px layouts are 460px tall and retain complete text and controls.

The featured-work strip is removed from the authoring template. Selected work now follows the hero directly. Partner Growth Programs remains the first project, with its complete metrics, context, concept and case-study link. Other project routes and content are unchanged. The current cloud and three optional backgrounds retain their existing interaction and static fallbacks.

`review/hero-spacing/` holds desktop/mobile before-after hero captures and measured spacing. `review-personal-landing.mjs` checks vertical centering and removal of the strip/spacer at four widths alongside the existing gallery metrics/height checks. The background review covers all four compositions at four widths, automated WCAG checks and live cursor/fallback behavior. Source-preservation checks exclude the explicitly removed strip while retaining the other main text, destinations and shared Work cards.

Verified in project-local Chromium with emulated sizes. Actual devices, Safari/Firefox and screen readers remain unverified. Draft branch only; no production publication.
