---
name: Nicholas Gwee portfolio
description: Artifact-led editorial product design portfolio
colors:
  primary: "#435d2b"
  background: "#f5f5f0"
  surface: "#e9ece2"
  surface-light: "#fafaf6"
  text: "#24271f"
  muted: "#5b6052"
  border: "#d5d9cd"
  border-strong: "#bdc5b1"
  dark-background: "#171b15"
  dark-surface: "#272e23"
  dark-surface-light: "#1d221b"
  dark-border: "#3b4434"
  dark-border-strong: "#616e56"
  dark-text: "#eef1e8"
  dark-muted: "#b9c1b0"
  dark-primary: "#b8d399"
typography:
  display:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "clamp(2.75rem, 5.5vw, 5.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  body:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  control: "8px"
  surface: "12px"
spacing:
  mobile-gutter: "22px"
  desktop-gutter: "48px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.text}"
    textColor: "{colors.background}"
    rounded: "{rounded.control}"
    padding: "12px 23px"
    height: "48px"
---

# Design System: Nicholas Gwee

## Overview

**Creative North Star: "Editorial product dossier"**

Precise, credible, and crafted. Original product artifacts carry the visual character, supported by substantial sans typography and restrained olive surfaces. Content stays visible before animation or JavaScript runs. Product reconstructions retain their independent UI language and are explicitly labelled.

## Colors

Olive is the portfolio's single accent. Light and dark themes use semantic variables from `css/hiring.css`; product UI screenshots retain their original colors.

## Typography

Self-hosted IBM Plex Sans leads display, body, navigation, and project metadata. Mono is reserved for incumbent product examples and data. IBM Plex Serif remains available for the existing resume identity. Headings balance automatically; body copy stays within a readable measure.

## Layout

The container reaches 1280px with generous side gutters. Asymmetric opening compositions collapse into a single column below 768px. A full-width featured project precedes two supporting projects; case summaries use three columns on desktop and one on mobile. Persistent navigation remains within 72px on desktop and 64px on mobile.

## Elevation & Depth

Portfolio surfaces use tonal separation, without decorative shadows. Product examples keep their incumbent elevation rules.

## Shapes

Controls use compact rounded corners; artifact mats use gently rounded surfaces. Screenshot corners are quieter than their surrounding mats.

## Components

Primary buttons use text ink against the page ground, switching to olive on hover. Underlined text links retain a 44px target when acting as navigation. Focus is a 3px olive outline offset 5px. The skip link is first in keyboard order. Artifact images preserve their whole composition, reserve dimensions, and use eager priority only above the fold. Hover zoom is modest; motion is gated by reduced-motion preferences.

## Do's and Don'ts

- Do lead with supplied artifacts and preserve their visual evidence.
- Do use dated, qualified project outcomes and specific decision summaries.
- Do maintain both themes, clear focus, and immediately visible text.
- Don't invent metrics, testimonials, projects, roles, or illustrative product evidence.
- Don't replace original project imagery with decorative stock or generated screenshots.
