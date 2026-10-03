# Monochrome cloud revision

The hero retains a halftone treatment using monochrome clouds. A CSS dot mask screens the cloud tones, and a finer dot pattern textures the sky. The generated source image stays unchanged. The orange heading, stationary project labels, original logo, content, gallery and concepts are retained. Clouds drift up to 28px horizontally and 12px vertically against desktop cursor movement, with a faint localized light response. Pointer exit returns to neutral. The response uses transforms and opacity, with no custom cursor or scroll interception.

Motion is event driven and stops when settled. Pause, OS reduced motion, coarse pointers, hidden documents and offscreen art disable/reset it. Touch and no-JavaScript views retain the static image. Forced colors removes the decorative layer. The image is hidden from assistive technology and adds no keyboard target.

## Asset provenance

Created with the built-in image-generation tool on 3 October 2026. Final project assets: `images/hero-clouds-1600.webp` (38,168 bytes) and `images/hero-clouds-800.webp` (14,058 bytes). The source PNG was converted to responsive WebP with project-local Chromium. No additional dependency or external image request. This is illustrative, generated artwork, not a project artifact or photograph of real work. The earlier vector remains as historical source but is no longer requested by the page.

Final generation prompt:

> Create an original monochrome cloud texture for the lower band of a high-end product design portfolio website. Wide panoramic landscape composition, approximately 3:1 aspect ratio. Quiet off-white sky in the top 30%, with large beautiful billowing cumulus clouds rising from the bottom edge and both sides, lower in the central middle. Black and white photography treatment, silver grey and soft charcoal tonal shadows, luminous white edges, misty atmospheric depth, fine restrained analog grain. Realistic cloud texture with gentle organic contours, no flat vector shapes, no color, no pixel blocks, no dots/halftone, no mountains, no ground, no sun, no stars, no text, no symbols, no borders, no logo. Bright editorial image, soft directional daylight, detailed midtones rather than heavy dark storm clouds. Horizontal cloud formations must feel spacious and airy. This is a decorative website background to be composited over an off-white surface.

## Review

Halftone follow-up: desktop/mobile screenshots and the existing cloud interaction suite were refreshed after restoring the texture. The preceding smooth-cloud opening is preserved under `review/halftone-revision/before/`.

`scripts/review-clouds.mjs` checks actual pointer response, stationary text/labels, idle frame settling, return to neutral, persistent pause, live reduced-motion changes, touch/no-JavaScript fallback, forced colors and 320/390/768/1440 layouts. Before/after images, interaction recording and results are under `review/cloud-revision/`. The six-route accessibility/interaction review and regular-wheel checks were also rerun. Browser/device limitations in `review/final-review.md` still apply.
