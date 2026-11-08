# Nicholas Gwee — Product Design Portfolio

Static HTML, CSS and JavaScript portfolio. Pages and styles remain editable source. Generated CSS bundles are checked in, so serving the repository needs no runtime build or external dependencies.

## Preview and test

Serve this directory with a static HTTP server (for example `python3 -m http.server 4183`) and open http://localhost:4183. Use Node 22 or newer to run `npm test`; the tests have no external dependencies.

After changing source CSS or the shared navigation/background entry modules, run `npm run build:css`. It preserves stylesheet order, refreshes the checked-in `css/bundle-*.css` files, and updates shared asset URLs consistently across the main pages. Edit the original CSS files rather than generated bundles. Run `npm run check:css` to check freshness without writing files; this check also runs with `npm test`.

The homepage contains the identity hero and animated employer logos, the full Work index with three interactive case studies, experience, work process, and the GovTech archive. `projects.html` redirects to the homepage for existing bookmarks. The other main pages are Partner Growth Programs, Discounting 2.0, Developer Portal and Resume. `originals/` preserves linked historical project material. The downloadable PDF and ATS HTML live in `files/`.

The homepage uses the original animated wave palette at 30% saturation with a matching static fallback, skips staggered content entrances, and loads the demo and background enhancement modules. Content remains visible if JavaScript fails. Case-study pages retain their existing effects.

## Interaction and rendering

Concept demonstrations use illustrative data and do not enroll properties or deploy infrastructure. The receipt applies three discounts sequentially with cent rounding. Required Developer Portal text fields are trimmed and validated. Motion respects reduced-motion preferences and offscreen/tab visibility.

Paper Shaders 0.0.81 is vendored under `js/vendor/paper/` with its Apache-2.0 LICENSE and NOTICE. WebGL2 backgrounds have static CSS fallbacks. Font and icon licenses are retained alongside their assets. The hotel concept image and chrome program icons are generated illustrations.

## Snapshot and verification

This export matches portfolio Site version 35, source `e9137437fe37d683f268ae5ddf07a3f9d330968a`. Included runtime files are copied byte-for-byte. Three unused logo files that were actually downloaded HTML error pages are excluded, including one with request diagnostics; test paths are adapted to this repository's root-level static layout. Private hosting configuration and internal review material are not needed to run this site and are excluded.

The 33 focused tests cover selection timing, interruption/repetition, reveal state, required-text normalization, responsive shader parameters and pixel budgets. Desktop browser checks covered the 2+1 showcase layout, asset loading, receipt interactions, background fallbacks and the resume. Physical iPhone rendering and actual WebGL animation were not verified in the cloud browser. These tests are not full device or accessibility certification.

This review branch does not change the production branch or publish GitHub Pages. Review and explicit deployment approval are separate steps.
