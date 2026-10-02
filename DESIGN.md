---
name: Nicholas Gwee portfolio
description: Bold typographic portfolio with independent operating canvases
colors:
  primary: "#264b75"
  background: "#f3f5f8"
  surface: "#e7ebf1"
  surface-light: "#fafbfd"
  text: "#151a23"
  muted: "#505969"
  border: "#cdd4df"
  border-strong: "#a1afc1"
  dark-background: "#11151c"
  dark-surface: "#242d3a"
  dark-surface-light: "#1a202a"
  dark-border: "#354152"
  dark-border-strong: "#61748e"
  dark-text: "#edf2f9"
  dark-muted: "#b8c3d4"
  dark-primary: "#a9c8f1"
  glass-fill: "rgba(249,251,255,.82)"
  glass-solid: "#f9fbff"
  glass-edge: "rgba(255,255,255,.85)"
  dark-glass-fill: "rgba(29,37,49,.85)"
  dark-glass-solid: "#1d2531"
  dark-glass-edge: "rgba(203,220,247,.2)"
  program-canvas: "#dfeadf"
  pricing-canvas: "#e6e4f1"
  developer-canvas: "#263849"
  program-fill: "#f4f9f4"
  program-ink: "#182b29"
  program-muted: "#4c625d"
  program-line: "#c7d7d1"
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
  display:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "clamp(3.4rem, 8.2vw, 7.1rem)"
    fontWeight: 600
    lineHeight: 0.98
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
    fontSize: "22px"
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
    fontSize: "clamp(2rem, 3.25vw, 3rem)"
  section-display:
    fontSize: "clamp(2.5rem, 4.5vw, 4.2rem)"
  case-display:
    fontSize: "clamp(2.8rem, 4.5vw, 4.5rem)"
  page-display:
    fontSize: "clamp(3.5rem, 7vw, 6rem)"
  wide-display:
    fontSize: "clamp(3.4rem, 8.2vw, 7.1rem)"
  compact-display:
    fontSize: "clamp(3.25rem, 14vw, 5.5rem)"
  body:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  control: "999px"
  surface: "20px"
  hero: "16px"
  concept: "12px"
  concept-mobile: "8px"
  canvas-mobile: "10px"
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
  program-canvas-inset: "48px"
  pricing-canvas-inset: "56px"
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

**Creative North Star: "Bold identity, independent operating canvases"**

Oversized uppercase IBM Plex Sans establishes a clear role identity over a cool neutral ground. Independent green, lavender and midnight canvases give the work room to operate; restrained floating navigation carries the supporting glass treatment. Original case evidence remains accessible alongside clearly labeled interface explorations.

The user-pinned Tobias van Schneider reference informs bold hierarchy and generously scaled project presentation; Apple-like motion informs purposeful state feedback. These are inspirations, not imported assets or feature claims. The latest direction contract in `.impeccable/surfaces/portfolio-hiring.md` supersedes the earlier lightweight, screenshot-led opening.

**Key Characteristics:**

- Bold 600-weight uppercase role identity with quiet supporting type.
- Independent project canvases with distinct program, pricing and developer palettes.
- Semantic operating examples beside preserved original evidence.
- Purposeful scroll arrival and immediate, interruptible control feedback.

## Colors

Cool neutral light/dark site surfaces and a slate-blue navigation accent support independently colored project canvases. Program discovery uses muted green with forest ink; pricing uses lavender, indigo controls and a pale receipt; developer uses midnight with cool light text. These local palettes stay independent of site theme. Site semantic colors originate in css/glass.css; concept palettes and final cascade overrides originate in css/project-concepts.css. Frontmatter records intentional color additions flagged by the detector.

## Typography

Self-hosted IBM Plex Sans carries the interface and display, with Segoe UI and sans-serif fallbacks. The homepage role is uppercase, 600-weight, tightly tracked and nearly solid in line height. Desktop and mobile display sizes are recorded in frontmatter; compact desktop uses 9vw, and mobile line height is 1.02. Selected-work, page and case headings use 500 weight. Concept titles use 500 weight and compact negative tracking; net-rate figures use tabular numerals. Mono remains within source product examples and data; the supplied resume retains IBM Plex Serif. Body text stays readable and supporting.

## Layout

The full-width typographic opening precedes a large semantic dark developer catalog exploration, offset right. Selected projects form successive large independent canvases. Desktop work copy uses two columns with a 72px gap; titles precede factual role metadata. At 1024px the gap becomes 40px and canvas insets become 28px. At 767px and below, copy and operating layouts stack, canvas insets become 12px, and project spacing follows the mobile token. The main container remains at most 1328px with 72px desktop, 40px compact and 24px mobile gutters. Case exploration containers are at most 1168px. Original evidence and native disclosures remain in case pages.

## Elevation & Depth

Independent canvases rely on tonal separation and generous inset space. The semantic opening has no shadow; floating navigation retains its glass fill, highlight edge, solid fallback, 22px blur and theme-aware soft depth. Existing source case artifact frames retain their supporting treatment. Standalone case concepts use 0 24px 70px rgba(23,40,55,.12), removed on mobile. Glass never overlays source screenshot content.

## Shapes

Primary actions remain pills. Navigation retains 20px desktop and 16px mobile corners. The semantic opening uses 16px corners; local concepts and desktop project canvases use 12px, with 8px concept and 10px canvas corners on mobile. Search fields use 8px corners, sidebar controls 6px, and switches a 30px capsule with a circular thumb. Source-defined additions distinguish navigation from operating examples.

## Components

Primary actions retain 15px / 500 type, 12px 26px padding and a 48px minimum height. Navigation remains fixed, 64px desktop and 60px mobile, with 32px / 14px gaps. Text links and native evidence disclosures retain visible keyboard focus. Site focus uses the semantic accent; operating controls use the concept focus token.

Partner discovery searches eight native program details; resting home previews show a selection and the case contains all eight. Pricing demonstrates sequential discounts with immediate values: $150.00 to $127.50 to $114.75 when both eligible promotions are on. The unavailable promotion remains disabled. Developer catalog search and Environment / Rollout / Review controls update local detail panels while service identity stays anchored. Controls start disabled and are enabled by JavaScript; static examples, native details and original source links remain available without it. These are labeled explorations with sample values and perform no remote actions.

Motion is confined to purpose: one lead-project scroll arrival (650ms), calculator feedback (220ms) after immediate value updates, and interruptible developer detail arrival (300ms). Control color and switch feedback use 180ms. The semantic priority hero has no entrance effect. Reduced motion disables CSS effects and cancels active JavaScript animations when the preference changes.

Build maintenance: edit css/teletype.css, css/hiring.css, css/glass.css and css/project-concepts.css, then run npm run build:css. Generated css/portfolio.css preserves their cascade with concept overrides last. Case reconstruction stylesheets remain separate. Local interactions live in js/project-concepts.js; the single scroll arrival lives in js/portfolio-motion.js.

## Do's and Don'ts

- Do lead with factual ownership, decisions and qualified evidence.
- Do label new interface explorations and sample values, and retain original design links.
- Do keep essential content and native disclosures visible without JavaScript and respect live reduced-motion changes.
- Do not invent project outcomes, research, testimonials or contributions.
- Do not obscure original evidence or present explorations as shipped redesigns.
