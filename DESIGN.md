---
name: Nicholas Gwee portfolio
description: Stark editorial typography and vivid asymmetric operating canvases
colors:
  opening: "#080808"
  opening-text: "#fff"
  opening-muted: "#d7d7d7"
  hero-button-hover: "#ffb39f"
  primary: "#a82412"
  background: "#fff"
  surface: "#ededed"
  surface-light: "#fafafa"
  text: "#101010"
  muted: "#4b4b4b"
  border: "#d6d6d6"
  border-strong: "#929292"
  dark-background: "#090909"
  dark-surface: "#242424"
  dark-surface-light: "#171717"
  dark-border: "#414141"
  dark-border-strong: "#818181"
  dark-text: "#edf2f9"
  dark-muted: "#c5c5c5"
  dark-primary: "#ff9b86"
  glass-fill: "rgba(255,255,255,.86)"
  glass-solid: "#fff"
  glass-edge: "rgba(255,255,255,.88)"
  dark-glass-fill: "rgba(23,23,23,.88)"
  dark-glass-solid: "#171717"
  dark-glass-edge: "rgba(255,255,255,.18)"
  program-canvas: "#cf3218"
  pricing-canvas: "#4725c5"
  developer-canvas: "#075db8"
  program-fill: "#fff"
  program-ink: "#151515"
  program-muted: "#525252"
  program-line: "#dadada"
  pricing-ink: "#21253e"
  pricing-muted: "#596078"
  pricing-line: "#daddec"
  pricing-receipt: "#f1f2f9"
  pricing-selected: "#5548be"
  calculator-feedback: "#e0dcfa"
  developer-fill: "#17212a"
  developer-ink: "#f0f3f7"
  developer-muted: "#aeb9c7"
  developer-line: "#374350"
  developer-selected: "#2b3b4b"
  concept-focus: "#3b78c8"
typography:
  canvas-display:
    fontSize: "clamp(3rem, 7.6vw, 7rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  hero-project:
    fontSize: "clamp(3.2rem, 5.5vw, 5.1rem)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  display:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "clamp(4rem, 10.7vw, 10rem)"
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  concept-title:
    fontSize: "clamp(24px, 3vw, 36px)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  concept-body:
    fontSize: "14px"
    lineHeight: 1.45
  net-rate:
    fontSize: "52px"
    fontWeight: 500
    lineHeight: 1.1
  button:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  navigation:
    fontSize: "13px"
  caption:
    fontSize: "12px"
  secondary-caption:
    fontSize: "14px"
  body-small:
    fontSize: "17px"
  body-mobile:
    fontSize: "18px"
  body-large:
    fontSize: "19px"
  evidence:
    fontSize: "21px"
  identity:
    fontSize: "20px"
  mark-mobile:
    fontSize: "24px"
  mark:
    fontSize: "26px"
  title-mobile:
    fontSize: "2rem"
  section-mobile:
    fontSize: "2.5rem"
  case-mobile:
    fontSize: "2.8rem"
  project-display:
    fontSize: "clamp(2.4rem, 4.6vw, 4rem)"
  section-display:
    fontSize: "clamp(3.5rem, 7vw, 6rem)"
  case-display:
    fontSize: "clamp(2.8rem, 4.5vw, 4.5rem)"
  page-display:
    fontSize: "clamp(3.5rem, 7vw, 6rem)"
  wide-display:
    fontSize: "clamp(4rem, 10.7vw, 10rem)"
  compact-display:
    fontSize: "clamp(3.4rem, 14.3vw, 6rem)"
  body:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  control: "999px"
  surface: "20px"
  hero: "12px"
  concept: "12px"
  work-concept: "8px"
  canvas: "0px"
  concept-mobile: "8px"
  canvas-mobile: "0px"
  input: "8px"
  sidebar-control: "6px"
  switch: "30px"
  mobile-frame: "14px"
  mobile-navigation: "16px"
spacing:
  mobile-gutter: "24px"
  desktop-gutter: "72px"
  section: "96px"
  project-gap: "112px"
  project-gap-mobile: "64px"
  program-canvas-inset: "64px 72px"
  pricing-canvas-inset: "64px 72px"
  concept-inset: "32px"
components:
  button-primary:
    backgroundColor: "{colors.text}"
    textColor: "{colors.background}"
    rounded: "{rounded.control}"
    padding: "12px 26px"
    typography: "{typography.button}"
  navigation:
    backgroundColor: "{colors.glass-solid}"
    textColor: "{colors.text}"
    rounded: "{rounded.surface}"
    height: "64px"
---

# Design System: Nicholas Gwee

## Overview

**Creative North Star: "High contrast, working evidence"**

A stark black opening and oversized white IBM Plex Sans establish a confident editorial identity. Vivid red, violet and blue fields give existing project content dramatic scale; asymmetric operating surfaces make each project feel authored. Glass supports navigation and preserved source artifact frames without setting the visual ceiling.

The owner rejected the muted, safe pass and pinned Tobias van Schneider as a reference. The current direction takes contrast, conviction and scale from that reference while using existing content and artifacts. Updated interface concepts are labeled, original designs remain linked, and factual project evidence stays qualified.

**Key Characteristics:**

- Oversized uppercase role typography on a black opening.
- A vivid red Partner Growth hero and distinct full-width project fields.
- Asymmetric operating surfaces beside large visual project titles.
- Purposeful, interruptible motion with live reduced-motion cancellation.

## Colors

The palette combines stark neutral grounds with confident independent project fields. Frontmatter records the final cascade from css/project-concepts.css, overriding the earlier cool glass palette. The existing detector reports 48 advisory additions in palette, type and radius. These are intentional: vivid canvas and neutral-theme colors implement the owner's stronger direction; display scales establish hierarchy; square canvas edges and inset corners distinguish project fields from navigation. They are documented choices, not unexplained token drift.

### Primary

Deep brick red is the site accent; pale coral is its dark-theme counterpart. Vermilion red carries both the Partner Growth hero and its selected-work canvas.

### Secondary

Electric violet carries pricing; strong blue carries developer. Their white visual titles and captions sit outside operating interfaces whose local palettes remain readable and independent of site theme.

### Neutral

Black opening, white light-mode ground and near-black dark-mode ground establish the frame. Partner content uses white, charcoal ink and neutral dividers. Pricing retains its pale receipt and indigo controls; developer retains midnight fill and cool light text. Glass fill, edge and opaque fallback remain theme-aware.

**The Conviction Rule.** Preserve the vivid project fields and stark opening established by the owner's correction; do not soften them into the rejected muted world.

## Typography

**Display Font:** self-hosted IBM Plex Sans, with Segoe UI and sans-serif fallbacks.
**Body Font:** IBM Plex Sans with the same fallbacks.
**Label/Mono Font:** existing source examples retain mono; the supplied resume retains IBM Plex Serif.

The role display is uppercase, weight 600, tightly tracked and almost solid in line height. Its desktop clamp reaches 10rem, compact desktop uses 11vw, and mobile uses the compact-display token with a .95 line height. Project canvas titles are visual duplicates hidden from assistive technology; semantic headings remain in the work copy. Hero project and work headings use weight 500. Net-rate figures use tabular numerals. Small interface and supporting body type contrast with the large display scale.

**The Evidence Hierarchy Rule.** Large visual titles establish project identity; semantic headings, decisions and qualified evidence carry the readable case story.

## Layout

The opening places identity and role first, contribution and actions next, then a red Partner Growth composition. The hero uses .85fr / 1.15fr columns with a 56px gap: existing project title and decision at left, a focused three-program surface lower at right. Its original detail_partner_overview image remains linked. Selected work uses a distinct catalog showing four programs on desktop and three on mobile at rest; the case contains all eight.

The main container is capped at 1328px, with 72px desktop, 40px compact and 24px mobile gutters. Work canvases expand through those gutters, use square outer edges, and carry large white visual titles. Desktop operating surfaces occupy 82%, 90% and 86% with alternating offsets; compact desktop uses 94%, mobile 100%. Canvas padding is 64px 72px desktop, 48px 40px compact, and 32px 24px mobile. The hero becomes full-width and stacked on mobile with 32px 24px padding. Work copy uses two columns with a 72px desktop gap, 40px compact, and stacks on mobile. Project spacing remains 112px desktop and 64px mobile. Case exploration containers remain capped at 1168px.

## Elevation & Depth

Bold color fields and asymmetric placement establish the main depth. The Partner hero has no shadow or backdrop blur. Work operating surfaces carry modest dark depth, removed on mobile. Navigation retains floating glass, a highlight edge, opaque fallback and 22px blur; existing case artifact frames support clear screenshot interiors. Reduced transparency keeps the Partner hero opaque red and its project title white.

### Shadow Vocabulary

- **Floating glass:** `0 16px 48px rgba(31,49,75,.1)`; dark theme uses `0 16px 48px rgba(0,0,0,.22)`.
- **Work operating surface:** `0 20px 48px rgba(0,0,0,.15)`, removed on mobile.
- **Standalone case concept:** `0 24px 70px rgba(23,40,55,.12)`, removed on mobile.

**The Supporting Glass Rule.** Glass belongs to navigation and existing artifact framing; vivid project fields carry the presentation.

## Shapes

Primary actions remain pills. Navigation retains 20px desktop and 16px mobile corners. The Partner hero uses 12px desktop corners and square mobile edges. Work canvases have square edges at every width; inset work surfaces use 8px corners. Standalone concepts retain 12px desktop and 8px mobile corners. Search fields use 8px, sidebar controls 6px, and switches a 30px capsule with a circular thumb. Original artifact frame shapes remain preserved.

## Components

### Buttons and links

Primary actions use 15px / 500 type, 12px 26px padding and a 48px minimum height. The black opening uses a white primary button with dark text and pale coral hover. Elsewhere buttons use semantic foreground/background tokens. Text links and native evidence disclosures retain visible keyboard focus. Site focus uses the semantic accent; operating controls use concept focus blue.

### Navigation and source frames

Fixed navigation is 64px desktop and 60px mobile, with 32px / 14px gaps. It uses theme-aware glass with an opaque fallback. Existing case artifact frames support clear original screenshots and accessible captions.

### Partner Growth composition and discovery

The red hero pairs the existing title and decision with a three-program focus. It labels the updated concept and links the original design. Selected-work discovery offers a distinct searchable catalog; native details remain usable without JavaScript and the case contains eight programs. Inputs begin disabled and JavaScript enables local controls. No remote actions occur.

### Pricing and developer operating surfaces

Pricing updates sequential discounts immediately: $150.00 to $127.50 to $114.75 with both eligible promotions on. The unavailable promotion stays disabled. Developer search and Environment / Rollout / Review controls update local panels while service identity stays anchored. These remain labeled explorations with sample values and original evidence.

### Motion

A single lead-project operating surface arrives laterally over 780ms using cubic-bezier(.16,1,.3,1), from translateX(-64px), scale(.965) and opacity .94 to rest. The surface is already visible; focus or pointer input cancels it. Live reduced-motion changes disconnect observation and cancel active motion. The priority hero has no entrance effect. Calculator feedback remains 220ms after immediate values, developer panel arrival remains 300ms and interruptible, and control feedback uses 180ms. Reduced motion disables CSS effects and active JavaScript animations.

Build maintenance: edit css/teletype.css, css/hiring.css, css/glass.css and css/project-concepts.css, then run npm run build:css. Generated css/portfolio.css preserves concept overrides last. Controls live in js/project-concepts.js; the single project arrival lives in js/portfolio-motion.js. This document captures the current code; review and performance evidence are tracked in review/ and are not design tokens.

## Do's and Don'ts

### Do:

- Do retain decisive contrast and independently colored project fields.
- Do label interface explorations and keep original designs accessible.
- Do keep controls keyboard accessible and respect live reduced-motion changes.
- Do preserve qualified ownership, project facts and existing source assets.

### Don't:

- Don't return to the muted palette rejected by the owner.
- Don't replace the Partner Growth hero with Developer Portal.
- Don't invent outcomes, research, testimonials or shipped redesign claims.
- Don't obscure source screenshots with glass or import reference-site assets.
