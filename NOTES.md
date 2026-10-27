# NOTES.md

## Status
Phase 2b-fix3 complete: Pix and every wandering creature (Gloop, Foxel, Mossling and both Bonemoss variants) are side-view sprites facing right, and all of them use the shared delta-time ground-motion system with distance-driven animation. Only a left-moving sprite canvas flips; shadows, bodies and labels never do.

## Phase plan
Original characters only, never Minecraft lookalikes.

- Phase 1 (layout/fonts): done.
- Phase 1b (design cleanup): done. One continuous night-sky world, text directly on the scene, signpost navigation, the DialogueBox is the only boxed element, no cards or panels.
- Phase 1c: done. Portrait frame added in About.
- Phase 1d: done. Portrait frame moved to Home; About is a single text column again.
- Phase 1e: done. Home uses a right column for the signpost + 260px portrait; moon moved clear; walking strip kept open.
- Phase 2a: done. Sprite system, hero Pix and mob Gloop wander the Home ground. The 16x32 Pix redesign was finished in 2b-fix2.
- Phase 2b: done. Click/tap-to-control Pix with WASD/arrows, plus Mossling and Foxel.
- Phase 2b-fix2: done. Reduced-motion note and "Play anyway", new 16x32 Pix, rebuilt Mossling, per-section ground strips and creature zones, Bonemoss in the Projects cave.
- Phase 2b-fix3: done. Side-view Pix plus side-view Gloop, Foxel, Mossling and both Bonemoss variants on the shared motion system.
- Phase 2b-2: Lunabun, Puffcloud, Glowmoth.
- Phase 2c: Emberwing dragon.
- Phase 2d: cave mobs (Gemmite, Deepwatcher) in the Projects cave.
- Phase 3: transitions, Press Start screen, theme toggle (Night/Cave/Day).
- Phase 4: content and project links.
- Phase 5: polish and deploy.

## Design direction
A distinctive 8-bit WORLD, not a webpage of boxes. Everything is one continuous scene and text sits directly on it. Original characters and art only, never Minecraft/Mojang lookalikes.

## Built in Phase 2b-fix3 (part 2)
- **Facing rule everywhere:** Gloop, Foxel, Mossling and both Bonemoss variants are redrawn in side view facing right. Moving left flips only the sprite canvas (`scaleX(-1)`); the shadow, body wrapper and any label stay outside the flip. Facing follows the actual x movement, so stopping keeps the last facing and vertical movement never turns a creature toward the viewer.
- **Shared motion:** `Critter.jsx` no longer has its own fixed-fps walk, linear step or `performance.now()` hop. It uses `groundMotion.js` (velocity easing, arrival slowdown, lane clamp, distance-driven `walkStep`, pixel snapping) and `useIdleAnimation.js` for breathing and blinking. Frames advance from distance travelled, so feet stop when a creature is blocked and speed changes do not retime the walk.
- **Gloop:** rebuilt as a 16x16 side-view jelly blob with the eye on the facing side. Six hop frames (squat, launch, air, air, descend, land) squash and stretch the body; the lift curve raises the body and shrinks the shadow to 70% at the top of the hop. Two idle frames plus two blink frames.
- **Foxel:** new 16x16 side-view fox with the tail and white tip behind, one clean outline around the silhouette, 2 idle frames (ear twitch and tail sway), 2 blink frames and a 4-frame trot with lifted paws.
- **Mossling:** rebuilt 16x32 side view. The head and tunic sit one column ahead of the legs for the forward lean. Leaf sprout, one tired eye, hanging front and back arms swinging in opposite directions, torn ochre tunic, 8-frame shamble, 2 idle and 2 blink frames.
- **Bonemoss:** both variants rebuilt 16x32 side view with a bone skull, one glowing teal eye on the facing side, dark mouth line, mossy shoulder, ragged slate cloth, 8-frame shamble, 2 idle and 2 blink frames. The dark variant keeps its shoulder crystal, now on the front shoulder so it reads in profile.
- **Feet and shadows:** back feet use the darker shade and front feet the lighter one so the legs read when they cross. Every creature keeps the stepped oval shadow; only Gloop changes its scale, and only while airborne.
- Roster, per-section zone freezing, pause, reduced-motion behavior and `aria-hidden` are unchanged. `npm run build` and `npm run lint` pass.

## Built in Phase 2b-fix3 (part 1)
- **Facing rule:** every sprite is drawn in side view facing right. A left-moving creature flips only its sprite canvas with `scaleX(-1)`; the hint text and labels sit outside that canvas and never flip. Stopping keeps the last facing, and vertical movement never turns a creature towards the viewer.
- **Pix side view:** replaced the front-view Pix with the supplied 16x32 side-view design. The art is assembled from separate part layers: head (including blink), green backpack, cream hoodie torso, two ink-blue arms with skin hands, darker back leg, front leg and separate boots. The idle frame matches the guide exactly. Idle has two breathing frames plus a slow blink every 4.2-7 seconds.
- **Pix walk:** 8 frames. The front leg and back arm swing together, the back leg and front arm swing the other way, moving from -3 to +3 source pixels. The swinging boot lifts one pixel, and the upper body dips one pixel twice per cycle. Frame 0 is the neutral pose, so walking starts cleanly from idle.
- **Shared motion system:** new `src/lib/groundMotion.js` holds delta-time velocity easing, arrival speed, distance-driven walk-frame stepping, lane clamping and integer pixel snapping. `Sprite.jsx` can now take a caller-controlled `frameIndex` as well as its old fixed-fps mode. `useIdleAnimation.js` is the reusable breathing/blink hook.
- **Feet and position:** walk frames advance from the distance actually moved (one full 8-frame loop per 8 source pixels of travel), not from a timer. Root positions are rounded to whole screen pixels before they are written to `transform`, and the canvas is still scaled 4x/3x with `image-rendering: pixelated`.
- **Shadow:** the stepped oval shadow stays under every creature. Pix shrinks it slightly (90%) while either boot is lifted; part 2 gave Gloop a distance-driven shadow shrink during hops.
- **Reduced motion:** control is no longer blocked by the reduced-motion freeze. Pix can still be taken over with the button, click or keys, but movement is the existing short discrete nudge and the walk/idle animation stays still. Wandering and blinking stay off until "Play anyway".
- `npm run build` and `npm run lint` pass.

## Built in Phase 2b-fix2
- **Reduced motion:** when the system has animations off, creatures stay still as before. A short note beside "Pause creatures" now explains why and a "Play anyway" button lets the visitor turn wandering on for the session. The note hides while creatures are paused. No other wandering, pause, tab-hidden or control behaviour changed.
- **Pix art:** replaced the old 16x16 art with the supplied 16x32 front-view blocky sprite (black hair, red-orange headband, cream hoodie, ink-blue sleeves, amber strap and boots). Idle frame 1 is the same drawing shifted down one pixel for the breathing bob. Walk frames 1 and 3 lift one leg two rows and swing the opposite arm two rows; frames 2 and 4 are neutral. CSS `scaleX(-1)` faces him the way he walks. Drawn at 4x on desktop and 3x on phones with `image-rendering: pixelated`.
- **Mossling art:** rebuilt on the same 16x32 body template. Moss-green skin, ochre tunic with a darker patch and a torn, jagged hem, dark brown tattered pants, tired eyes (dark slits with under-eye shading) and a small leaf sprout. Arms hang down. Same 2 idle + 4 walk frames as Pix, but a slower shamble (speed 8 desktop / 6 phone, walk 4 fps).
- **Section zones:** every section now owns a creature layer and a ground strip. Feet stay inside a 96px walking band (72px on phones) at the top of a 160px strip, and content keeps 280-320px of bottom padding so no creature can reach a heading, text block, dialogue box, portrait or the signpost. Each zone uses an IntersectionObserver; off-screen zones freeze their creatures and unsubscribe from the shared ticker, so they use no CPU.
  - Home, night grass: Pix (still controllable only while Home is on screen) and Gloop.
  - About, night grass: Foxel (desktop only).
  - Contact, night grass: Mossling.
  - Projects cave, dark stone floor with glowing teal crystal pixels: Bonemoss and the darker Bonemoss variant (variant desktop only).
- **Phone roster:** 360px shows Pix, Gloop, Mossling and one Bonemoss (4 total, max 2 per section). Foxel is hidden on phones because the Home pair, Contact and the cave each need their creature; the About strip is therefore empty on phones.
- **Bonemoss:** original 16x32 skeleton-zombie hybrid. Square bone-grey skull with two 2px glowing teal eyes and a dark mouth line, plain bone torso with no ribcage pattern, moss patches on the shoulders and legs, a ragged slate-green cloth around the waist, slouched one row into the shoulders, arms hanging down and no weapon. Idle 2 + walk 4 frames built with the same leg-lift/arm-swing helper as Pix, at 7/6 speed and 4/3 fps for a slow shamble. The second variant uses darker bone greys and a 2x2 teal crystal on one shoulder.
- **Ground/footer changes:** the old single page-bottom `lower-ground` is gone. About and Contact add their own night-grass strips; the Projects `::after` floor is now a real `cave-floor` element with a stone band and crystals. The footer sits on a dirt background so it continues the Contact strip instead of showing sky under it.
- `npm run build` and `npm run lint` pass.

## Built in Phase 2b
- `src/components/PixHero.jsx` is Pix's home now: wandering and controlled mode share one position ref and one rAF subscription. Clicking Pix or the header button "Play as Pix" takes control. Pix walks to WASD/arrow input inside the grass lane, uses walk frames while moving, idle frames when still, and flips to face the movement direction. His position is clamped to the lane so he cannot reach the dialogue box, portrait or signpost.
- Control releases on Esc, on any pointer press outside Pix (and outside the control button), or after 20 seconds without input. Pressing "Pause creatures" also releases control. Key listeners only exist while controlled, so arrows and WASD scroll/navigate normally the rest of the time; only controlled movement calls `preventDefault`.
- The header now has a native "Play as Pix" button (`aria-pressed`, visible global focus outline) and a visually hidden `role="status"` region that announces "Controlling Pix" / "Pix is wandering". Pix himself stays `aria-hidden`; a small hint above him shows "YOU'RE IN CONTROL - WASD / ARROWS - ESC TO RELEASE". The hint aligns left/right near the edges and adds a tap line on touch devices.
- Touch uses pointer type: tapping the ground while in control walks Pix to that point; tapping elsewhere releases him and lets the tap behave normally. No on-screen D-pad.
- With `prefers-reduced-motion`, Pix never wanders. Control moves him in short discrete steps (key presses) or short spaced tap steps, always on the idle frame.
- Mossling is a new original 16x32 shambler with moss-green skin, patched brown rags, forward arms and a leaf sprout. 2 idle + 4 walk frames; the head blinks and the leaf/arms sway. Foxel is a new original 16x16 square fox with an orange body, white muzzle and white-tipped tail. 2 idle + 4 trot frames. Neither copies Minecraft/Mojang colors, clothes or faces.
- Roster: phones get Pix, Gloop and Mossling (3); desktop adds Foxel (4). Foxel trots faster than Mossling. All use the shared ticker, which stops while the tab is hidden. The pause toggle freezes every creature, including Pix.
- All mobs except Pix sit under `pointer-events: none`; only Pix's sprite catches clicks for control. `npm run build` and `npm run lint` pass.

## Built in Phase 2a
- `src/lib/pixelArt.js` holds all art as 16x16 text grids with per-character palettes. Pix has 2 idle frames and 4 walk frames drawn facing right. Gloop has 2 idle frames (blink) and 2 hop frames (stretched lift, wide landing). Everything is hand-drawn for this project; no Minecraft/Mojang shapes or names.
- `src/components/Sprite.jsx` draws a grid on a 16x16 canvas (each character is a color key, "." transparent), swaps frames at a fixed fps and scales with CSS at 4x on desktop and 3x on phones. `image-rendering: pixelated` keeps the squares crisp.
- `src/lib/ticker.js` is one shared `requestAnimationFrame` loop for every sprite and creature. It stops when nothing subscribes and while the tab is hidden.
- `src/lib/useMotion.js` provides `useSpriteScale()` (4/3) and `usePrefersReducedMotion()`.
- `src/components/Critter.jsx` + `CreatureScene.jsx`: each creature picks a random spot inside the grass lane, walks there, pauses 2.6-4.8s, then repeats. It flips with CSS scaleX when it turns around. Gloop also gets a hop lift on the walk; the shadow stays on the ground.
- Wandering is written straight to `style.transform` from the ticker, so only mode/facing changes re-render React.
- "Pause creatures" toggle sits in the Home header (native button, `aria-pressed`, 44px hit area, visible focus). Pausing or `prefers-reduced-motion` freezes both creatures on idle frame one. The creature layer is `aria-hidden` with `pointer-events: none`, so it never blocks page content.
- Home ground: the grass band is now 96px on desktop (72px on phones) inside the same 160px ground, so Pix and Gloop have a lane to walk in. The content still ends 160px above the ground top, keeping the dialogue box and portrait out of the walking area.
- Stars moved away from the text: Home stars now sit in the top 64px band (plus two far-side dots) and the Home top padding grew from 32px to 80px to keep that band clear of the header. Lower-world stars moved into the gap between the cave lip and About.
- No click-to-control, WASD, other mobs, dragon, transitions or theme toggle yet. `npm run build` and `npm run lint` pass.

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
Phase 2b-2: Lunabun, Puffcloud and Glowmoth, using the same side-view/facing and ground-motion rules. Do not add the dragon or the cave mobs yet.

## Known issues
- Part 2 has only been checked with Node art/width checks and a production build, not in a browser. The first screenshot pass should look at the side-view readability of all four creatures, the flipped facing on left moves, the Gloop squash/stretch and shadow shrink, the Foxel outline at 4x, the Mossling/Bonemoss leg crossing, and 360px text clearance.
- Walk and hop timing is now distance-driven. The tuning values are the `stride` props in `CreatureScene.jsx` (Gloop 6, Foxel 4, Mossling 5, Bonemoss 5 source pixels per full cycle) plus each creature's `speed`. Adjust those rather than frame rates if a foot slides.
- The idle breathing bob moves the humanoid upper body down one pixel while the feet stay planted. Check that the tunic/cloth hem does not pinch at the waist in the screenshot.
- `DESIGN.md` still describes the old 4-walk-frame Pix and the old front-view Gloop, Foxel, Mossling and Bonemoss; it has not been updated yet.
- The Foxel silhouette is dense at 16x16 (tail, head and body all touch). If it reads as one blob at 4x, separate the tail by one more source pixel in `composeFox`.
- Gloop's eye direction comes from the sprite flip, so it always looks the way the blob faces. Check that the pupil still reads at 3x on phones and that the hop lift (10px desktop, 6px phone) does not look like floating.
- Creature grounds are now four stacked ledges. Check the About strip in the screenshot: its dirt bottom meets Contact's night sky, which is meant to read as a terrace but may need a rock lip if it looks like floating ground.
- Creatures can overlap and walk through each other; there is no collision yet.
- The pause toggle is global across all four zones, disables "Play as Pix" and releases control, on purpose.
- "Play anyway" is session-only and has no off switch of its own; the system preference still controls the note and it is not remembered after a reload. If the system setting flips back to reduce-motion during the session, the override keeps creatures moving.
- Phones show Pix, Gloop, Mossling and one Bonemoss (4 total). Foxel is desktop-only so the About ground is empty on phones; the Bonemoss variant is also desktop-only.
- Verify the 16x32 heads (Pix, Mossling, Bonemoss) clear the dialogue box, portrait, signpost and cave objects at 360px in the screenshot; desktop clearance is 84px and phone clearance is 64px.
- Tap-to-walk uses pointer type, not a D-pad, and only moves Pix while he is controlled and Home is on screen. Tapping elsewhere releases control before the normal tap action runs.
- `public/profile.jpg` still does not exist in the repo, so the pixel "YOUR PHOTO HERE" placeholder shows until the photo is added.
- The signpost lives only in Home. About/Contact have no persistent nav; Contact includes a return link to the top.
- Cave project objects are placeholders and all point to `#contact` until real project URLs exist.
- All copy is placeholder text. There are no real contact details, project links or profile content yet.
- `index.html` is still hard-set to `data-theme="night"`; the DESIGN.md first-load `prefers-color-scheme` behavior is deferred to Phase 3.
- Fontsource imports use Latin subsets. Add more subsets later only if non-Latin copy is needed.

## Decisions
- JavaScript, not TypeScript. Original CSS pixel art only; no downloaded or third-party art.
- Fonts are installed via npm (`@fontsource/press-start-2p`, `@fontsource/atkinson-hyperlegible`), never downloaded from the internet.
- One continuous world beats four boxed sections. Text sits on the scene; only character speech gets a border.
- The site keeps one visible border treatment: a 4px solid border on `DialogueBox` (including its header divider). The portrait frame is the one other framed object, as a wooden picture frame. Everything else uses unboxed shapes, backgrounds and stepped `box-shadow` layers.
- Theme colors are CSS variables; composite pixel shadows are written directly in component CSS so scene-local variables recompute correctly.
- Home keeps one shared right column for navigation and the portrait instead of a third middle column. The moon owns the top-right sky; the walking strip stays empty of UI.
- Sprites are canvas-backed text grids (16x16 critters and 16x32 people) so a new mob only needs frames plus a palette. Wandering lives in `Critter`; movement is written to `style.transform` and never through React state, so the frame rate stays flat. A future controlled mode can sit on the same component.
- Each section owns its creatures and ground strip. The zone uses one IntersectionObserver to freeze off-screen creatures, and the walking band is measured from the section's bottom so the same lane maths works for every strip.
- All side-view characters are built from part compositors on their text grids. Pix keeps its layered part stamps; Gloop uses row spans so it can squash and stretch; Foxel fills blocks and outlines the silhouette once; Mossling and Bonemoss use rectangular limbs plus a stamped head, leaf or skull. The old front-view body template is gone.
- Pix's parts are precomposed into 16x32 frames at module load rather than rendered as separate DOM layers. The limbs still move independently in the art pipeline, and the runtime keeps one crisp canvas per creature.
- Boots are a separate layer from the pants, so the body can bob without lifting the planted foot.
- Walk animation is a pure function of distance travelled. Speeds and frame rates can change without retuning the animation, and off-screen or paused creatures do not advance.
- Facing flips only the sprite canvas. The hint and any future label stay outside the flipped element.
- The star field is kept out of the text by owning the top band (80px Home padding) and the far gutters instead of scattering dots behind the copy.

## Lessons
- Fontsource keeps self-hosted fonts inside the bundle and the Vite build fingerprints them automatically.
- Scoping theme tokens to `.scene--cave` keeps the Cave palette on Projects without changing the root theme.
- Lightweight pixel scenery is practical with `clip-path` stepping, `box-shadow` blocks and layered absolutely positioned spans; no image pipeline is needed.
- The global `img { image-rendering: pixelated }` rule must be overridden per image when a real photo should stay natural.
- Percentage `clip-path` shapes scale with the box; px-based ones do not, so the placeholder silhouette uses percentages for its phone size.
- `display: contents` lets the desktop right-column stack become individual grid items on phones without duplicating markup.
- One shared rAF ticker (instead of a timer per sprite) makes "pause when the tab is hidden" a single rule and keeps two characters cheap.
- A text-grid art file is fast to iterate on: lengths can be checked and printed as ASCII in Node, so no browser is needed to proof the sprites.
- Give the back foot the darker shade and the front foot the lighter one; the two legs stay readable even when a side-view walk crosses them. Starting the legs one row under the hem hides the hip joint without extra art.
- Precomposing layered parts into text-grid frames keeps the 16x32 contract while still letting each limb move on its own. Keeping the boots out of the bob was the fix that finally kept the feet planted.
- Exponential velocity easing (`1 - exp(-rate * dt)`) is frame-rate independent and gives both the start ramp and the stop glide without a separate acceleration state machine.
- Advancing a walk phase with `distance / stride` is simpler than syncing a timer to speed, and it naturally freezes the feet when a creature is blocked or paused.
- Per-section IntersectionObservers mean the shared ticker really does stop when every zone is off screen; only Pix's control state and each zone's ResizeObserver stay alive.



