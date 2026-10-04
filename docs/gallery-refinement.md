# Compact project descriptions and a native scroll gallery

## Request and result

The home evidence panels previously spanned the bottom of each card. All three now live in the left project description, beside ownership and the case-study link. The primary figures remain visible in one pale orange panel; a native disclosure holds the original measurement context and supporting evidence. Full case-study evidence remains unchanged and open by default. The Growth preview removes its logo, app header, progress steps and footer. A quieter catalog pairs three existing program entries with the existing Promotions description and discount types. This is a decorative updated concept, not a new shipped feature.

## Scroll behavior

The reproduced failure was a regular wheel gesture in the page margin: the old listener existed only on the gallery track, so the page could pass the entire selected-work section without advancing projects. On wide fine-pointer screens, native page position now drives a short horizontal scene while the gallery stage stays below the navigation. No wheel event is canceled in this mode. Normal scrolling releases beyond either end. Horizontal gestures also synchronize the page scene; arrows and focused-gallery Left/Right/Home/End select a complete card.

The scene runs only at 1100px or wider, with a fine pointer, motion enabled and enough height for every collapsed card below navigation. Touch, narrow or short screens, pause and reduced motion use the native horizontal gallery with buttons and keyboard alternatives. Existing scoped wheel paging remains available on desktop fallback layouts. Opening source context that exceeds the available height returns the gallery to ordinary page flow. Closing it restores the scene when it fits. Responsive changes preserve the selected project without pulling visitors away from the hero or footer. The scrollbar remains hidden.

Continuous native scroll can rest between projects; it does not force a snap after every wheel tick. Buttons and keyboard controls provide precise alignment. On mobile the compact evidence still adds vertical reading. This tradeoff keeps the original figures available without clipping them.

## Source and accessibility

The visible metric inventory is preserved: Growth $521M+, 12%, eight programs, four tenets and seven lifecycle patterns; Discounting 10–12%, −3%, #1 and 1.5 years; Developer Portal 6m 8s, 68.8 and 4.4/5. Supporting program estimates, research scope and the original SUS breakdown remain accessible in disclosures. The $521M+ figure is 2025 program portfolio revenue predating the later hub launch. Source limitations and the discount complaint-ranking conflict remain disclosed. No figures are invented, summed or attributed to the redesign.

The description and evidence are siblings rather than a nested disclosure inside a project link. Decorative previews have no focusable fake controls. Keyboard access, natural touch scrolling, no-JavaScript overflow, pause, reduced motion, reduced transparency and forced colors remain. Original artifacts, routes, resume and contact links are preserved.

## Evidence and limits

Before images in `review/gallery-refinement/before/` come from fe9ece0. Current desktop/mobile component captures are in `after/`. `scroll-checks.json` covers margin wheel input, rapid keyboard navigation, responsive selection, resizing outside the gallery, expanded source context, live preferences and short-screen fallback. The complete review also checks six routes, six gallery viewports, no JavaScript, calculations, original artifacts and the hero renderer.

Review uses project-local Chromium on Windows and emulated device sizes. Safari, Firefox, real touch devices and screen-reader sessions remain unverified. Lab performance is not production performance. No runtime dependency, global installation, production publication or merge is included.
