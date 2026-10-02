---
name: Nicholas Gwee portfolio
description: Modern minimal portfolio with restrained glass framing
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
typography:
  display:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "clamp(3.4rem, 7.25vw, 6.5rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.04em"
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
    fontSize: "7rem"
  compact-display:
    fontSize: "clamp(3.3rem, 12vw, 5.5rem)"
  body:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  control: "999px"
  surface: "20px"
  hero: "24px"
  mobile-frame: "14px"
  mobile-navigation: "16px"
spacing:
  mobile-gutter: "24px"
  desktop-gutter: "72px"
  section: "96px"
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

**Creative North Star: "Modern minimal glass, original product evidence"**

Wide, light-weight sans typography and generous whitespace establish identity quickly for recruiters, design leaders and hiring teams. Floating frosted navigation and restrained artifact frames introduce depth; the original screenshots stay unobscured.

**Key Characteristics:**

- Cool neutral surfaces and a slate-blue accent.
- Large, light IBM Plex Sans headings with quiet supporting type.
- Original product evidence framed with restrained glass.
- Distinct compositions for each selected project.

## Colors

Cool monochrome surfaces with one slate-blue interface accent. Light and dark semantic colors live in css/glass.css. Product images retain their original colors.

## Typography

Self-hosted IBM Plex Sans carries the interface and display. The homepage role uses a wide 400-weight display with -0.04em tracking. Mono remains reserved for source product examples and data; the supplied resume retains IBM Plex Serif. The homepage role has 1.08 line height, with a 7rem wide-screen size from 1600px, 7.5vw at 1024px and below, and clamp(3.3rem, 12vw, 5.5rem) / 1.06 on mobile. Supporting literal size steps and display endpoints are declared in the frontmatter. Body text uses 17px / 1.7 on desktop and 16px on mobile; homepage supporting text uses 19px desktop and 17px mobile.

## Layout

A full-width typographic opening precedes a large, offset Developer Portal catalog image. Selected work begins with a panoramic Partner artifact, followed by a lighter Discounting composition and a larger dark Developer Portal frame. All collapse into one column at widths of 767px and below. The container is at most 1328px with 72px desktop gutters, 40px at 1024px and below, and 24px on mobile. Desktop section spacing is 96px; mobile spacing is 64px. The mobile resume download sits below the name in normal flow. Case role, contribution, decision and results remain visible; dense originals and reconstructed examples are native disclosures.

## Elevation & Depth

Glass is reserved for navigation and artifact framing: translucent neutral fill, 1px highlight edge, 22px navigation blur, and a soft offset shadow. Artifact blur is 14px where supported. Light depth is 0 16px 48px rgba(31,49,75,.1); dark depth is 0 16px 48px rgba(0,0,0,.22). Default fills are solid; backdrop-filter support enables translucency, and reduced-transparency explicitly restores solid fills. Avoid glow, decorative mesh, and glass over screenshot content.

## Shapes

Pill primary controls;20px desktop artifact and navigation radii;14–16px on mobile; quieter screenshot corners inside them. This hierarchy separates navigation from source product UI.

## Components

Navigation is fixed with generous surrounding space, a 64px desktop height and 60px mobile height. Desktop navigation uses 32px gaps, reduced to 14px on mobile. Primary actions use 15px / 500 type, 12px 26px padding and a 48px minimum height. Focus uses a 3px semantic accent outline; the skip link remains first. The original Developer Portal catalog hero has priority, lossless responsive sources at 400, 700 and 1000px, and a reserved 1000:517 ratio. Project roles sit beneath project titles. The priority image has no entrance animation. Color feedback transitions are short and disabled for reduced motion. Disclosures use native keyboard and no-JavaScript behavior. Full-size original image links are visible in each case hero.

Build maintenance: Edit css/teletype.css, css/hiring.css and css/glass.css, then run npm run build:css. The deterministic shared css/portfolio.css retains their cascade and reduces three blocking requests to one. Case reconstruction stylesheets remain separate.

## Do's and Don'ts

- Lead with supplied product artifacts, dated results and decision summaries.
- Preserve routes, legal text, roles, original assets and reconstruction labels.
- Keep content visible with no JavaScript, no blur support, and both themes.
- Do not invent project outcomes, research, testimonials or contributions.
- Do not obscure source evidence with glass or generated screenshots.
