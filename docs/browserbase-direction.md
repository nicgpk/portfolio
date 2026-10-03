# Browserbase-inspired portfolio direction

Reference reviewed on 3 October 2026: https://www.browserbase.com/.

The reference uses orange headline bands, a white page with fine structural rules, pale blue product surfaces, pixelated landscape illustrations, compact navigation and concise product demonstrations. This portfolio translates that language into an original presentation of Nicholas Gwee's work. Browserbase's brand, copy, assets and business claims are not used.

## Design decisions

- Color: white `#ffffff`, ink `#151918`, signal orange `#ff510a`, accessible orange text `#b93608`, sky `#e4eff7`, action blue `#174cde`. Smaller orange text uses the darker token.
- Type: locally hosted IBM Plex Sans for expressive headings and readable product UI; IBM Plex Mono for context and calculations. The original monospace `>` logo is retained.
- Layout: one framed flagship opening, then horizontal project compositions with concise ownership on the left and an interface demonstration on the right. Leadership, experience, earlier projects and contact follow in ordinary vertical flow. Cases share the same rules and colored evidence panels.
- Signature: an original vector pixel landscape and stepped signal path connect three featured program names. This is brand illustration, not a chart or measured outcome. `scripts/build-landscape.py` generates `images/program-landscape.svg` deterministically with Python's standard library.
- Growth: a property workspace with search and categories, eight real programs and native expandable mechanics. The work preview shows three programs; the hero illustration provides a distinct treatment.
- Discounting: a larger final rate, ordered deductions, explicit exclusions and proportional remaining-rate bars. The calculation helper and original controls are retained.
- Developer Portal: the existing workflow, example settings and dark product screen, with the shared site presentation updated around it.

## Interaction decisions

The mouse-wheel failure reproduced as horizontal position 0 before and after a vertical wheel event, while the document moved from 237px to 397px. The earlier implementation accepted native horizontal input only.

With a desktop fine pointer at 900px or wider, unmodified vertical wheel input over the gallery advances one project per bounded wheel burst. At either end it releases to ordinary page scrolling. Horizontal trackpad input, modified gestures, zoom, touch and wheel input elsewhere remain native. Previous/next and focused-gallery ArrowLeft/Right/Home/End remain available. Keyboard changes reveal the selected title below navigation. The scrollbar stays hidden.

The signal-path animation runs for ten seconds; discount bars reveal once on entry. Text is present immediately. Persistent pause, OS reduced motion, opaque reduced-transparency navigation, no-JavaScript content and forced-colors fallback remain. No runtime package was added.

## Content and review boundaries

All cases retain their problem, role, decisions, metrics and contextual caveats. Portfolio revenue remains business scale, not a causal result of the later hub launch. Updated concepts are labeled and link to original artifacts. The resume body, downloads and contact destinations are preserved.

Before this pass: `review/browserbase-revision/before/`. Current opening and covers: `review/browserbase-revision/after/`; full routes and concepts: `review/after/`. Windows Chromium with emulated mobile views does not establish Safari, Firefox, real-device or screen-reader behavior. Local performance is not production measurement.
