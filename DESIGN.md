# DESIGN.md: Pixel World Portfolio

## Vibe
An 8-bit adventure world. Blocky, chunky, cozy. Original characters only: never Mojang/Minecraft assets or lookalikes (no creeper-, enderman- or Steve-like designs).

## Pixel rules
- Base pixel unit: 4px. All borders, shadows and spacing are multiples of it.
- Sprites are drawn on a small grid (16x16; dragon 32x32) and scaled up 4x (3x on phones).
- Always use `image-rendering: pixelated`. No blur, no rounded corners, no soft shadows. Use stepped shadows.

## Fonts
- Headings only: "Press Start 2P" (self-hosted, OFL).
- Body, buttons, paragraphs: "Atkinson Hyperlegible" (self-hosted, OFL), at least 16px.

## Themes (CSS variables, swapped via data-theme on the root)
**Night** (default): sky #0b1026 / #1b2250, stars #f4e9c1, moon #f0ead2, grass #2f6b4a, dirt #3b2a1f, ink #f4ecd8, panel #141a3a, accent amber #ffb347
**Cave**: bg #14110f, stone #2a2623 / #3d3731, crystal #5be3d0, torch #ffb347, ink #f4ecd8, panel #1e1a17
**Day**: sky #8fd3ff / #cdeeff, cloud #ffffff, sun #ffd447, grass #5fbf5a, dirt #8a5a3b, ink #1a1a2e, panel #f4ecd8, accent #e0791a
- Night and Day are the same scene with swapped colors (a sun/moon toggle button). Cave is used for the Projects area.
- The initial theme follows `prefers-color-scheme`. Contrast text/background at least 4.5:1.

## Characters (all original, 4 walk frames + 2 idle frames unless noted)
- **Hero "Pix"**: blocky explorer, brown hair, teal jacket, amber backpack. Wanders on its own. Click/tap it to take control (WASD/arrows; Esc releases).
- **Gloop**: round jelly blob with one big eye. Hops.
- **Foxel**: square fox with a white tail tip. Trots.
- **Lunabun**: moon bunny. Hops. Night theme.
- **Puffcloud**: tiny cloud critter that drifts across the sky.
- **Glowmoth**: glowing moth that flutters near lanterns. Night/cave.
- **Gemmite**: crystal beetle that scuttles. Cave.
- **Mushling**: small mushroom with legs. Cave and day.
- **Emberwing (dragon, 32x32)**: friendly teal and amber dragon. Rare flyover every ~40s, can perch on the nav, breathes harmless sparkles. Not black, no purple eyes.

## Motion rules
- Sprites: CSS `steps()` on sprite sheets, or frame-swapped text-grid sprites.
- Transitions: pixel screen-wipes (stepped, not smooth) and dialogue-box reveals (typewriter text).
- Max 4 mobs on phones, 7 + dragon on desktop. Pause everything when the tab is hidden.
- `prefers-reduced-motion`: mobs stand still, no flyover, transitions become instant fades.
- A visible "Pause creatures" toggle and a "Skip intro" button.

## Accessibility
Real content stays in normal HTML. The game layer is decorative (`aria-hidden`). Everything reachable by Tab with a visible focus outline. The character control also has a keyboard button ("Play as Pix").