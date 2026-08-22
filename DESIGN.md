---
name: CPAM Conecta
description: Painel interno do Ceasinha do Morango para registrar o preço diário da caixa de morango.
colors:
  board-ground: "oklch(0.22 0.02 165)"
  board-rule: "oklch(0.42 0.02 165)"
  chalk-white: "oklch(0.97 0.01 90)"
  chalk-label: "oklch(0.82 0.02 120)"
  chalk-subtitle: "oklch(0.65 0.02 165)"
  chalk-placeholder: "oklch(0.55 0.02 165)"
  strawberry: "oklch(0.52 0.19 25)"
  strawberry-hover: "oklch(0.57 0.19 25)"
  strawberry-focus: "oklch(0.62 0.19 20)"
  strawberry-foreground: "oklch(0.99 0 0)"
  board-error: "oklch(0.74 0.19 25)"
typography:
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.14em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: "0px"
spacing:
  sm: "0.375rem"
  md: "1.25rem"
  lg: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.strawberry}"
    textColor: "{colors.strawberry-foreground}"
    rounded: "{rounded.none}"
    padding: "0 1rem"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.strawberry-hover}"
---

<!--
DIRECTION CONTRACT (login surface, established here; a durable audit record,
not something shipped to the browser — it previously lived as an injected
comment in the root layout's DOM, which was wrong because it rendered on
every route, not just the one it describes; it lives only here now):

THESIS: Login as the first chalked row on the entreposto's price board, refusing the templated centered white auth card with logo.
OWN-WORLD: Matte near-black slate-green board, warm chalk-white type, one strawberry-red accent; bold tracked caps for labels, chalk-rule underlines for fields, no boxed inputs.
STORY: The employee or owner recognizes their own board, trusts it as the internal record system, and signs in fast on a slow connection.
FIRST VIEWPORT: One centered panel on the dark board, no chrome; wordmark, email/senha rows with chalk-rule underlines, one accent button "Entrar"; an error surfaces inline as a struck correction line, never a toast.
FORM: Quadro de precos do entreposto (#3 of 7, own grounded list); seed key 78fcad81.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
-->

# Design System: CPAM Conecta

## Overview

**Creative North Star: "The Entreposto Board"**

CPAM Conecta is an internal record system for a small strawberry market in Bom
Repouso/MG, used by one or two people on a phone, often on a weak connection. Its
first surface — login — refuses the templated centered white auth card with a
logo, and instead reads as the first chalked row on the wholesale market's own
price board: a matte, near-black slate-green ground; warm chalk-white type; one
strawberry-red accent spent only on the primary action and the focus state.
Fields are ruled rows, not boxes — there is no card chrome anywhere in this
system yet. The tone is quiet and trustworthy, never playful: this is a record
of truth for a pricing decision, not a marketing surface.

The board's material is authored, not implied: a low-opacity fractal-noise
grain sits under the content so the ground reads as a painted, textured
surface rather than a flat color standing in for one.

**Key Characteristics:**
- Restrained color strategy: one dark neutral ground, one warm accent, spent narrowly.
- No boxed containers, no cards, no rounded corners anywhere.
- Fields are underlined rows (a chalk rule), not bordered boxes.
- Bold, tracked, uppercase labels; all other text sentence case.
- Confirmed visual rejection: no white/light auth-card template, no gradients, no glassmorphism, no glyph/emoji icons standing in for drawn ones.

## Colors

A single dark neutral ground with one warm accent, spent only where the user must act or where something went wrong.

### Primary
- **Strawberry** (`oklch(0.52 0.19 25)`): the sole accent. Used only on the primary submit button (background) and on field focus (border color, `oklch(0.62 0.19 20)`), so it stays legible as "the one thing to press."

### Neutral
- **Board Ground** (`oklch(0.22 0.02 165)`): the page background — a matte, slightly green-tinted near-black, carrying the authored grain texture.
- **Chalk White** (`oklch(0.97 0.01 90)`): primary text — the wordmark, form input values.
- **Chalk Label** (`oklch(0.82 0.02 120)`): field labels (bold, tracked, uppercase).
- **Chalk Subtitle** (`oklch(0.65 0.02 165)`): the business byline under the wordmark.
- **Chalk Placeholder** (`oklch(0.55 0.02 165)`): input placeholder text.
- **Board Rule** (`oklch(0.42 0.02 165)`): the hairline underline beneath each field at rest.
- **Strawberry Foreground** (`oklch(0.99 0 0)`): text on the accent button.
- **Board Error** (`oklch(0.74 0.19 25)`): a lighter tint off the strawberry hue, reserved for the inline error message and its correction rule — legible as body text against the dark ground, distinct from the button's darker, more saturated strawberry.

### Named Rules
**The One Accent Rule.** Strawberry red appears in exactly two places: the primary button and a focused field's rule. It never decorates a label, a link, or a passive element — its rarity is what makes it read as "actionable" on a screen with almost no other color.

## Typography

**Body/Label Font:** Geist (self-hosted via `next/font/google`, system-ui fallback)

**Character:** One workhorse grotesk carries the whole surface — the board's "hand" comes from weight, case, and tracking, not from a second display face. Labels are bold, uppercase, and widely tracked (0.14em) to read like stenciled board lettering; body and input text stay sentence case at normal tracking for legibility.

### Hierarchy
- **Wordmark** (700, 1.125rem/18px, uppercase, 0.14em tracking): "CPAM Conecta" atop the page.
- **Label** (700, 0.75rem/12px, uppercase, 0.14em tracking): field labels ("E-mail", "Senha").
- **Body** (400, 1rem/16px): input values and the error message.
- **Subtitle** (400, 0.75rem/12px, uppercase, 0.1em tracking): the business byline under the wordmark.

### Named Rules
**The One Face Rule.** Every weight and case on this surface comes from Geist. A second, more decorative face was deliberately not introduced — Operate-mode surfaces earn their character from restraint, not from a display font.

## Layout

Single-column, mobile-first, centered. The page is one flex container (`flex-1 items-center justify-center`) holding one panel capped at `22rem` (352px), so the layout does not change shape between phone and desktop — it just gets more empty board around it. No sidebar, no nav, no chrome: this route is pre-authentication, and that absence is deliberate, not a missing piece. Vertical rhythm inside the panel: wordmark block, then a `2.5rem` gap, then the field stack (`1.25rem` between fields), then the submit button.

## Elevation & Depth

Flat by design — no shadows anywhere on this surface. Depth comes from the authored grain texture on the ground (a fractal-noise SVG layered at 5% opacity with `mix-blend-mode: overlay`) rather than from elevation; a chalkboard does not float above anything, it is the surface.

### Named Rules
**The No-Shadow Rule.** Nothing on this surface casts a shadow. If a future component seems to need one to separate itself from the board, that is a signal the composition — not the shadow — needs to change.

## Shapes

Everything is rectangular with hard corners — no `border-radius` is used anywhere on this surface (buttons, inputs, focus outlines). Fields have no visible container at all; they are text sitting on a single 2px rule (`border-bottom`), evoking a ruled row on the board rather than a boxed form control.

## Components

### Buttons
- **Shape:** rectangular, 0px radius, full width, 3rem (48px) tall.
- **Primary:** `background: oklch(0.52 0.19 25)`, text `oklch(0.99 0 0)`, bold uppercase label at 0.14em tracking. The only bordered/boxed element on the page.
- **Hover:** background lightens to `oklch(0.57 0.19 25)`.
- **Focus:** a 2px outline in `oklch(0.62 0.19 20)`, offset from the button edge.
- **Disabled / loading:** `opacity: 0.7`, cursor `not-allowed`, label swaps to "Entrando…" with a spinning drawn icon (Lucide `Loader2`) — never a glyph or emoji.

### Inputs / Fields
- **Style:** no border box; a single `border-bottom: 2px solid oklch(0.42 0.02 165)` under transparent, ground-colored text. 44px+ tap height for mobile.
- **Focus:** the bottom rule changes color to the strawberry focus tone (`oklch(0.62 0.19 20)`); no glow, no ring.
- **Error:** the field gets `aria-invalid`; the error message itself renders below the field stack as sentence-case text in Board Error (`oklch(0.74 0.19 25)`), preceded by a short rotated rule standing in for a chalk correction stroke — never a boxed alert or a toast.
- **Disabled:** `opacity: 0.5`, matching the button's disabled treatment.

## Do's and Don'ts

### Do:
- **Do** spend the strawberry accent only on the primary action and on focus — never on a label, link, or decorative element (The One Accent Rule).
- **Do** underline fields with a single rule instead of boxing them; a boxed input is a different, unbuilt system.
- **Do** keep every corner square; a rounded element on this surface is a foreign material.
- **Do** show errors inline, in place, in sentence case with the recovery implied — never as a floating toast or modal.

### Don't:
- **Don't** introduce a second display font. Character comes from Geist's own weight/case/tracking (The One Face Rule).
- **Don't** add a shadow anywhere (The No-Shadow Rule); depth on this surface is the grain, not elevation.
- **Don't** use a kicker/eyebrow label, a gradient, glassmorphism, or a hard offset "neobrutalist" shadow — none of those belong to this world.
- **Don't** stand in an emoji or Unicode glyph for an icon; use a drawn icon (Lucide, already in the project) or nothing.
