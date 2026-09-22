---
name: ui-tokens
description: How this extension's visual values are organised - colour, spacing, typography, motion, z-index - and how to add UI without introducing raw values. Read before touching src/styles or before any redesign, restyle or new UI surface in the panel, drawer, chart or player button.
---

# UI values in YouTube Loop

Plain CSS, no CSS-in-JS, no framework. Every visual constant lives in
`src/styles/tokens.css`; the feature stylesheets consume it. `npm run lint:css`
fails the build on a raw colour outside the token file, so this is enforced,
not remembered.

## The two tiers

**Tier 1 — primitives.** Raw values with names that say _what they are_:
`--c-neutral-500`, `--c-brand-400`. A primitive never references another.

**Tier 2 — semantics.** Roles pointing at primitives: `--fg`, `--bg`,
`--surface`, `--border`, `--accent`. A semantic never holds a raw value.

Stylesheets consume **only** semantics. The direction is one-way:

```
stylesheet → semantic token → primitive
```

Consequences worth stating, because each is a live temptation:

- A rule that needs a new colour does not invent one. Either an existing role
  fits, or a new role is added at tier 2 pointing at an existing primitive.
- A new primitive joins a ramp with a proper step name. Never a one-off.
- A semantic never points at another semantic more than one level deep, or a
  colour change becomes impossible to trace.

## Derive, don't define

Most surface, border and state colours are one colour mixed into another. Say
that instead of freezing the result:

```css
--surface: color-mix(in oklab, var(--fg) 16%, var(--bg));
--border: color-mix(in oklab, var(--fg) 14%, transparent);
--state-hover: color-mix(in oklab, var(--fg) 8%, transparent);
```

This is the highest-leverage rule here. A whole surface/border/state family
then follows from two tokens, and re-theming means changing two values rather
than forty. Mix `in oklab` for perceptually even blends. Use `transparent` as
the second colour for overlays that must sit on any background - the panel
floats over arbitrary YouTube artwork, so that case is common.

## OKLCH for primitives

Define primitives as `oklch(L C H)`, not hex:

```css
--c-neutral-500: oklch(0.551 0 0);
```

L is perceptual lightness, so evenly spaced L reads as evenly spaced, which is
not true of HSL. Fixing L and C and moving only H gives hues of matching
weight, which is how a categorical palette avoids one colour shouting. Number
steps by lightness (50 lightest, 950 darkest) and keep the scale identical
across ramps, so `--c-red-400` and `--c-blue-400` weigh the same. Add an
intermediate step rather than nudging an existing one that other rules use.

## Everything else is a token too

Spacing, radius, duration, easing, control heights and z-index are decisions,
not guesses. A scale has steps: `--space-3` is a decision, `13px` is a guess.
If a value does not fit the scale, either the scale or the design is wrong -
resolve that instead of adding a half-step.

z-index lives in one ordered map in `tokens.css`, never as a local number. The
panel sits above YouTube's own chrome, so the top of that map is deliberately
extreme; leave gaps so a layer can be inserted without renumbering.

## Theming

YouTube marks dark mode with a `dark` attribute on `<html>`, so the panel
follows the page rather than `prefers-color-scheme`. Define the complete light
palette on bare `:root` and override only what changes under `[dark]`. Never
give a colour its only definition inside a theme block.

## Hover on touch

Gate hover styling behind `@media (hover: hover)`; on a touch device a
`:hover` rule sticks after a tap.

## Animatable custom properties

A custom property is a string and does not animate. Declared with `@property`
it becomes typed and interpolatable - `glow.css` already relies on this for
`--ytloop-angle`. Use it for any value an animation writes every frame.

## Deliberately isolated palettes

A self-contained visual subsystem may own bespoke colours so it does not drift
with the app theme. If that ever happens here, record it in `docs/KEEP.md` with
the reason, or the next cleanup will "de-duplicate" it back and silently couple
two things meant to be independent.

## Not used here, and why

Lifted from a React/styled-components guide; these parts were rejected
deliberately, so do not reintroduce them:

- **A typed TS accessor layer** (`color.bg` etc.). No TypeScript in this
  project writes colours - styling is plain CSS files - so the layer would add
  indirection and buy nothing.
- **`css` mixin modules.** No CSS-in-JS. Shared styling is a class or a
  custom property.
- **Breakpoint helpers.** The panel is a fixed-width overlay on a desktop
  page; it has no responsive layout to parameterise.

## Checklist when adding UI

1. Does an existing role fit? Use it.
2. If not - is it a new role (tier 2) or a new value (tier 1)? Add at the right tier.
3. Derivable from an existing colour? `color-mix` it instead of defining it.
4. Spacing, radius, duration, size, z-index get tokens too.
5. `npm run lint:css` - a raw value outside `tokens.css` is a failure, not a warning.
