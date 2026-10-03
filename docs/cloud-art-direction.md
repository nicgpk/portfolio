# Animated halftone cloud revision

The [Browserbase reference](https://www.browserbase.com/) was reviewed live on 3 October 2026. Its hero combines looping landscape media, a poster and a canvas layer. That observation informed a more complete animated field and fading cursor treatment; no reference code, media, copy or brand assets were reused.

The portfolio uses an original WebGL screen across the entire hero. Cloud brightness changes dot size and density, with slow sampling drift and restrained tonal evolution. The cursor paints a soft trail that exposes a contrasting ink treatment and dissolves over 1.8 seconds. The source cloud image stays unchanged. A quiet center and a paper veil keep the copy readable; the heading and program labels remain stationary. The original logo, content, gallery and concepts are retained. There is no custom cursor or scroll interception.

`js/halftone.mjs` samples the local cloud texture and a small, 384px-wide brush mask. The latter replaces an expensive per-fragment loop through trail points. `js/clouds.mjs` caps draws at 24 per second and the canvas at 1440px wide / 1.25 device-pixel ratio. This is a cap, not a guaranteed frame rate. Ambient drawing runs only while the desktop hero is visible. Persistent pause, OS reduced motion, narrow or coarse-pointer views, hidden documents and offscreen art stop it. Forced colors removes the decoration.

The same shader generates responsive static posters. Touch, no-JavaScript, blocked WebGL, loading failures and context loss retain that complete visual. Context loss falls back permanently for that page load. Reduced motion uses the poster rather than an animated freeze. The artwork is hidden from assistive technology and adds no keyboard target. Reduced-transparency navigation remains opaque.

## Asset provenance

The source was created with the built-in image-generation tool on 3 October 2026, then converted to WebP with project-local Chromium. `images/hero-clouds-1600.webp` is 38,168 bytes and is requested only by the enhanced desktop renderer. The earlier 800px WebP remains historical source.

`scripts/build-cloud-poster.mjs` renders the same original shader, then writes indexed PNGs using Node's standard library: `images/hero-halftone-1600.png` (122,481 bytes) and `images/hero-halftone-800.png` (81,345 bytes). Regenerate with the preview running: `node scripts/build-cloud-poster.mjs`. No new generation or image-editing tool was used for this rendering pass. No runtime dependency or external image request was added. This is illustrative generated artwork, not a project artifact or photograph of real work. The earlier vector remains historical source and is not requested by the page.

Final generation prompt:

> Create an original monochrome cloud texture for the lower band of a high-end product design portfolio website. Wide panoramic landscape composition, approximately 3:1 aspect ratio. Quiet off-white sky in the top 30%, with large beautiful billowing cumulus clouds rising from the bottom edge and both sides, lower in the central middle. Black and white photography treatment, silver grey and soft charcoal tonal shadows, luminous white edges, misty atmospheric depth, fine restrained analog grain. Realistic cloud texture with gentle organic contours, no flat vector shapes, no color, no pixel blocks, no dots/halftone, no mountains, no ground, no sun, no stars, no text, no symbols, no borders, no logo. Bright editorial image, soft directional daylight, detailed midtones rather than heavy dark storm clouds. Horizontal cloud formations must feel spacious and airy. This is a decorative website background to be composited over an off-white surface.

## Review

The preceding CSS-screened cloud hero is preserved under `review/etch-revision/before/`. Current desktop/mobile screenshots, a cursor recording and results are under `review/etch-revision/`. Earlier smooth-cloud and pixel-landscape comparisons remain historical evidence.

`scripts/review-clouds.mjs` checks advancing ambient phase, actual pointer-to-brush texture uploads, a visible pixel change at a fixed phase, trail expiry, stationary text/labels, persistent pause, live reduced-motion changes, offscreen suspension, touch/no-JavaScript/blocked-WebGL fallback, context loss, forced colors and 320/390/768/1440 layouts. The six-route accessibility/interaction review and regular-wheel checks were also rerun. Browser/device and performance limitations in `review/final-review.md` still apply.
