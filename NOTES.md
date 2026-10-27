# NOTES.md

## Status
Phase 1e complete: bigger portrait hangs below a compact signpost on Home.

## Phase plan
- Phase 1 (layout/fonts): done.
- Phase 1b (design cleanup): done. One continuous night-sky world, text directly on the scene, signpost navigation, the DialogueBox is the only boxed element, no cards or panels.
- Phase 1c: done. Portrait frame added in About.
- Phase 1d: done. Portrait frame moved to Home; About is a single text column again.
- Phase 1e: done. Home uses a right column for the signpost + 260px portrait; moon moved clear; walking strip kept open.
- Phase 2a: sprite system + hero Pix + mob Gloop.
- Phase 2b: click-to-control with WASD + other mobs.
- Phase 2c: Emberwing dragon.
- Phase 3: transitions, Press Start screen, theme toggle (Night/Cave/Day).
- Phase 4: content and project links.
- Phase 5: polish and deploy.

## Design direction
A distinctive 8-bit WORLD, not a webpage of boxes. Everything is one continuous scene and text sits directly on it. Original characters and art only, never Minecraft/Mojang lookalikes.

## Built in Phase 1e
- Home is a two-column layout now: POP title, copy and Guide dialogue on the left, and one right column with the signpost on top and the portrait hanging underneath it. Both right-side props share the same center axis.
- Portrait is 260px wide on desktop (~341px tall with the frame) and 160px on phones. The wooden post, stepped shadow and 3:4 photo window are unchanged. `/profile.jpg`, the fallback silhouette, alt text "Portrait of POP" and natural photo rendering are unchanged.
- Signpost reduced to about 80%: 288px wide and 200px tall on desktop, links 40px tall, and 256px wide on phones.
- Right column has an 88px top inset on desktop so the moon (now in the top-right corner) cannot sit behind the signpost or frame. Below 1024px the existing responsive moon sits clear above the centered signpost.
- Home title and copy were split into `.home__title` and `.home__copy` so the phone order can be: header, compact signpost, title, centered portrait, copy, dialogue.
- Home padding-bottom is 320px: content ends 160px above the 160px ground, leaving a clear sky walking strip. The frame is also above the hill and tree silhouettes.
- About is unchanged from 1d: single text column, no photo, POP dialogue kept.
- No characters, sprites, animation, transitions or theme toggle added. `npm run build` and `npm run lint` pass.

## Built in Phase 1d
- Moved `PortraitFrame` from About to Home, then sized it at 160px on desktop and 128px on phones in a third column. (Superseded by 1e.)
- Home collapsed to one column at 1024px and below.
- About became a single text column with the POP DialogueBox and Profile/Skills text.
- Verified the photo path and alt text; the missing-photo silhouette fallback was made scalable with a percentage clip-path.

## Built in Phase 1c
- Added `src/components/PortraitFrame.jsx`: a single wooden picture frame with a plain 8px wood border, 4px dark inner lip, stepped `box-shadow` and a small wooden post plus nail above it. It is the only framed element besides the DialogueBox.
- The frame loads `/profile.jpg` from `public/`. If the file is missing or fails to load, it shows a CSS pixel silhouette with "YOUR PHOTO HERE" so the layout still holds.
- Photo styling: `object-fit: cover`, fixed 3:4 window, `image-rendering: auto` so the photo stays natural (the global pixelated image rule is overridden). Alt text is "Portrait of POP".
- Kept the DialogueBox paragraphs on `--ink` by scoping the muted copy rule to direct `scene-copy` children.

## Built in Phase 1b
- Rebuilt `src/App.jsx` as one scene: night sky and ground at Home, a Projects cave underneath, then a lower night ledge for About/Contact.
- Removed `Panel` and `Card`. `DialogueBox` is now the only boxed component.
- Replaced the grouped nav buttons with a wooden signpost in Home. Four arrow-shaped signs link to Home, Projects, About and Contact; Tab reaches each link and the global 4px focus outline stays visible.
- Added CSS-only world scenery: pixel moon and stars, hard-edged clouds, stepped hills, blocky trees, grass/dirt ground, cave ceiling and stalactites, torches, crystals, chest and torch-lit sign.
- Projects are three unboxed cave objects: a crystal, a chest and a sign. Each keeps its project name visible and reveals a short label on hover or keyboard focus.
- Home, About and Contact copy sits directly on the scene. No panels, cards or readability bands were added.
- Added scene tokens for clouds, moon shading, hills, trees, cave rock and wood. Cave CSS variables now apply to `.scene--cave` instead of the old `.area--cave`.
- Restyled `PixelButton` as an unboxed text action with an underline and pixel marker.
- Kept the 360px/desktop layouts, 16px minimum body text, keyboard access and `prefers-reduced-motion` guard. No animation, transitions, sprites or theme toggle were added.

## Next
Phase 2a: sprite system, hero Pix and mob Gloop. Fixes to remember in Phase 2a: make the ground strip taller (about 96px on desktop), keep the dialogue box off the walking area, keep stars away from the text, and keep the Home portrait above the walking area.

## Known issues
- `public/profile.jpg` still does not exist in the repo, so the pixel "YOUR PHOTO HERE" placeholder shows until the photo is added.
- The signpost lives only in Home. About/Contact have no persistent nav; Contact includes a return link to the top.
- Cave project objects are placeholders and all point to `#contact` until real project URLs exist.
- All copy is placeholder text. There are no real contact details, project links or profile content yet.
- `index.html` is still hard-set to `data-theme="night"`; the DESIGN.md first-load `prefers-color-scheme` behavior is deferred to Phase 3.
- Fontsource imports use Latin subsets. Add more subsets later only if non-Latin copy is needed.
- The scene has not been checked in a browser yet; visual spacing at exactly 360px is the first thing to inspect.

## Decisions
- JavaScript, not TypeScript. Original CSS pixel art only; no downloaded or third-party art.
- Fonts are installed via npm (`@fontsource/press-start-2p`, `@fontsource/atkinson-hyperlegible`), never downloaded from the internet.
- One continuous world beats four boxed sections. Text sits on the scene; only character speech gets a border.
- The site keeps one visible border treatment: a 4px solid border on `DialogueBox` (including its header divider). The portrait frame is the one other framed object, as a wooden picture frame. Everything else uses unboxed shapes, backgrounds and stepped `box-shadow` layers.
- Theme colors are CSS variables; composite pixel shadows are written directly in component CSS so scene-local variables recompute correctly.
- Home keeps one shared right column for navigation and the portrait instead of a third middle column. The moon owns the top-right sky; the walking strip stays empty of UI.

## Lessons
- Fontsource keeps self-hosted fonts inside the bundle and the Vite build fingerprints them automatically.
- Scoping theme tokens to `.scene--cave` keeps the Cave palette on Projects without changing the root theme.
- Lightweight pixel scenery is practical with `clip-path` stepping, `box-shadow` blocks and layered absolutely positioned spans; no image pipeline is needed.
- The global `img { image-rendering: pixelated }` rule must be overridden per image when a real photo should stay natural.
- Percentage `clip-path` shapes scale with the box; px-based ones do not, so the placeholder silhouette uses percentages for its phone size.
- `display: contents` lets the desktop right-column stack become individual grid items on phones without duplicating markup.



