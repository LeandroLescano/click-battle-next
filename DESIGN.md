---
name: Click Battle
description: A tactile multiplayer arcade product for quick friend duels and leaderboard chasing.
colors:
  arcade-paper: "#f9f9f9"
  blue-chip-100: "#c8d6fa"
  blue-chip-200: "#8ca8f1"
  blue-chip-shadow: "#758fd1"
  blue-chip-signal: "#5463e6"
  blue-chip-press: "#4255ba"
  blue-chip-ink: "#30458e"
  blue-chip-deep: "#202660"
  arcade-charcoal: "#323232"
  pink-candy-100: "#fac8dd"
  pink-candy-200: "#f18ca2"
  pink-candy-shadow: "#e08297"
  pink-candy-signal: "#e65654"
  pink-candy-press: "#ba425a"
  pink-candy-ink: "#8e3058"
  pink-candy-deep: "#602049"
  pink-candy-charcoal: "#40353e"
  dark-table: "#191919"
typography:
  display:
    fontFamily: "Tiny5, Handjet, system-ui, sans-serif"
    fontSize: "1.875rem / 4.5rem responsive"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Handjet, system-ui, sans-serif"
    fontSize: "1.25rem / 3rem responsive"
    fontWeight: 800
    lineHeight: 1.1
  title:
    fontFamily: "Handjet, system-ui, sans-serif"
    fontSize: "1rem / 2.25rem responsive"
    fontWeight: 700
    lineHeight: 1.15
  body:
    fontFamily: "Handjet, system-ui, sans-serif"
    fontSize: "0.875rem / 1.875rem responsive"
    fontWeight: 600
    lineHeight: 1.25
  label:
    fontFamily: "Handjet, system-ui, sans-serif"
    fontSize: "0.75rem / 1.5rem responsive"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "0.375rem"
  lg: "0.5rem"
  arcade: "0.75em"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  page-mobile: "1.25rem 1.5rem"
  page-desktop: "8rem 3.5rem"
components:
  button-primary:
    backgroundColor: "{colors.blue-chip-200}"
    textColor: "{colors.blue-chip-deep}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.blue-chip-200}"
    textColor: "{colors.blue-chip-deep}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-outlined:
    backgroundColor: "{colors.arcade-paper}"
    textColor: "{colors.blue-chip-ink}"
    rounded: "{rounded.md}"
    padding: "0.25rem 1rem"
  card-room:
    backgroundColor: "{colors.blue-chip-100}"
    textColor: "{colors.blue-chip-ink}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.5rem"
  field:
    backgroundColor: "{colors.arcade-paper}"
    textColor: "{colors.arcade-charcoal}"
    rounded: "{rounded.lg}"
    padding: "0.375rem 0.75rem"
---

# Design System: Click Battle

## 1. Overview

**Creative North Star: "Pocket Arcade Duel"**

Click Battle should feel like a tiny arcade cabinet that fits in a browser tab: immediate, tactile, friendly, and just competitive enough to make a rematch feel inevitable. The system is product-first, so every visual decision must help users create a room, join friends, start the round, hit the moment, understand results, and play again.

The interface uses chunky retro-game typography, pressable controls, patterned backgrounds, and themeable color ramps to make quick casual play feel alive. Energy comes from physical feedback and clear game states, not from decorative chaos. The product must reject corporate polish, casino cues, gambling-coded urgency, overly childish visuals, hardcore esports intimidation, generic SaaS surfaces, and visual noise.

**Key Characteristics:**

- Tactile controls that visibly depress, shadow, and recover.
- Friendly arcade color ramps with blue as the default and pink as the alternate theme.
- Large, uppercase, readable game-state typography.
- Dense enough for quick product use, playful enough to feel social.
- State communication that pairs color with text, labels, and position.

## 2. Colors

The palette is an arcade-token system: one primary ramp carries the whole UI, and themes swap the ramp while preserving roles.

### Primary

- **Arcade Paper** (`arcade-paper`): the lightest neutral surface and field background.
- **Blue Ticket Ramp** (`blue-chip-100` through `blue-chip-deep`): the default room, control, icon, and text system. Use lighter steps for cards and inactive surfaces, middle steps for active affordances, and deep steps for important text.
- **Blue Button Shadow** (`blue-chip-shadow`): the tactile offset shadow for primary and card buttons. It gives controls their physical arcade-button feel.
- **Blue Signal** (`blue-chip-signal`): the current default action and icon accent. Use for active game-state emphasis, trophies, selected theme accents, and strong headings.

### Secondary

- **Pink Candy Ramp** (`pink-candy-100` through `pink-candy-deep`): the alternate theme. It should mirror the blue role structure instead of becoming a separate visual language.
- **Pink Button Shadow** (`pink-candy-shadow`): the alternate tactile offset shadow.
- **Pink Signal** (`pink-candy-signal`): the alternate action and game-state accent.

### Neutral

- **Arcade Charcoal** (`arcade-charcoal`): the neutral text/deep surface endpoint for the default ramp.
- **Pink Charcoal** (`pink-candy-charcoal`): the neutral text/deep surface endpoint for the pink ramp.
- **Dark Table** (`dark-table`): the dark-mode background beneath the subtle square texture.

### Named Rules

**The One Ramp Rule.** A screen should use one active primary ramp at a time. Blue, pink, and custom themes may swap roles, but they must not compete on the same surface.

**The Signal Is Earned Rule.** The saturated middle step is for actions, winners, current state, and game feedback. Do not scatter it as decoration.

**The No Casino Rule.** Never combine saturated red/pink, flashing motion, countdown pressure, and reward language in a way that resembles gambling or predatory urgency.

## 3. Typography

**Display Font:** Tiny5, with Handjet and system UI fallback  
**Body Font:** Handjet, with system UI fallback  
**Label/Mono Font:** Handjet, with system UI fallback

**Character:** Typography is retro, compact, and emphatic. It should feel like arcade signage translated into a usable product UI, not like a novelty font pasted onto generic SaaS controls.

### Hierarchy

- **Display** (700, `text-3xl` to `md:text-7xl`, line-height near 1): reserved for the Click Battle wordmark and major celebratory moments.
- **Headline** (800, `text-xl` to `md:text-5xl`, line-height near 1.1): page and mode headings such as Create your own room, Reaction Battle state, ranking title, and result sections.
- **Title** (700, `text-base` to `md:text-4xl`, line-height near 1.15): room list headings, section titles, modal headings, and leaderboard labels.
- **Body** (600, `text-sm` to `md:text-3xl`, line-height around 1.25): explanatory copy, welcome text, helper text, and result descriptions. Keep prose short; this is a quick-play product.
- **Label** (700, uppercase, `text-xs` to `md:text-2xl`, line-height 1): form labels, compact buttons, badges, mode labels, and navigation controls.

### Named Rules

**The Arcade Signage Rule.** Use display intensity for brand, game state, and celebration. Do not use display styling for dense settings, legal text, or long instructions.

**The Short Copy Rule.** If copy wraps into a paragraph during gameplay, it is probably too long. State the action, state the risk, state the result.

## 4. Elevation

Depth is tactile, not atmospheric. Click Battle uses offset shadows and translate transforms to make buttons, cards, and rows feel like physical pieces being pressed. Ambient drop shadows are secondary and should not replace the chunky arcade press vocabulary.

### Shadow Vocabulary

- **Arcade Lift** (`box-shadow: 3px 4px var(--color-primary-250)`): default raised state for primary buttons, card buttons, and cards.
- **Arcade Hover** (`box-shadow: 1.5px 2px var(--color-primary-250)`): hover state paired with a smaller translate offset.
- **Arcade Pressed** (`box-shadow: 0 0 var(--color-primary-250)`): active state when the control has been pressed into the surface.
- **Legacy Deep Press** (`box-shadow: 0 0 0 2px border, 0 0.625em 0 0 shadow`): older `.btn-click` and room-card press effect. Preserve existing instances, but prefer the newer tokenized offset pattern for new work.

### Named Rules

**The Press, Do Not Float Rule.** Interactive controls may lift because they are pressable. Passive surfaces should stay flatter unless they need to read as selectable.

**The Fast Feedback Rule.** State transitions should stay around 150ms. The player should feel the click, not wait for choreography.

## 5. Components

### Buttons

- **Shape:** gently rounded arcade rectangle (`rounded-md`, 6px) for new buttons; older legacy buttons use pillier arcade corners (`0.75em`).
- **Primary:** default uses light ramp fill, deep ramp text, 1-2px border, bold uppercase copy, and `3px 4px` offset shadow.
- **Hover / Focus:** hover reduces the offset to `1.5px 2px` and moves the button closer to the surface. Focus must be visibly distinct; do not remove outlines without replacing them.
- **Active:** active removes the shadow and translation to simulate a pressed arcade button.
- **Secondary / Outlined:** outlined buttons use transparent or light surfaces with primary text and border. They are for navigation, settings, profile, and reset actions, not the main game action.

### Chips

- **Style:** mode/status chips use rounded-full borders, small uppercase text, and primary middle-ramp text.
- **State:** selected or active chips must include text, position, or icon reinforcement; color alone is not enough for gameplay state.

### Cards / Containers

- **Corner Style:** rounded product cards (`rounded-md`, 6px) with arcade shadow.
- **Background:** light primary ramp (`primary-100`) with middle-ramp border (`primary-300`).
- **Shadow Strategy:** selectable cards use Arcade Lift, Hover, and Pressed states. Passive information cards can use the same base card styling without hover transforms.
- **Border:** 1-2px primary border, not side stripes.
- **Internal Padding:** compact on mobile (`0.375rem 0.5rem` to `1rem`) and roomier on desktop (`1rem` to `1.5rem`).

### Inputs / Fields

- **Style:** rounded fields (`rounded-lg`, 8px), light neutral/ramp surface, simple border, and strong label pairing.
- **Focus:** focus states must be visible and should use the active ramp color or an outline. Do not rely on browser-default focus invisibility.
- **Error / Disabled:** disabled fields should visibly desaturate and reduce affordance. Errors must pair color with message text.

### Navigation

- **Style:** top headers use large arcade identity on the left and compact outlined controls on the right. Game headers prioritize Back, language, and host settings.
- **Mobile Treatment:** controls stack or tighten before they shrink into illegibility. Preserve touch targets over perfect desktop symmetry.
- **Active States:** current user, current mode, and current room state should be explicit in text.

### Signature Component: Reaction Battle Panel

Reaction Battle is a state-first game surface. The main action button should dominate the left side, helper copy should explain risk in one sentence, and the results list should stay legible and sortable. False starts, valid reactions, waiting players, and winners must each have text labels, not just colors.

## 6. Do's and Don'ts

### Do:

- **Do** keep the one-active-ramp theme model: default blue, alternate pink, or custom generated ramp.
- **Do** make primary actions feel physically pressable with offset shadows, transform, and 150ms transitions.
- **Do** keep game-state copy short, direct, and visible near the action.
- **Do** pair color with text or icons for waiting, false start, winner, room mode, and disabled states.
- **Do** preserve large mobile touch targets for click and reaction gameplay.
- **Do** use the square background texture subtly; it should create atmosphere, not visual noise.

### Don't:

- **Don't** make Click Battle feel corporate, casino-like, gambling-coded, overly childish, hardcore esports, generic SaaS, or visually noisy.
- **Don't** use side-stripe borders, gradient text, decorative glassmorphism, hero-metric templates, or identical card grids as default patterns.
- **Don't** scatter saturated action colors on inactive decoration.
- **Don't** hide the next action behind modals when inline or progressive UI would work.
- **Don't** use long paragraphs during gameplay.
- **Don't** remove focus states, make touch targets tiny, or communicate gameplay outcomes through color alone.
