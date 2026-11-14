---
name: Nicholas Gwee Portfolio
description: Existing dark portfolio with a two-tone product UI extension.
colors:
  page-canvas: "#0a0a0a"
  product-bg: "#101214"
  product-raised: "#1c2023"
  product-ink: "#eef0f2"
  product-muted: "#b9bec3"
  product-accent: "#d2d6d9"
  product-line: "#353b40"
  product-control-line: "#6f7981"
  topology-paper: "#101214"
  topology-ink: "#eef0f2"
  topology-muted: "#b9bec3"
  topology-accent: "#d2d6d9"
  topology-line: "#6f7981"
  topology-card: "#1c2023"
typography:
  display:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(2.5rem, 1.5rem + 2.5vw, 3.75rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  narrative-section:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "36px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  narrative-subsection:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  product-title:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  narrative-body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  input:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  product: "12px"
  control: "8px"
  badge: "6px"
components:
  button-primary:
    backgroundColor: "{colors.product-raised}"
    textColor: "{colors.product-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.product-bg}"
    textColor: "{colors.product-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "44px"
  input:
    backgroundColor: "{colors.product-bg}"
    textColor: "{colors.product-ink}"
    typography: "{typography.input}"
    rounded: "{rounded.control}"
    height: "44px"
  panel:
    backgroundColor: "{colors.product-raised}"
    textColor: "{colors.product-ink}"
    rounded: "{rounded.product}"
  badge:
    backgroundColor: "{colors.product-bg}"
    textColor: "{colors.product-muted}"
    rounded: "{rounded.badge}"
---

# Design System: Nicholas Gwee Portfolio

## Overview

This records the approved two-tone extension of the existing portfolio. Charcoal component chrome frames lighter graphite work areas. IBM Plex typography, the dark page canvas, the desaturated wave and its existing motion remain in place.

The implementation is authoritative: [shared product tokens](css/product-surfaces.css), [final shared color rules](css/two-tone.css), and the [Growth](css/case-growth.css), [Discounting](css/case-discount.css) and [Developer Portal](css/case-developer.css) styles apply the system to actual interfaces.

Reusable values live in [design-tokens.css](css/design-tokens.css), loaded first in both base bundles. The `ds-*` namespace supplies the palette, shared component roles, spacing and typography scales, corners, control sizes, borders, motion, and static surface effects. Its compatibility values preserve existing visual variants; they do not introduce a new palette. The existing `tone-*` and `glass-*` roles alias these values in [glass.css](css/glass.css), and product color and corner roles alias them in [product-surfaces.css](css/product-surfaces.css). Shared product components live there; page styles own layout and the final two-tone rules own component-specific surface treatments. Keep page ID selectors out of shared component styling so they cannot override selection, focus, or validation states.

Use semantic roles such as `ds-panel-padding`, `ds-control-height`, `ds-product-body-size`, and the existing product color roles when their intent matches the component. Use shared scales for other repeated values. Keep intrinsic geometry, structural percentages, and media-query conditions local. Central token definitions and the existing generated Vesper theme tokens are the only color-literal sources on the main routes; `npm run check:tokens` enforces that boundary and validates token references.

## Colors

Use `product-bg` for component frames, headers and sidebars; `product-raised` for workspaces, panels and selected regions. Alternate these by function. A lighter workspace may contain charcoal cards or controls; a charcoal frame may contain a graphite result panel.

Use `product-ink` for primary content and `product-muted` for supporting text. The neutral `product-accent` is foreground emphasis, selected-state borders and focus; it does not introduce a third large filled surface. Primary actions use a panel or foundation fill, ink text and a stronger border. `product-line` separates regions; `product-control-line` identifies fields and controls. Preserve labeled success, warning and error colors where they convey status.

The page canvas remains `page-canvas`, defined in [glass.css](css/glass.css). Component foundation colors do not replace it. Main text has at least 14.36:1 contrast across the two component tones; muted text has at least 8.76:1. Control outlines have at least 3.69:1.

## Typography

IBM Plex Sans provides the shared portfolio reading hierarchy. The `ds-portfolio-*` tokens define display, section, project, subsection, lead, body, metadata and caption sizes. Responsive `portfolio-*` aliases in [glass.css](css/glass.css) map the heading roles to their compact values below 768px. These semantic sizes use rem units and the screen root respects the browser's default font size. The résumé's print styles remain separate.

At the default browser font size, display headings range from 40–60px on desktop and 32–40px on compact screens. Section headings use 36/28px, project titles 32/28px, and narrative subheadings 22/20px. Display, section and subsection leading is 1.1, 1.25 and 1.35 respectively. Lead copy stays 18px/1.6; body copy is 16px/1.75; metadata is 14px/1.5; figure captions are 13px/1.6. Navigation stays 14px while scrolling. Reading links use 16px with unitless leading. Career dates and résumé metadata use the body face; monospaced type is reserved for technical content.

Product interfaces keep a distinct compact scale: 15px body, 14px action labels, 12px captions, 18px toolbar titles and 16px editable fields. Small chart ticks and calendar values retain their local scale. Compact Growth navigation wraps to preserve readable labels. Headings, spacing and density follow [case-refined.css](css/case-refined.css) and each existing product surface.

Case-study narrative section headings use 36px desktop and 28px compact; narrative subheadings use 22px and 20px. These rules exclude embedded product UI. Below 480px, homepage metric values use `clamp(18px, 5.5vw, 24px)` to fit narrow cards, as implemented in [work-index.css](css/work-index.css).

## Layout

The homepage, case studies and screen resume use an 860px maximum content frame, with 24px page gutters on desktop and 16px on compact screens. The portfolio-content-width token aligns heroes, body content, desktop navigation and footers. On scroll, the desktop homepage navigation insets 16px from each of its original edges (828px at the full content width), using its existing width transition. Project cards stack their summary, results and full-width interactive demo. Demo stages use their content height. Process uses two columns on desktop and one on compact screens. The shared compact breakpoint is 767px; individual product layouts have their own existing breakpoints.

Use 80px desktop and 48px compact spacing between major narrative sections. Give each gap one owner: trim trailing paragraph, figure and nested section margins where section padding already supplies the space. The homepage Work and film sections leave the following section or footer to supply that gap. Footers use 80/48px top padding without an additional top margin. Results strips use their top margin without extra block padding. Keep 24px between related content blocks and 48/32px between the homepage About groups.

Product panels use 24px desktop gutters, 20px compact gutters and 16px on the narrowest screens. Align panel headings, forms, lists and table content; avoid stacked padded frames. Existing dense tables, calendars and topology diagrams retain their local spacing where required. Case-study story copy fills its containing section or grid column without a separate character-based width limit. Case studies have text-only, left-aligned heroes. They have no hero screenshots or chapter bars. Full narrative and product examples remain in the reading flow. Document scroll padding supplies the 112px fixed-header clearance; case-study anchors and form controls do not add a second offset.

The screen resume uses 48/32px between sections and 32/24px between jobs or education entries, split around their dividers. It shares the page frame and stacks its sidebar below 768px. Its screen section grid keeps a consistent label rail that grows with enlarged reading text; role and date rows wrap when they need room. The separate ATS resume has 24/16px browser gutters. Both print layouts remain independent of these screen spacing rules.

Contact copy and footer utility links share one 48px desktop / 32px compact gap, owned by the utility row's top margin. The invitation adds no trailing padding.

## Elevation & Depth

Product demos group content through exactly two surface backgrounds, spacing and typography. Homepage demos use subtle product-line outlines around their frames, program tiles and detail panels, with dividers under headers and between descriptive data rows. Selected programs use an accent outline, filled surface and checkmark; hover strengthens the static 1px outline, with no fill change, press scaling or border-sweep animation. Receipt rows retain dashed separators; deployment steps, sidebar and configuration rows use quiet dividers, and action buttons retain visible control outlines. Case-study examples continue to group most nested regions through tone and spacing. Active steps keep an accent underline. Retain strokes for inputs, data-table rows, topology nodes and focus/error states. Bright outer gradient frames are removed from homepage demos and case-study examples. Keep the portfolio’s existing glass treatments and background atmosphere. The [wave implementation](js/paper-wave.mjs) retains its motion, rendering limits, visibility pausing and reduced-motion behavior; the color extension adds no animation.

The wave reuses time-independent grain in a full-precision GPU cache, rebuilding it after size, pixel-ratio or composition changes. This preserves the existing resolution, grain, palette, blur and animation speed. Devices without floating-point render targets keep the original renderer.

Motion follows the restrained duration and easing principles in [NN/g animation guidance](https://www.nngroup.com/articles/animation-duration/) and [IBM Carbon](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview). The viewport offsets and group choreography are specific to this portfolio.

## Shapes

All product demos use one corner scale: 12px for frames, workspace panels, cards, metric strips and table containers; 8px for controls and interactive rows; 6px for badges. The shared product-radius-panel, product-radius-control and product-radius-badge tokens in product-surfaces.css define this scale. Circular avatars, status dots, ports and step markers retain their circular shape. Table containers keep horizontal scrolling on narrow screens.

## Components

- **Project navigation:** the homepage uses the same pinned project stack on phones, tablets and desktop. Native document scrolling exposes every full card before advancing; the previous/next controls and position count follow the active project. Compact layouts keep their full typography and responsive demos, use an 88px mobile header offset (104px on larger screens), and shorten the opening hold. Touch positions track native scrolling directly; mouse wheels retain smoothing. A stable small-viewport cap prevents mobile browser toolbar changes from changing the scroll runway. Viewports shorter than 400px and reduced motion retain the natural reading flow. Hidden project previews wait until their project is active.
- **Interaction detail:** project titles underline on hover or keyboard focus, case-study arrows move toward their destination, and program selection draws its checkmark once. These effects use the existing neutral tokens and have a static reduced-motion alternative.

- **Editorial reveals:** homepage leadership copy, Experience, How I Work, film and contact content use the same viewport inset and fixed dwell as the demos. Timeline markers arrive before each role's text settles 14px sideways. Principle cards keep their shells still while a brief top-edge trace leads the title and description; adjacent cards stagger by 70ms within their visual row, with no accumulated delay on mobile. Tool badges have their own reveal point. Copy lifts 10-18px, and the film reel opens with a shallow crop reveal that leaves its scrolling intact. Each group enters once per visit, direct jumps keep readable content, focus settles the target, and reduced motion or printing clears effects. Footer utility links stay static. See [section-reveals.mjs](js/section-reveals.mjs).

- **Demo motion:** all 21 product surfaces use finite, local feedback. Content groups prepare a readable starting pose just outside the viewport, then reveal after entering a reading area inset 96-180px from the bottom edge, with a fixed 100ms dwell. Scrolling does not postpone the trigger. Tall examples reveal fields, cards, charts and table sections independently; direct jumps retain readable content without a backwards fade. Shells stay fixed while content settles upward by 10px over 420-520ms, with local 60ms stagger. Live walkthroughs keep a short reading beat between meaningful state changes and relinquish autoplay on input. There are no caption or playback footers, continuous reveal loops, permanent compositor hints or new animation dependencies. Reduced motion and hidden tabs settle the interface. See [demo-reveal.mjs](js/demo-reveal.mjs), [demo-scenes.mjs](js/demo-scenes.mjs) and [demo-controls.mjs](js/demo-controls.mjs).

- **Demo controls:** growth examples support discount depth, audiences, blackout dates, weekdays, reasons and local confirmation feedback. Calendar months use one tab stop with arrow-key navigation. Developer examples offer expandable guidance, component-name filtering and rollout selection; the editable walkthrough remains the source of deployment configuration. Status messages explicitly describe local examples, with no live enrollment, deployment or persistence.

- **Compact controls:** below 360px, homepage program choices become full-width horizontal rows so labels remain readable. Growth FAQ and reason rows and Developer specimen actions use the shared 44px minimum target and 14px label role. Enhanced specimen actions say “Try walkthrough” to identify their destination.

- **Headers and sidebars:** charcoal foundations with readable muted navigation; selected items use graphite and/or the accent.
- **Cards and workspaces:** use the contrasting tone to distinguish content from its surrounding region. Keep one main content gutter and smaller inner-panel padding; omit extra outer frames.
- **Primary actions:** foundation or panel fill, ink text and a stronger neutral border. Hover switches between the same two fills; focus uses the accent outline. Secondary actions use the foundation with the control outline.
- **Inputs:** contrast with their containing region, use the control outline and show a visible accent focus ring (2px, offset 3px). Preserve validation styling and labels.
- **Keyboard navigation:** portfolio and résumé links use the neutral accent focus ring (3px, offset 4px); product controls use the input focus scale above. Skip links target a programmatically focusable main landmark without adding it to the normal tab order.
- **Tables and receipts:** distinguish headers, work areas and result panels through tonal regions; retain tabular numerals and all source values.
- **Badges:** compact supporting labels, with accent emphasis reserved for meaningful selected or recommended states.
- **Case-study navigation:** name the destination project in the next-case link; stack it with the all-work link on compact screens.
- **Working principles:** present a non-sequential list without numbered steps.
- **Homepage orientation:** the hero includes a direct link to selected work. Reduced-motion employer logos use a static grid, with three columns on desktop and two on compact screens, so every employer stays visible.
- **Film reel:** visible previous/next controls and a pause/resume action accompany the enhanced reel. Pointer and keyboard engagement suspend autoplay; manual navigation keeps it paused. Reduced motion uses a finite shelf with disabled controls at its ends.
- **Scrollable comparisons:** narrative table regions have accessible names, keyboard focus and the shared focus outline, keeping all columns reachable on compact screens.

### Deployment topology: local high-tech treatment

The homepage deployment graph uses the shared charcoal/graphite palette with a dot grid and silver routing. Its scoped `topology-*` properties alias the existing product tokens: paper maps to product-bg, ink to product-ink, muted to product-muted, accent to product-accent, line to product-control-line, and card to product-raised. The grid, frame and source inset rim use product-line. This high-tech treatment is confined to the graph; it does not change the portfolio's overall visual system.

Use a borderless 12px canvas and 12px nodes. The source is 144 × 128px; regional nodes are capped at 260px wide and 64px tall, centered as a group with 16px gaps. At canvas widths of 360px or less, use a 112px source height and 80px regional rows with 12px gaps. Preserve the left image source, three stacked regional nodes, measured cubic connectors, circular ports and ten-cell replica indicators. Nodes use graphite fill with a single outline: a quiet divider tone for inactive regions and the accent for active nodes. Active connectors have a restrained silver glow. Keep the 32px gap before the detail panel. Titles remain IBM Plex Sans at 14px/600, metadata at 12px, and the image hash uses the existing mono family at 16px/600. Hide replica indicators at canvas widths of 480px or less; at 360px or less, shrink the source and use 12px region labels and hash. Compact viewport padding is 16px vertically and 12px horizontally below 480px.

Node imagery matches the existing navigation's silver 3D objects on warm peach plinths: [container](images/icon-dev-container-3d.png) and [server](images/icon-dev-server-3d.png), both transparent 256px PNGs. The source icon displays at 40px and regional icons at 32px. At canvas widths of 360px or less, they remain visible at 32px and 24px respectively, with the regional icon stacked above its label and metadata. Generation references and prompt provenance are recorded in [deployment-node-icons.provenance.json](images/deployment-node-icons.provenance.json) and the PNG metadata.

Inactive routing uses the control-line tone; rollout and review use the silver accent for paths and active region borders, ports and indicators. State transitions use 420ms ease-out. Rollout alone adds one 1800ms dashed routing animation, with no looping; reduced motion and the existing motion-off setting suppress animation and transitions. The authoritative implementation is [work-index.css](css/work-index.css), with measured connectors in [deployment-topology.mjs](js/deployment-topology.mjs). Keep the graph's grid and routing glow scoped to this component.

## Do's and Don'ts

- **Do** preserve the functional distinction between charcoal chrome and graphite work regions.
- **Do** reuse the shared tokens and keep contrast, focus, labeled status colors and reduced-motion behavior intact.
- **Do** preserve the existing typography, wave, responsive layouts and complete case-study content.
- **Don't** paint every nested surface the same tone or add a third product-region fill.
- **Don't** use the neutral accent as a large filled surface or restore bright outer gradient frames.
- **Don't** restore case-study hero screenshots or chapter bars.
- **Don't** introduce a new visual identity or additional decorative color families as part of this extension.
