# Relay Visual Strategy

This document translates a repo-wide review of the current Relay surface and the `design-taste-frontend` skill into practical guidance for ACP.

## Current read

Relay already avoids generic AI design in a few important ways:

- it uses a warm editorial palette instead of cold purple-on-white defaults
- it separates operator and participant workspaces clearly
- it has explicit empty and loading-state structures
- it frames Relay as a serious ACP implementation rather than a generic chat product

The current surface is still underpowered in:

- hierarchy
- motion
- compositional confidence
- density control in operator inspection views

The skill is useful at the principle level, not the literal implementation level. Large parts of it assume React, Next.js, Tailwind, and Framer Motion. Relay is currently plain HTML, CSS, and JavaScript.

## Principles to adopt

Adopt these directly:

- stronger typography discipline for titles, secondary labels, and dense operator content
- anti-purple color calibration and single-accent restraint
- explicit loading, empty, and error states as first-class design surfaces
- tactile interactions using `transform` and `opacity`, not layout-thrashing animation
- less card overuse in dense operator views, with more use of dividers, spacing, and grouped sections
- stronger asymmetry above mobile while preserving strict single-column collapse on small screens

## Principles to adapt

Adapt these selectively:

- bento-like grouping for ACP-specific modules such as operator overview, export summaries, and digest modules
- motion sequencing through CSS transitions and very light JS, not Framer orchestration
- materiality through the existing warm palette and restrained glass treatment, not cold SaaS minimalism
- premium interaction feedback through small hover/active transitions, not theatrical motion systems

## Principles to reject

Reject these for the current Relay stack:

- React/Next/Tailwind requirements
- Framer-specific choreography requirements
- over-styled premium SaaS tropes that make ACP look like a design exercise
- visual moves that weaken operator trust or civic seriousness
- ornamental motion that competes with information clarity

## UI upgrade map

### 1. Topbar

Improve:

- stronger typographic contrast between eyebrow, title, and summary
- better asymmetry between identity block and mode/status controls
- slightly more intentional status-chip hierarchy

Avoid:

- over-branding the header into a splash hero

### 2. Cycle navigator

Improve:

- denser but cleaner list treatment
- stronger selected-state contrast
- lighter use of full card containers for every small unit

Avoid:

- dashboard-card repetition that makes the sidebar feel boxed-in

### 3. Operator detail panel

Improve:

- clearer overview first, then denser inspection layers
- section grouping by task rather than by repeated card shell
- better metric and export summaries using compact grouped modules

Avoid:

- visually identical treatment for all tabs and detail states

### 4. Participant digest and thread states

Improve:

- stronger distinction between digest item body, reason, and explanation
- clearer bridge-item treatment without looking alarmist
- better response and feedback transitions after release

Avoid:

- making digest items feel like social feed cards

### 5. Export and review surfaces

Improve:

- report/review modules that feel like briefing artifacts rather than raw dumps
- stronger rhythm between summary, metrics, and trace sections
- calmer visual density for long operator inspection surfaces

Avoid:

- over-decorated presentation styling that hides the actual evidence

## Implementation guidance

For the current stack, the best visual upgrades are:

- CSS-only hierarchy and spacing improvements first
- selective component refactors in the operator surface second
- only lightweight JS interaction changes where they clarify use

Do not migrate frameworks to chase visual polish.
