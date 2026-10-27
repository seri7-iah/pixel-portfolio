# NOTES.md

## Status
Phase 1 complete: layout, fonts, theme variables, pixel primitives and the four world-area sections.

## Built in Phase 1
- Removed the Vite demo UI and unused demo assets. New page shell in `src/App.jsx` + `src/App.css`.
- Self-hosted fonts through `@fontsource` packages, imported in `src/main.jsx`:
  - Press Start 2P (headings only).
  - Atkinson Hyperlegible 400/700 plus italics (body, 18px base, 16px minimum).
- Theme tokens in `src/index.css` for Night (default), Cave and Day via `[data-theme]`. Cave is also applied locally to the Projects area with `.area--cave`.
- 4px pixel scale (`--px` and spacing tokens), 4px borders, hard stepped `box-shadow` layers, no blur and no rounded corners.
- Reusable components: `PixelButton`, `DialogueBox`, `Panel`, `Card` in `src/components/`.
- Four world areas with placeholder copy only: Home, Projects (Cave look), About, Contact.
- Level-style nav with numbered links. Keyboard Tab reaches every nav link, button and in-page link; focus uses a 4px outline.
- Responsive layout for 360px phones and desktop. `prefers-reduced-motion` guard included; no animations or transitions were added.
- Replaced the default Vite favicon with an original pixel tile.

## Next
Phase 2: build the Night/Day theme toggle only. Wire `data-theme` to a sun/moon button, initialize the first visit from `prefers-color-scheme`, persist the choice, and keep Cave locked to the Projects area. No theme toggle exists yet.

## Known issues
- `index.html` is hard-set to `data-theme="night"`; the DESIGN.md preference for `prefers-color-scheme` on first load is deferred to Phase 2.
- All copy and project links are placeholders. The only working controls are in-page anchor links.
- Fontsource imports use Latin subsets. Add more subsets later only if non-Latin copy is needed.

## Decisions
- JavaScript, not TypeScript. Original characters and art only.
- Fonts come from npm packages, not `public/fonts`.
- Theme colors are CSS variables; composite pixel shadows are written directly in component CSS so Cave-local variables recompute correctly.

## Lessons
- Fontsource keeps self-hosted fonts inside the bundle and the Vite build fingerprints them automatically.
- Scoping theme tokens to `.area--cave` lets one section keep the Cave palette without changing the root theme.
