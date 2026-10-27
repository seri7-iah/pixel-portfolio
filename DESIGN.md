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

## Characters (all original)
Original characters only. Never use Minecraft/Mojang characters, skins, mobs or lookalikes. Take only the general blocky 8-bit style. Each zone has a fixed cast; creatures never leave their own ground strip.

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
- **Starmote**, 16x16: tiny floating star-jelly with a four-point star core inside a soft translucent body and a few violet glints. Drifts in place. Void only.

### Shared sky
- **Emberwing (dragon)**, 32x32: friendly teal and amber dragon, rare flyover about every 40 seconds, can perch on the signpost, breathes harmless sparkles. Not black, no purple eyes. Not part of any zone's roster; it crosses Home.

### Deferred (not in the current world plan)
Lunabun, Puffcloud, Gemmite, Deepwatcher and Glowmoth are drafted but unplaced. They are not part of the four-zone roster above and stay out until a later phase finds a home for them.

## Facing rule
- Every creature sprite is drawn in side view facing RIGHT. Moving left flips only the sprite canvas with `scaleX(-1)`; the shadow, wrapper and any label stay unflipped.
- The last facing is kept when a creature stops.
- Floating creatures (Ashwisp, Gloamer, Starmote) follow the same rule: they face their movement direction and keep the last facing while hovering.
- The one exception is controlled Pix. While the player controls him he uses eight directions: S front, W back, A/D side, and WD/WA/SD/SA angled. Opposite keys on either axis keep the previous view, and releasing control returns him to side view.

## Roster limits and zones
- Max 7 mobs plus the dragon on desktop; max 4 mobs on phones, and max 2 per section on phones.
- Creatures only wander inside their own section's ground strip and only animate while their section is on screen. Off-screen zones freeze and do not tick.
- The planned cast is 10 creatures on desktop (Home 3, Cave 3, Ember 2, Void 2). That is more than the 7-mob cap, so the cap is enforced as a budget for awake/visible creatures, with off-screen zones frozen. Phase 2e-3 confirms the final desktop and phone picks; on phones one creature per zone (4 total) is the simplest way to respect both the total and per-section limits.

## Motion rules
- Sprites: CSS `steps()` on sprite sheets, or frame-swapped text-grid sprites. Walk frames advance from distance travelled, not from a timer.
- Floating creatures use a slow bob or hover instead of a walk cycle: Ashwisp bobs, Gloamer hovers low, Starmote drifts in place.
- Transitions: pixel screen-wipes (stepped, not smooth) and dialogue-box reveals (typewriter text).
- `prefers-reduced-motion`: creatures stand still or hold a single hover frame, no flyover, transitions become instant fades. Control still works in short discrete steps.
- A visible "Pause creatures" toggle and a "Skip intro" button. Pause everything when the tab is hidden.

## Accessibility
Real content stays in normal HTML. The game layer is decorative (`aria-hidden`). Everything reachable by Tab with a visible focus outline. The character control also has a keyboard button ("Play as Pix").
