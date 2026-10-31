# DESIGN.md: Pixel World Portfolio

## Vibe
An 8-bit adventure that gets deeper as you scroll. Cozy and starry at the top, then steadily warmer, stranger and quieter further down. Original characters and art only: never Mojang/Minecraft assets, names or lookalikes (no Enderman, Creeper, Ghast, Piglin, Magma Cube or Blaze lookalikes). Taking only the general blocky 8-bit style is fine.

## World order (one continuous scroll)
The page is one scroll, not four pages. Each section is its own world with its own palette scope, ground strip and creature zone, so going down always feels like going deeper.

| # | Section | World | Palette | Ground strip |
| --- | --- | --- | --- | --- |
| 1 | Home | Night sky with stars, a moon and grassland | Night (Day optional) | Grass |
| 2 | Projects | Cave with stone, torches and crystals | Cave | Cave stone |
| 3 | About | Ember world, a fiery underground | Ember | Ash and hot rock |
| 4 | Contact | Void world, floating rock in a near-black violet sky | Void | Pale cream rock |

- Home is the only place the Night/Day toggle applies. Projects, About and Contact keep their own palette permanently.
- Palettes are scoped: Night/Day live on the root, while Cave, Ember and Void are applied locally to their section (`.scene--cave`, `.scene--ember`, `.scene--void`). A section can never leak its colors into another.
- Scroll order is also the story order: arrival, work, person, invitation. Keep it.

## Pixel rules
- Base pixel unit: 4px. All borders, shadows and spacing are multiples of it.
- Sprites are drawn on a small grid (16x16 for critters, 16x32 for people, 32x32 for the dragon) and scaled up 4x (3x on phones).
- Always use `image-rendering: pixelated`. No blur, no rounded corners, no soft shadows. Use stepped shadows.

## Fonts
- Headings only: "Press Start 2P" (self-hosted, OFL).
- Body, buttons, paragraphs: "Atkinson Hyperlegible" (self-hosted, OFL), at least 16px.

## Palettes (CSS variables, scoped per world)
**Night** (Home default): sky #0b1026 / #1b2250, stars #f4e9c1, moon #f0ead2, grass #2f6b4a, dirt #3b2a1f, ink #f4ecd8, panel #141a3a, accent amber #ffb347
**Day** (Home alternate): sky #8fd3ff / #cdeeff, cloud #ffffff, sun #ffd447, grass #5fbf5a, dirt #8a5a3b, ink #1a1a2e, panel #f4ecd8, accent #e0791a
**Cave** (Projects): bg #14110f, stone #2a2623 / #3d3731, crystal #5be3d0, torch #ffb347, ink #f4ecd8, panel #1e1a17
**Ember** (About): maroon-black rock, orange and yellow lava glow, grey ash. Required roles: background, rock face, rock shade, lava glow, hot core, ash, ink, panel, accent.
**Void** (Contact): near-black violet sky, pale cream floating rock, small violet glints. Required roles: sky, sky depth, rock face, rock shade, glint, ink, panel, accent.

- Ember and Void tokens, finalized in 2e-2:
  - Ember: bg #1a0b0c, rock #3a1a14 / #240d0c, rock light #4a221b, lava #ff7a1a, hot core #ffd447, ash #8a8078, ink #f4ecd8, panel #24100f, accent #ff8a2a, focus #ffd447.
  - Void: sky #07050f / #14081f, under #05030a, rock #e8dcc0 / #b8a88a, glint #b58cff, star #f4e9c1, ink #f4ecd8, panel #120a1c, accent #b58cff, focus #e8dcc0.
- Text/background contrast at least 4.5:1 in every palette. Ember and Void are dark palettes, so the ink stays warm cream and accent colors never sit on same-value glow.
- Night and Day are the same Home scene with swapped colors (a sun/moon toggle button). The initial theme follows `prefers-color-scheme`.

## Celestial Gate (Home frame and signpost)
The portrait frame and the Home signpost are one original set, built from hard 4px pixel art in a shared night palette. No wood, grain, nails, moss, chains or lanterns, and no stone/ore textures.

- **Palette** (root tokens, not swapped by Day): indigo `#171137`, deep indigo `#0d0924`, violet `#4b2f8c`, deep violet `#33205f`, lavender `#b9a3ff`, pale gold `#f2d68a`, deep gold `#a9843a`, star white `#f7f1df`, inner edge `#070512`, halo `#9b86e0`.
- **Art pipeline:** every grid lives in `src/lib/gateArt.js` and is rendered by `src/components/GatePixel.jsx` as one SVG `rect` per cell with `shape-rendering: crispEdges`, so the squares stay hard at any size. All gate art is decorative (`aria-hidden`).
- **Frame:** three indigo tones with a 4px pale-gold trim ring and a dark inner edge. A crescent crown with a star on each side sits above the window, a plus star fills each corner, a dotted constellation twinkles down each side, and two tiny planets hop around the perimeter in whole-pixel steps. A small crescent above the frame anchors two dotted star lines.
- **Signpost:** a slim spire of stacked pixel diamonds (violet/indigo with gold studs) under a crescent and star, with four floating star-tablets that keep the staggered left/right layout. Each tablet has a three-tone body, gold trim and a notched star point. Icons stay tinted per world: Home gold, Projects teal, About ember, Contact violet. The active tablet is lit (brighter body, full gold trim, hard 4px halo, twinkling plus/cross star marker).
- **Connection:** on the wide two-column layout the signpost spire ends on the frame's hanging crescent. The narrower layout puts the title between them, so the two pieces stack instead of joining.
- **Motion:** every gate animation uses `steps(1, end)`. Idle tablets bob on separate clocks and hover/focus is a single 2px hop plus a lavender halo. Reduced motion shows one still frame, and "Pause creatures" or a hidden tab stops all gate motion.

## Characters (all original)
Original characters only. Never use Minecraft/Mojang characters, skins, mobs or lookalikes. Take only the general blocky 8-bit style. Each zone has a fixed cast and creatures stay inside their own section. Emberwing is the one sky exception, but it still lives only in Contact.

### Home (Night)
- **Pix (hero)**, 16x32: square head 8x8, body 8x12, arms and legs 4x12, stiff swinging walk. Black hair, red-orange headband, cream hoodie with ink-blue sleeves, dark slate pants, amber boots, green backpack with amber strap. Side view has 2 idle + 2 blink frames and an 8-frame walk. Wanders on its own. Click/tap or the "Play as Pix" button takes control (WASD/arrows, Esc releases, 20 seconds idle releases); while controlled he walks in depth inside the lane, tap-to-walk goes to the tapped point, and he uses eight fixed views (side, front, back and both 3/4 angles).
- **Gloop**, 16x16: round teal jelly blob with one big eye. Six-frame hop with squash and stretch. Home only.
- **Foxel**, 16x16: square fox with a white tail tip and an outlined silhouette. Trots. Home only (moved here from About in 2e-3).

### Projects cave
- **Bonemoss** (two variants), 16x32: original skeleton-moss wanderer. Bone skull, single glowing teal eye, mossy shoulder, ragged slate cloth, slow shamble. The second variant is darker bone with a small shoulder crystal. Cave only.
- **Mossling**, 16x32: slow shambling blocky wanderer, moss-green skin, patched ochre rags, forward arms, leaf sprout. Spooky but friendly. Must not copy the Minecraft zombie's colors, clothes or face. Cave only (moved here from Contact in 2e-3).

### About (Ember)
- **Emberimp**, 16x16: small imp with tiny horns, orange eyes and a quick, twitchy walk. Chunky body, short legs, thin tail. Ember only. Must not copy a Piglin (no snout, no tusks, no gold) or a Magma Cube (not a segmented slime, no lava cubes).
- **Ashwisp**, 16x16: floating teardrop flame with a bright core and two or three ember pixels. Bobs in the air instead of walking. Ember only. Must not read as a Blaze (no rods, no orbiting parts) or a torch.

### Contact (Void)
- **Gloamer**, 16x32: tall hooded shadow with short thick arms, a wide bell-shaped hem and a single pale-violet eye slit. Hovers low over the ground instead of walking; the hem never shows legs. Void only. Must not look like an Enderman: no long thin limbs, no tall rectangular head, no purple particles, no teleporting.
- **Starmote**, 16x16: tiny floating star-jelly with a four-point star core inside a soft translucent body and a few violet glints. Drifts in place. Void only. Hidden on phones so Contact keeps two creatures.
- **Emberwing (dragon)**, 32x32: an obsidian-and-violet void dragon inspired by a jagged black dragon silhouette. Deep violet body lit by glowing purple cracks and an underbelly glow, tall black crystal spines down the back and tail, torn dark wings with luminous violet ribs and edges, swept horns, a sharp snout and an amber-violet tail tip. The one warm note is a large ember-orange eye with a short animated trail. It is original and deliberately not a Minecraft Ender Dragon lookalike (no plain blocky black body, no magenta eyes). Rare flyover every 25-45 seconds in Contact only: enters from one side, glides across the top sky band, lands on a pale floating rock ledge at the far end of the ground strip, rests about 5 seconds, then leaves. It never crosses Home or perches on the signpost. It is a special flyover outside the seven-mob budget.

### Deferred (not in the current world plan)
Lunabun, Puffcloud, Gemmite, Deepwatcher and Glowmoth are drafted but unplaced. They are not part of the four-zone roster above and stay out until a later phase finds a home for them.

## Facing rule
- Every creature sprite is drawn in side view facing RIGHT. Moving left flips only the sprite canvas with `scaleX(-1)`; the shadow, wrapper and any label stay unflipped.
- The last facing is kept when a creature stops.
- Floating creatures (Ashwisp, Gloamer, Starmote) follow the same rule: they face their movement direction and keep the last facing while hovering.
- Emberwing follows the same rule: the sprite wrapper flips with `scaleX(-1)` only when it is flying left, and it keeps its last facing on the perch. The perch, path and shadow do not flip.
- The one exception is controlled Pix. While the player controls him he uses eight directions: S front, W back, A/D side, and WD/WA/SD/SA angled. Opposite keys on either axis keep the previous view, and releasing control returns him to side view.

## Roster limits and zones
- Desktop: the full cast is 10 creatures (Home 3, Cave 3, Ember 2, Void 2) plus Emberwing in Contact. Emberwing is a special flyover outside the seven-mob budget. The 7-mob limit is an awake/visible budget, not a total-cast limit: off-screen zones freeze, so only one zone's cast is awake at a time (at most 3 creatures), plus Emberwing = 4. Even if two zone sentinels overlapped, the worst case would be 6 + Emberwing = 7. Confirmed in 2e-3.
- Phones: 4 regular creatures plus Emberwing, and max 2 per section. The phone cast is one per zone: Pix (Home), Bonemoss (Cave), Emberimp (Ember), Gloamer (Void), plus Emberwing in Contact, so Contact shows Gloamer and Emberwing. Gloop, Foxel, the dark Bonemoss, Mossling, Ashwisp and Starmote are desktop-only. Confirmed in 2e-3.
- Creatures only wander inside their own section's ground strip and only animate while their section is on screen. Off-screen zones freeze and do not tick. Emberwing is the sky exception: it flies only in Contact's top band and perches only on the Contact ground strip.

## Motion rules
- Sprites: CSS `steps()` on sprite sheets, or frame-swapped text-grid sprites. Walk frames advance from distance travelled, not from a timer.
- Floating creatures use a slow bob or hover instead of a walk cycle: Ashwisp bobs, Gloamer hovers low, Starmote drifts in place.
- Emberwing uses the shared ticker and `groundMotion.js` easing. Its four-frame wing flap runs only while flying; its two-frame perch idles with a slow tail sway. The first visit arrives 2.5-4.5 seconds after Contact comes on screen, then the flyover waits 25-45 seconds between later visits, rests about 5 seconds and only ticks while Contact is on screen.
- Transitions: pixel screen-wipes (stepped, not smooth) and dialogue-box reveals (typewriter text).
- `prefers-reduced-motion`: creatures stand still or hold a single hover frame, no flyover; Emberwing shows one still perched frame, and transitions become instant fades. Control still works in short discrete steps. "Pause creatures" freezes Emberwing as well.
- A visible "Pause creatures" toggle and a "Skip intro" button. Pause everything when the tab is hidden.

## Accessibility
Real content stays in normal HTML. The game layer is decorative (`aria-hidden`). Everything reachable by Tab with a visible focus outline. The character control also has a keyboard button ("Play as Pix").
