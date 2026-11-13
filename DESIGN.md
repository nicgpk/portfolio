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
    fontSize: "clamp(40px, 4.4vw, 60px)"
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
    typography: "{typography.body}"
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

## Colors

Use `product-bg` for component frames, headers and sidebars; `product-raised` for workspaces, panels and selected regions. Alternate these by function. A lighter workspace may contain charcoal cards or controls; a charcoal frame may contain a graphite result panel.

Use `product-ink` for primary content and `product-muted` for supporting text. The neutral `product-accent` is foreground emphasis, selected-state borders and focus; it does not introduce a third large filled surface. Primary actions use a panel or foundation fill, ink text and a stronger border. `product-line` separates regions; `product-control-line` identifies fields and controls. Preserve labeled success, warning and error colors where they convey status.

The page canvas remains `page-canvas`, defined in [glass.css](css/glass.css). Component foundation colors do not replace it. Main text has at least 14.36:1 contrast across the two component tones; muted text has at least 8.76:1. Control outlines have at least 3.69:1.

## Typography

Retain IBM Plex Sans and the existing hierarchy. Product body text uses the recorded body role; labels and metadata vary with context, generally 12–14px. Case-study body copy remains 16px with 1.75 line height. Headings, spacing and density follow [case-refined.css](css/case-refined.css) and each existing product surface.

Case-study narrative section headings use 36px desktop and 28px compact; narrative subheadings use 22px and 20px. These rules exclude embedded product UI. Below 480px, homepage metric values use `clamp(18px, 5.5vw, 24px)` to fit narrow cards, as implemented in [work-index.css](css/work-index.css).

## Layout

The homepage uses an 860px maximum content frame, including desktop navigation, Work, About, Process, the archive and footer. On scroll, the desktop homepage navigation insets 16px from each of its original edges (828px at the full content width), using its existing width transition. Project cards stack their summary above a full-width interactive demo, followed by results and the case-study link. Demo stages use their content height. Results and the link share a row on desktop and stack on compact screens. Process uses two columns on desktop and one on compact screens. The homepage hero retains its existing 860px measure. Use one content gutter (24px desktop, 20px compact); small inner panels use 20px or 16px. Align headers, controls and table regions to those gutters. Avoid stacked padded frames. Case studies share the 860px maximum homepage frame, using the portfolio-content-width token for heroes, body content, desktop navigation and footer. Story copy fills its containing section or grid column without a separate character-based width limit. Case studies have text-only, left-aligned heroes. They have no hero screenshots or chapter bars. Full narrative and product examples remain in the reading flow. The shared compact breakpoint is 767px; individual product layouts have their own existing breakpoints.

## Elevation & Depth

Product demos group content through exactly two surface backgrounds, spacing and typography. Homepage demos use subtle product-line outlines around their frames, program tiles and detail panels, with dividers under headers and between descriptive data rows. Selected programs use an accent outline, filled surface and checkmark; hover strengthens the static 1px outline, with no fill change, press scaling or border-sweep animation. Receipt rows retain dashed separators; deployment steps, sidebar and configuration rows use quiet dividers, and action buttons retain visible control outlines. Case-study examples continue to group most nested regions through tone and spacing. Active steps keep an accent underline. Retain strokes for inputs, data-table rows, topology nodes and focus/error states. Bright outer gradient frames are removed from homepage demos and case-study examples. Keep the portfolio’s existing glass treatments and background atmosphere. The [wave implementation](js/paper-wave.mjs) retains its motion, rendering limits, visibility pausing and reduced-motion behavior; the color extension adds no animation.

The wave reuses time-independent grain in a full-precision GPU cache, rebuilding it after size, pixel-ratio or composition changes. This preserves the existing resolution, grain, palette, blur and animation speed. Devices without floating-point render targets keep the original renderer.

## Shapes

All product demos use one corner scale: 12px for frames, workspace panels, cards, metric strips and table containers; 8px for controls and interactive rows; 6px for badges. The shared product-radius-panel, product-radius-control and product-radius-badge tokens in product-surfaces.css define this scale. Circular avatars, status dots, ports and step markers retain their circular shape. Table containers keep horizontal scrolling on narrow screens.

## Components

- **Headers and sidebars:** charcoal foundations with readable muted navigation; selected items use graphite and/or the accent.
- **Cards and workspaces:** use the contrasting tone to distinguish content from its surrounding region. Keep one main content gutter and smaller inner-panel padding; omit extra outer frames.
- **Primary actions:** foundation or panel fill, ink text and a stronger neutral border. Hover switches between the same two fills; focus uses the accent outline. Secondary actions use the foundation with the control outline.
- **Inputs:** contrast with their containing region, use the control outline and show a visible accent focus ring (2px, offset 3px). Preserve validation styling and labels.
- **Tables and receipts:** distinguish headers, work areas and result panels through tonal regions; retain tabular numerals and all source values.
- **Badges:** compact supporting labels, with accent emphasis reserved for meaningful selected or recommended states.
- **Case-study navigation:** name the destination project in the next-case link; stack it with the all-work link on compact screens.
- **Working principles:** present a non-sequential list without numbered steps.

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
