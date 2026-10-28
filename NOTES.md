# NOTES.md

## Status
Phase 3a-fix complete: the generic Motion fade/slide reveal is gone. Sections still trigger once at about 30% visibility, but the reveal is now original 8-bit game-UI motion: a 28 ms typewriter label with a block cursor, a gravity letter drop with one 3 px bounce, 450 ms clip-path wipes with a 4 px amber edge, and a centre-line dialogue box that types at 22 ms per character and ends on a blinking arrow. CSS owns the timeline; React state changes twice per section, never per frame or character. Screenshot review of 3a-fix (and the still-open 2c/2e and 3a passes) comes first, then Phase 3b (parallax with scroll-velocity effects).

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
- Phase 2b-fix4a: done. Eight-direction facing for Pix while the player controls him.
- Phase 2b-fix4b: done. Vertical depth movement for controlled Pix, with diagonal speed normalization and 2D tap-to-walk.
- Phase 2e-1: done. Documentation only. Four-world scroll, section palettes, new Ember/Void roster and the facing rule are written into `DESIGN.md` and `PRODUCT.md`.
- Phase 2e-2 part A: done. Ember and Void palettes, backgrounds, scenery and ground strips for About and Contact rebuilt into the richer pass.
- Phase 2e-2 part B: done. Home grassland and Projects cave palettes, backgrounds, scenery and ground strips rebuilt into the same richer pass. The earlier 2e-3 creature implementation is already in the tree and unchanged.
- Phase 2e-2 part C: done. Emberwing dragon added to Contact; 32x32 obsidian-and-violet art with ember-orange eyes, four-frame wing flap, 25-45 second flyover, five-second perch and reduced-motion still frame.
- Phase 2e-3 (earlier creature pass): done. Emberimp, Ashwisp, Gloamer and Starmote added; Foxel moved to Home and Mossling to the cave; desktop and phone rosters settled.
- Phase 2b-2 (superseded): Lunabun, Puffcloud, Glowmoth. Not in the four-zone roster; deferred until they have a place.
- Phase 2c: done as Phase 2e-2 part C. Emberwing now lives in the Void/Contact zone; the old signpost-perch plan is removed.
- Phase 2d (superseded): cave mobs Gemmite and Deepwatcher. The cave roster is fixed at Bonemoss x2 plus Mossling; deferred.
- Phase 3 (split): 3a and 3b.
- Phase 3a: done, then replaced by 3a-fix. The old one-shot Motion fade/slide is removed.
- Phase 3a-fix: done. 8-bit game-UI reveal: typewriter label, gravity letter drop, clip-path wipes with an amber edge, centre-line dialogue open, typed POP line and blinking arrow.
- Phase 3b: next. Parallax with scroll-velocity effects.
- Phase 3c: dither transitions between worlds.
- Phase 3d: depth meter.
- Phase 3e: Press Start screen and the Home-only Night/Day toggle.
- Phase 4: content and project links.
- Phase 5: polish and deploy.

## Design direction
A distinctive 8-bit WORLD, not a webpage of boxes. Everything is one continuous scene and text sits directly on it. Original characters and art only, never Minecraft/Mojang lookalikes.

The world now descends instead of repeating: Home night grassland, Projects cave, About Ember, Contact Void. Each section owns its palette scope and its own creature zone, and the cast per zone is fixed.

## Built in Phase 3a-fix (8-bit game-UI reveal)
- **Trigger reused, motion replaced:** `src/lib/reveal.js` no longer exports Motion variants. It now exports `useReveal(ref)`, a one-shot IntersectionObserver that adds `is-revealed` when about 30% of a section is visible. Tall phone sections can never reach 30%, so the threshold is lowered to whatever 90% of the viewport can cover, and it reconnects on resize. No section ever replays.
- **No Motion in the reveal:** `App.jsx` sections are plain `<section>` elements and the reveal components have no `motion` imports or variants. The whole reveal is CSS. The `motion` package stays in `package.json` but nothing in `src/` imports it now.
- **Label typewriter:** new `Typewriter.jsx` renders the full string in `.sr-only` and an `aria-hidden` layer of pre-split glyph spans. Each glyph is clipped in after `glyph * 28ms`, so no character ever re-renders React. A solid block cursor blinks and is scaled away 400 ms after the last glyph. Words keep `nowrap` wrappers so inline-block glyphs never break mid-word.
- **Heading drop:** new `DropHeading.jsx` splits the heading into word/glyph spans and keeps the full string in `.sr-only`. Every glyph falls 24px on `cubic-bezier(0.55, 0, 1, 0.45)` (slow start, accelerating), lands, bounces up 3px once on an ease-out, then settles. All keyframe offsets are whole pixels (-24, 0, -3, 0); the motion itself is continuous at 60 fps. Stagger is 45ms per glyph and the heading starts 160ms after the section reveal.
- **Wipes:** paragraphs, lists and blocks use a linear `clip-path` wipe over 450ms from left to right, plus a 4px amber vertical bar (`#ffb347`) that travels with the leading edge through `translateX`. Base delay is 320ms and each block starts 120ms after the previous one. Only text blocks carry the bar; links use the same wipe without it.
- **Dialogue box (About):** `DialogueBox` gains `typed`, `lines` and `revealIndex`. The box opens from its horizontal centre line outward with `clip-path: inset(50% ...)` over 250ms, then the line types at 22ms per character, then a stepped 12px down-arrow blinks. The Home Guide box uses the ordinary block wipe instead.
- **Links and signpost:** the signpost, cave objects and both `PixelButton` links wipe in on the same 120ms cadence right after their text. Hover and focus styles, DOM order, tab stops and the focus outline are untouched.
- **Reduced motion:** every hidden state and every animation lives inside `@media (prefers-reduced-motion: no-preference)`. With reduce set, nothing is clipped, nothing is delayed, no cursor or bar is drawn, and all text is visible immediately. Changing the preference mid-session updates it without a reload.
- **Fallback and accessibility:** the visible glyph layers are `aria-hidden` and both typewriter and heading render the complete string for assistive tech. Wiped text is normal DOM text, so screen readers always get it in full. Outside the no-preference block the base state is readable, so a failed or unsupported animation cannot leave text hidden.
- **Performance:** only `transform` and `clip-path` are animated. No width, height, top, left, margin, opacity or per-frame React state. `will-change` is limited to `.is-revealing` and removed 1700ms after the reveal starts; the `is-revealing` class is a single state flip, after the longest animation has finished. Typewriters and wipes are pure CSS timelines.
- **Timing:** Home and Projects finish at about 1.25s, About at about 1.25s (arrow included) and Contact at about 1.13s, all under the 1.6s ceiling. The label types for about 0.4s; the heading drop for long words ends around 0.7s.
- **New files:** `src/components/Typewriter.jsx`, `src/components/DropHeading.jsx`, `src/lib/glyphs.js` (word/glyph splitter) and `src/reveal.css` (all reveal styles and keyframes). `DialogueBox.jsx`, `PixelButton.jsx`, `reveal.js` and `App.jsx` were updated in place.
- **Verification:** `npm run lint` and `npm run build` pass. A Node render of the real `App.jsx` through Vite SSR confirmed the sr-only strings, the aria-hidden glyph layers, 4 sections, 10 amber-bar blocks, 17 wiped elements and no inline opacity/translate styles. No browser pass yet (no browser tools allowed).

## Built in Phase 3a (section reveals, superseded by 3a-fix)
- The Motion-based stepped fade/slide described below was removed in 3a-fix. Kept for history only.
- **Motion setup:** new `src/lib/reveal.js` holds the shared variants. The four worlds are now `motion.section` elements with `initial="hidden"`, `whileInView="show"` and `viewport={{ once: true, amount: 0.12 }}`, so a section's reveal plays the first time it comes into view and never replays on later scrolls.
- **Stepped motion:** `REVEAL_EASE` is Motion's `steps(4, 'end')` easing. Each item fades through four hard opacity levels while sliding up 16px in four 4px hops (16 -> 12 -> 8 -> 4 -> 0), so the reveal lands on the design grid instead of gliding. No blur, no spring, no filter; only `opacity` and `transform` are animated, so nothing reflows.
- **Stagger:** `REVEAL_GROUP` sets `staggerChildren: 0.08`, giving the 80ms gap between a section's kicker, heading, paragraphs, links and blocks in DOM order.
- **Covered items:** Home (kicker, POP title, signpost, lead, body, "Enter the cave", Guide dialogue), Projects (kicker, heading, intro, three cave object links, hint), About (kicker, heading, lead, Profile and Skills blocks), Contact (kicker, heading, lead, email, social, "Return to the signpost"). About's POP `DialogueBox` uses `REVEAL_POP`: opacity plus scale 0.95 -> 1 on the same stepped easing.
- **Component hooks:** `DialogueBox` now renders a `motion.div` and `PixelButton` a `motion.a`/`motion.button`, so their existing `...rest` spread carries `variants` without adding wrapper elements. No markup nesting or CSS layout changed, so the grid areas, safe zones, focus order and 360px layout are untouched.
- **Reduced motion:** sections mount with `initial="show"` and no `whileInView`, so every item renders at its final value immediately with no offset and no stagger delay. "Play anyway" still affects creatures only; it does not re-enable the reveal.
- **Fallback:** content is hidden only by Motion's runtime `initial` styles, never by a stylesheet rule, so a failed animation cannot leave text permanently invisible. Signpost anchors and scroll behaviour are unchanged (the page had no smooth scrolling, so none was added).
- **Verification:** `npm run lint`, `npm run build`, a Node render of the hidden/show variant states, and a Node check of the stepped easing values all pass. No browser pass yet.
- `npm run lint` and `npm run build` pass.

## Built in Phase 2e-3
- **New creatures:** `src/lib/pixelArt.js` now exports Emberimp (16x16), Ashwisp (16x16), Gloamer (16x32) and Starmote (16x16), all original text-grid art with per-character palettes. Emberimp is a chunky maroon imp with ash horns, orange eyes, short legs and a thin ember-tipped tail; it has no snout, tusks or gold, so it cannot read as a Piglin, and no lava-cube segments. Ashwisp is a teardrop flame with a bright core and three detached ember pixels; no rods or orbiting parts, so it is not a Blaze or a torch. Gloamer is a rounded hood with one pale-violet eye slit, short thick arms and a wide bell hem with no legs; it has no long thin limbs, tall rectangular head, particles or teleport. Starmote is a translucent violet jelly with a four-point cream star core and three violet glints.
- **Floating motion:** new `src/components/FloatCritter.jsx` keeps the ground wrapper and shadow, but lifts the body and bobs it on whole pixels instead of running a walk cycle. Ashwisp bobs higher and sways about 24px, Gloamer hovers low and sways about 48px, and Starmote bobs in place. A slow sway supplies the facing direction, and only the sprite canvas flips. Off-screen, paused and reduced-motion states stop the ticker and hold the first hover frame. Floating shadows are smaller and dimmer than a walker's; Gloamer keeps the widest shadow.
- **Roster moved:** Foxel now stands on Home's grass (desktop only) and Mossling on the cave floor (desktop only). About and Contact no longer render the old pair.
- **Roster maths confirmed:** desktop keeps all 10 creatures (Home 3, Cave 3, Ember 2, Void 2). The 7-mob cap is an awake/visible budget: off-screen zones freeze, so only one zone's cast is awake at a time (at most 3 creatures), plus the dragon = 4. Even if two zone sentinels overlapped, the worst case would be 6 + dragon = 7. Phones show one per zone: Pix, Bonemoss, Emberimp, Gloamer (4 total, max 1 per section). Gloop, Foxel, the dark Bonemoss, Mossling, Ashwisp and Starmote are desktop-only.
- **Sizes and lanes:** Emberimp, Ashwisp and Starmote use the 16x16 grid; Gloamer uses 16x32. All four use the existing 160px ground strip and 96/72px grass depth, so the lane maths is unchanged. Floating bodies lift 8-20px desktop and 6-15px phone above the lane, with the shadow staying on the ground.
- **Kept as-is:** Home and Projects layout, Pix's art and control code, `Critter`, `groundMotion.js`, `Sprite`, pause, tab-hidden and `aria-hidden` behaviour are unchanged. All new art is hand-built for this project; no downloaded assets.
- `npm run lint` and `npm run build` pass.

## Built in Phase 2e-2 part B (Home + Cave scenery rework)
- **Home sky:** the night sky now has a hard-edged horizon bloom, a third dim star field, two four-point star crosses, a rare stepped meteor, a moon with extra craters, and three shaded clouds that drift slowly. The clouds and stars stay in the top bands and behind the copy; the signpost and portrait stay on top and readable.
- **Home landscape:** two stepped far ridges, two ridge-tree silhouettes, a third tree, two bushes, two small rocks and two firefly clusters. The hills and trees keep their existing silhouettes and depth order; the new layers sit behind the copy and in front of the sky.
- **Home ground:** the 160px strip now has a 4px light grass lip, a dark seam at the `--grass-depth` line, hard dirt strata, blades above the top edge, small flowers, pebbles and roots. Details sit either above the creature lane or below its bottom edge, so the 64-108 / 88-120 lane stays clear.
- **Cave scenery (Projects):** the flat ceiling is now a 128px stepped rock ceiling with a light edge and teal underglow, six hanging stalactites (two with crystal tips), two falling drips, stepped side-wall rocks and crystal veins. Four crystal clusters, two moss patches and four torches (two wall, two low) frame the project row; the low torches and wall rocks are desktop-only. Torch embers and dust motes sit in the cave air.
- **Cave floor:** the stone strip now has a 4px light top line, hard stone strata, a stepped cap row over dark teeth, cracks, pebbles, crystal pixels and a moss line. The cap row is decor above the strip; the creature lane is still 64-108 desktop and 88-120 phone.
- **Gated motion:** Home and Projects now join About and Contact in `App.jsx` with refs and `is-live`. Stars twinkle, clouds drift, fireflies rise, the meteor crosses and grass sways; torches flicker, embers rise, crystals pulse, drips fall and dust drifts. Every animation defaults to `animation-play-state: paused`; `is-live` runs it only while that section is on screen, creatures are not paused and the system does not prefer reduced motion. Pause, reduced motion and off-screen sections stop all of it.
- **Layout safety:** the 160px ground strip is unchanged. The cave now declares `--grass-depth: 96px` (72px at 600px and below) and its floor uses that variable, so the stone seam matches the lane bottom at both scales. Home and Projects keep their existing padding and copy columns. At 1024px the cave wall rocks, veins and low torches hide and the main torches move to 1% edges; at 760px the large crystals drop and scale, and extra Home layers hide; at 600px the cave keeps one scaled crystal, one moss patch and one dust layer, and Home keeps one cloud, one star cross and one firefly cluster while the ground details stay.
- **Kept as-is:** no new creatures. The existing 2e-3 creatures, `FloatCritter`, the Home/Projects layout, Pix's control code, the signpost anchors and the 2e-2 part A Ember/Void work are unchanged. Scenery is still pure CSS, with no images or downloads.
- `npm run lint` and `npm run build` pass.

## Built in Phase 2c / 2e-2 part C (Emberwing)
- **Art:** new `src/lib/emberwingArt.js` holds a 32x32 text-grid dragon, side view facing right. The look is an obsidian-and-violet void dragon: deep violet body lit by glowing purple cracks and an underbelly glow, tall black crystal spines down the back and tail, torn dark wings with luminous violet ribs and edges, swept horns, a sharp snout and an amber-violet tail tip. The one warm note is a large ember-orange eye with a short animated trail. It is original and deliberately not a plain black-bodied, magenta-eyed Ender Dragon lookalike. Four flying frames animate the wing beat and eye trail; two perched frames use a slow tail sway.
- **Motion:** new `src/components/EmberwingDragon.jsx` uses the existing `Sprite`, shared `ticker.js`, `groundMotion.js` (`seekVelocity`, `stepMotion`, `clamp`, `snapPx`) and no new motion system. The first visit arrives 2.5-4.5 seconds after Contact comes on screen so the dragon is easy to spot, then it waits 25-45 seconds between later flyovers. It enters from the left off screen, glides across the top sky band, descends the right-hand gutter, lands on the pale ledge at the far end of the ground strip, rests about five seconds, then takes off and leaves to the right. The sprite wrapper banks with vertical velocity and bobs while flying; the canvas is the only thing that flips.
- **Placement:** Contact top padding is now 224px (208px at 760, 192px at 600) to create the top flight band above the copy. A new `.void-perch` pale rock outcrop sits at the far right of the 160px ground strip, with its top at 176px. The Contact copy is narrowed on smaller screens (`calc(100% - 160px)` at 760 and `calc(100% - 120px)` at 600) to keep the right-hand descent and perch lane clear of the heading, text, links and "Return to the signpost".
- **Limits and states:** Emberwing is outside the seven-mob budget. Desktop Contact keeps Gloamer and Starmote plus Emberwing; phones hide Starmote and show Gloamer plus Emberwing at 3x. Contact's zone sentinel spans the whole section so any visible part of the sky band keeps the dragon's schedule running; other zones still wake on the ground strip. "Pause creatures" freezes it, and `prefers-reduced-motion` skips the flyover and shows one still perched frame. The whole creature layer remains `aria-hidden`.
- **Docs:** `DESIGN.md` now places Emberwing in the Contact (Void) roster, removes the old shared-sky/signpost-perch plan, and records the 25-45 second flyover, perch, reduced-motion state, phone roster and outside-the-budget rule.
- `npm run lint` and `npm run build` pass.

## Built in Phase 2e-2 part A (scenery rework)
- **Ember scenery (About):** the section is now a stepped underground room. A 128px rock ceiling uses a shared clip-path, with two hard lava edge layers peeking out beneath it, five hanging stalactites (two with hot tips) and two ceiling drips. The wall has a 4px strata pattern, a dim heat bloom on the far side, four pillars (two main mirrored pillars with a lava inner seam and a stepped crack, two far pillars), three stepped lava cracks, three stepped lava pools with hard drop-shadow glows, and three ash layers drifting upward on stepped transforms.
- **Ember ground:** ash over dark hot rock, a 4px strata pattern in the rock, ash clumps at the top edge, and a breathing lava seam at the ash line.
- **Void scenery (Contact):** a banded near-black violet sky, a stepped Ember-rock lip at the top (the optional lip from 2e-3 is now in), a blocky violet nebula, three star fields (cream top band, violet right gutter, dim band above the ground), two four-point stars, two glint clusters, five floating islands (three large, two small) with warm top edges, a violet glint crack and a hard shadow, three debris chunks, and seven cream shelf caps over dark teeth at the ground edge.
- **Void ground:** pale cream rock with two violet mineral seams and a stepped top edge. The caps live in the decor layer so they draw above the strip; the dark teeth show in the gaps.
- **Stepped boundaries:** About's top is the stepped ceiling; About-to-Contact is the new lip; Contact-to-footer is a stepped dark footer edge. Every section background is hard-stop bands and every rock edge is a clip-path step, so no smooth gradient is used.
- **Gated motion:** new shared `src/lib/useOnScreen.js` (also used by `CreatureScene` now). `App.jsx` observes About and Contact and adds `is-live` only when the section is on screen, creatures are not paused and the system does not prefer reduced motion. CSS animations default to `animation-play-state: paused`; `is-live` runs them. Ash rises on stepped transforms, the lava/ceiling breathe and the stars/glints twinkle. The pause button, reduced motion and off-screen sections stop all of it.
- **Layout safety:** the 160px ground strip and 96/72px `--grass-depth` are unchanged, so the lane maths is untouched. About's top padding grew to 208px (176px at 760) and Contact's to 96px (80px at 760) to clear the taller ceiling and lip. Phones hide the pillars, wide star fields, extra rocks/glints and the third pool, and keep one edge glint.
- **Kept as-is:** no new creatures. The existing 2e-3 creatures and `FloatCritter` are unchanged, as are Home, Projects, Pix's control code and the signpost anchors. Scenery is still pure CSS, with no images or downloads.
- `npm run lint` and `npm run build` pass.

## Built in Phase 2e-2 (first scenery pass)
Superseded by the part A rework above.
- **Section palettes:** `src/index.css` now has `.scene--ember` and `.scene--void`, written as variable-only scopes (plus `color-scheme: dark`) in the same style as the Cave theme. Ember: bg #1a0b0c, rock #3a1a14 / #240d0c, rock light #4a221b, lava #ff7a1a, hot core #ffd447, ash #8a8078, ink #f4ecd8, muted #d6bda9, accent #ff8a2a, focus #ffd447. Void: sky #07050f / #14081f, under #05030a, rock #e8dcc0 / #b8a88a, glint #b58cff, star #f4e9c1, ink #f4ecd8, muted #c3b6d6, accent #b58cff, focus #e8dcc0. Measured contrast (Node, WCAG relative luminance): Ember ink 16.3:1, muted 10.7:1, accent 8.1:1, link 9.8:1; Void ink 17.2:1, muted 10.6:1, accent 7.9:1, link 10.2:1, footer muted 10.7:1. All pass 4.5:1.
- **Structure:** the old `.lower-world` night wrapper is gone. About and Contact are self-contained world sections with their own bands, scenery and ground, and the footer carries the Void palette so it continues the last world. Old `.lower-world`, `.lower-decor`, `.stars--lower`, `.hill--lower` and `.tree--lower` rules were removed.
- **Ember scenery (About):** jagged ember ceiling under the cave exit, two rock pillars with a lava inner edge (the right one is mirrored), two stepped lava cracks in the lower padding, floating ember specks in the top band, and two lava pools in the hot rock below the walking band. Ground is ash over dark hot rock with a stepped lava seam at the ash line.
- **Void scenery (Contact):** banded near-black violet background, cream star band pinned above the copy, a violet glint cluster, and three stepped floating islands with pale cream tops, ash-cream undersides and a hard 8px drop shadow. Ground is pale cream rock with a repeating violet seam at its top line.
- **Layout safety:** About and Contact declare `--grass-depth: 96px` locally (72px at 600px and below) to match `CreatureScene`, so the 160px ground strip and the 64-108 / 88-120 lane bands are unchanged. Ground seams use the same variable.
- **Responsive:** the two wide islands are hidden at 1024px and below, glints and ember specks at 760px and below, pillars shrink to 48x208 at 600px, and the lava pools narrow at 600px. Nothing sits behind the copy at any width.
- **Kept as-is:** Home and Projects markup, all creature art and motion code, the sprite scale, the wanders, pause, reduced motion and `aria-hidden`. Every layer in this first pass was static; the part A rework above adds gated motion.
- `npm run lint` and `npm run build` pass.

## Built in Phase 2e-1 (documentation only)
- **`DESIGN.md` rewritten around the world order:** Home (Night), Projects (Cave), About (Ember), Contact (Void), with a table of world, palette and ground strip, and a note that the Night/Day toggle applies to Home only.
- **Palettes:** Night, Day and Cave keep their exact tokens. Ember and Void are documented as required color roles (maroon-black rock, orange/yellow lava, grey ash; near-black violet sky, pale cream rock, violet glints) plus provisional anchor hexes, with the real tokens to be finalized in 2e-2. Section scoping is documented as `.scene--cave`, `.scene--ember` and `.scene--void`, with Night/Day on the root. (Finalized in 2e-2.)
- **Roster by zone:** Home gets Pix, Gloop and Foxel. Projects cave gets Bonemoss x2 and Mossling. About gets Emberimp and Ashwisp. Contact gets Gloamer and Starmote. The dragon stays a shared Home flyover. Lunabun, Puffcloud, Gemmite, Deepwatcher and Glowmoth are marked as deferred and unplaced.
- **New creature descriptions:** Emberimp (tiny horns, orange eyes, quick walk), Ashwisp (floating teardrop flame that bobs), Gloamer (tall hooded shadow, short thick arms, single pale-violet eye slit, hovers low) and Starmote (tiny floating star-jelly). Each carries its own anti-lookalike guard: no Piglin snout/tusks/gold, no Magma Cube segments, no Blaze rods, and for Gloamer no long thin limbs, tall rectangular head, purple particles or teleporting.
- **Facing rule documented once:** all side-view sprites face right and flip only their canvas, the last facing is kept on stop, floating creatures follow the same rule, and controlled Pix is the single exception with his eight directions.
- **Roster limits restated:** 7 mobs plus the dragon on desktop, 4 on phones, max 2 per section on phones, wander only inside the section's own ground strip, animate only while that section is on screen.
- **`PRODUCT.md` expanded:** audience, goal, the four-beat world journey with the purpose of each area, tone per area, and the principle that the signpost must still jump straight to Projects so depth never blocks a recruiter.
- No source, CSS, sprite or config files were changed. `npm run lint` and `npm run build` were run after the doc edits and pass.

## Built in Phase 2b-fix4b
- **Depth movement:** controlled Pix now walks on both axes of the existing ground lane. W moves him up/away, S moves him down/towards the viewer, A/D stay horizontal and the four key pairs walk diagonally. y is still measured up from the strip's bottom, so the lane band (`laneMin`..`laneMax`, 44px desktop / 32px phone) is the only place he can stand.
- **One shared key vector:** new `movementFromKeys(keys)` returns the held keys as `{ dx, dy }` with y positive away from the viewer. Both the continuous path and the reduced-motion nudge read it, so keyboard and touch cannot drift apart. Diagonals are multiplied by `Math.SQRT1_2`, which makes a diagonal cover the same distance per second as a straight line. A Node simulation over the real `groundMotion.js` measured 230.97px in two seconds for right, up, up-right and down-left.
- **Facing unchanged:** `directionFromKeys` still drives the eight `CONTROL_POSES` from fix4a. A diagonal uses `angleBack`/`angleFront`, opposite keys on either axis still return `null` and keep the previous pose, stopping keeps the last pose, and release (Esc, outside press, 20 seconds idle) still returns him to side-view wandering.
- **Tap-to-walk:** a ground tap near Pix now walks him to both the tapped x and the tapped y, clamped into the lane. Facing is still the nearest of the eight directions to the tap vector and stays put when he arrives; tapping elsewhere still releases control. The tap y is read from the same `ground` rect bottom that the lane is measured from, so no coordinate conversion changed.
- **Reduced motion:** key presses still move one short step (12px phone / 16px desktop) on the idle frame, but the step now follows the same 2D vector, so a diagonal pair steps diagonally by the same total distance and up/down nudges use the real lane depth. Spaced tap steps already moved on both axes and are unchanged.
- **Kept as-is:** walk frames still advance from distance travelled, the sprite still snaps to whole pixels, shadows and the shadow lift are untouched, `groundMotion.js` and `Sprite` were not modified, and pause, `aria-hidden`, lane clamping, "Play as Pix" and the 20-second release behave exactly as before.
- `npm run lint` and `npm run build` pass.

## Built in Phase 2b-fix4a
- **New Pix views:** `pixelArt.js` now exports `PIX_VIEW_FRAMES` with the existing `side` set plus `front`, `back`, `angleFront` and `angleBack`. All are 16x32 text grids using the same Pix palette and layered part style. Only the right-facing 3/4 views are drawn; `Sprite` mirrors them with `scaleX(-1)` for the left versions. Every new frame is original hand-built text-grid art; no downloaded assets were used.
- **Front view:** two eyes, red-orange headband, cream hoodie with ink-blue sleeves on both sides, both legs and amber boots. Green backpack straps show on the shoulders only. It is the only new view with an idle blink frame.
- **Back view:** black hair covers the head, the headband shows with a short red tail, and the green backpack covers most of the torso with a small amber buckle. Both sleeves, hands, legs and boots stay visible.
- **3/4 views:** head and torso are shifted about 45 degrees, the pack shows on one side, and the near-side arm and leg are drawn in front. `angleFront` shows both eyes and the face edge; `angleBack` shows hair with a small cheek sliver and the headband tail.
- **Animation:** every new view has one idle frame and a four-frame walk cycle (neutral, left step, neutral, right step) with alternating arms, a one-pixel body dip and a lifted boot. `lift` values drive the existing shadow shrink. Walk frames are still advanced from distance travelled, not a timer.
- **Control facing:** `PixHero.jsx` maps held keys to the eight directions. W = back, S = front, D = side right, A = side left, and the diagonals use the 3/4 views. Opposite keys on either axis cancel and keep the previous facing. Stopping keeps the last facing; releasing control (Esc, outside press or 20 seconds idle) returns to side-view wandering.
- **Tap facing:** a ground tap picks the nearest of the eight directions from the full tap vector, then walks horizontally to the tapped x. W and S only changed facing at this stage, so there was no vertical player movement yet. (Superseded in 2b-fix4b: taps now walk to the tapped x and y.)
- **Reduced motion:** the existing short key nudges and tap stepping are preserved. Facing still changes, but the walk animation stays on the idle frame.
- **Frame-count safety:** the distance-driven walk reads the current view's frame count from a ref, so changing facing does not rebuild the control listeners.
- `npm run build` and `npm run lint` pass.

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
Screenshot review of Phase 3a-fix first, at 1440/1024/760/360: reload Home and watch the label type, the POP letters drop and bounce, the wipes with the amber edge, and the Guide box; then use the signpost anchors to reach each world and confirm the reveal plays once on entry and never replays. Check About's dialogue box opening, its 22ms typing and the blinking arrow, and a reduced-motion reload where everything is simply there with no cursor, bar or arrow.
Then the still-open Phase 2c screenshot review: scroll to Contact and wait about 3-5 seconds for the first flyover, then check the top band, the right-hand descent, the pale perch, the five-second rest, the takeoff/leave, the four wing frames and the eye trail. Later visits wait 25-45 seconds. Check the dragon clears the Contact heading, text, links and "Return to the signpost" at every width, and that the phone shows only Gloamer and Emberwing in Contact (Starmote hidden).
Also re-check the pause button, a reduced-motion reload (one still perched frame), an off-screen Contact section (no ticker), and the Phase 2e-2 parts A/B scenery and 2e-3 creatures.
After the reviews, Phase 3b follows: parallax with scroll-velocity effects.

## Known issues
- Phase 3a-fix has only been checked with `npm run lint`, `npm run build` and static checks (no browser tools allowed). The screenshot pass must confirm the feel of all five effects at all four widths.
- The label's block cursor sits at the end of the full label rather than travelling with the typing edge, because the glyphs keep their layout width while clipped. Check whether that reads as a typewriter or as a cursor waiting at the end; if it reads wrong, the fix is a per-glyph cursor slot, not a layout animation.
- Heading letters fall from 24px above, so they briefly overlap the kicker above them. Check on the Home title and the longer "Projects" word at 360px; if it reads as a collision, start the drop at 300ms or shorten the 160ms heading lead-in.
- The wipe's 4px amber bar is clipped by `overflow: hidden` on blocks that contain one (`:has(> .rv-bar)`). If `:has` is unsupported, the bar can leave the block during its 450ms sweep and widen the page scroll area; verify no horizontal scrollbar appears at 360px.
- About's Profile and Skills wipe as single blocks, so their h3 and paragraphs share one amber edge rather than one edge per paragraph. That is intentional for this pass; revisit if it reads as a missed stagger.
- The reveal waiting state is a CSS rule keyed on `.scene:not(.is-revealed)` inside the no-preference media query. If the IntersectionObserver never fires (not "animation fails"), a section would stay hidden; the hook falls back to revealed when `IntersectionObserver` is missing. Confirm a normal reload and a hash jump to `#contact` both reveal.
- The reveal threshold is 30% of the section, lowered when 90% of the viewport cannot cover that much. Check a tall 360px phone (long Contact section) that the copy arrives as the section enters, not after it is already fully on screen.
- Home's header controls and the portrait are deliberately outside the reveal, so they are painted before the label types. Check that this still reads as intentional.
- `will-change` is attached to `.is-revealing` for 1700ms after the reveal starts. If long About typing plus the blinking arrow feels like it should keep the hint longer, raise `REVEAL_TOTAL`; do not move `will-change` into the base rules.
- The wipe animates `clip-path` on text blocks; on a low-end phone, check that four simultaneous wipes plus the letter drop stay smooth. Only `transform` and `clip-path` are animated and no React state changes during the timeline.
- Screen readers get the full label and heading from the `.sr-only` copy while the glyph layer is `aria-hidden`; check with a screen reader that the kicker and heading are not announced twice and that typed dialogue reads as a full sentence.
- Keyboard Tab through a section that has not revealed yet still scrolls it into view and starts the reveal. The reveal adds no tab stops and does not change DOM order; check that the focus outline is not clipped after a wipe (the clip is released when the animation ends).
- The old Phase 3a Motion reveal is gone, so its fade/stagger issues are closed. The 2c/2e screenshot checks below still apply.
- The first Emberwing visit was made quick (2.5-4.5 seconds after Contact becomes visible) because the 25-45 second wait made the dragon easy to miss on arrival. Later visits keep the long, rare gap; check that the first one actually appears near the top band and that the later schedule still feels rare.
- Contact's creature sentinel now covers the whole section instead of only the bottom 320px, so the flyover keeps running whenever any part of Contact is on screen. Check that scrolling Contact fully off screen still stops the ticker.
- Phase 2c / 2e-2 part C has only been checked with Node art previews, `npm run lint` and `npm run build`, not in a browser. The screenshot pass should check the obsidian/violet silhouette at 4x and 3x, that the dark wings still read against the void sky, the four wing poses, the luminous wing ribs, the black crystal spines, the swept horns, the violet tail tip, the ember-orange eye and trail, the top-band clearance, the right-hand descent, the pale perch alignment, and the five-second rest.
- Contact's top padding grew from 96px to 224px (208px at 760, 192px at 600) to make the dragon's sky band. The copy now starts lower; check the Contact section still feels balanced and that the void lip, stars and floating rocks do not crowd the new empty band.
- The Contact copy is narrower at 760 and below (`calc(100% - 160px)` / `calc(100% - 120px)`) to leave the dragon's descent lane. Check the heading, lead, links and "Return to the signpost" at 760 and 360 for awkward wrapping or overflow, especially the "Contact" heading at 3x.
- The dragon enters from the left and leaves to the right, so the current path never flies left; the flip branch is present but unexercised. If a future pass alternates entry sides, check the `scaleX(-1)` flip stays on the sprite canvas only and the perch keeps the last facing.
- Check that "Pause creatures" freezes Emberwing mid-flight as well as on the perch, that a reduced-motion reload shows one still perched frame with no flyover, and that scrolling Contact off screen stops the ticker. "Play anyway" restores creature motion, so the dragon should resume its schedule after it.
- Phase 2b-fix4b has only been checked with a Node motion simulation over the real `groundMotion.js`, `npm run lint` and `npm run build`, not in a browser. The screenshot pass should watch a hold on W, S, W+D, W+A, S+D and S+A, then check that he stops cleanly on the back and front lane edges and that the 3/4 pose matches the diagonal.
- Phase 2b-fix4a art has only been checked with Node art/width checks, `npm run build` and `npm run lint`, not in a browser. The screenshot pass should look at the new front/back/3-4 views at 4x and 3x, the mirrored left angles, the front blink, the back head/headband tail, and whether the front/back heads read as hair rather than a helmet.
- The front and back views use one-pixel arm swing while the body dips; check the shoulder join on walk frames. The 3/4 views shift the torso sideways, so check that the pack sliver and near arm/leg read as one body at phone scale.
- New walk cycles use the same eight-source-pixel stride as the old side view, but only four frames. Check for foot sliding or an over-fast cadence when controlled, especially on diagonals where the walk now advances from the combined x and y distance.
- The depth band is only 44px on desktop and 32px on phones. Vertical travel is therefore short by design; check that his boots stay inside the grass at both edges and that the shadow still reads as sitting on the ground.
- There is no depth scaling or perspective: moving up does not shrink Pix and the shadow does not shift. The head and hint can therefore end up above the grass at the back edge; check they still clear the dialogue box, portrait and signpost.
- Tap-to-walk now moves on both axes; check that a tap very close to Pix does not jitter the facing or leave him short of the tap point.
- The reduced-motion key nudge is now a 2D step of 12px (phone) or 16px (desktop) in total, including diagonals. Check that repeated presses do not stair-step out of the lane and that the idle frame stays still.
- Control is still released by an outside pointer press. With depth movement, tapping the ground behind Pix now walks him away instead of releasing him; tapping the sky, text or any other element still releases.
- Part 2 has only been checked with Node art/width checks and a production build, not in a browser. The first screenshot pass should look at the side-view readability of all four creatures, the flipped facing on left moves, the Gloop squash/stretch and shadow shrink, the Foxel outline at 4x, the Mossling/Bonemoss leg crossing, and 360px text clearance.
- Walk and hop timing is now distance-driven. The tuning values are the `stride` props in `CreatureScene.jsx` (Gloop 6, Foxel 4, Mossling 5, Bonemoss 5 source pixels per full cycle) plus each creature's `speed`. Adjust those rather than frame rates if a foot slides.
- The idle breathing bob moves the humanoid upper body down one pixel while the feet stay planted. Check that the tunic/cloth hem does not pinch at the waist in the screenshot.
- Phase 2e-2 part A scenery has only been checked with `npm run lint` and `npm run build`, not in a browser. The screenshot pass should look at the About ceiling, stalactites, pillars, strata, lava cracks/pools and drifting ash at 1440/1024/760/360; the Contact lip, star fields, floating island shelf caps and footer teeth; and the About-to-Contact seam at all four widths.
- Phase 2e-2 part B scenery has only been checked with `npm run lint` and `npm run build`, not in a browser. The screenshot pass should look at Home's horizon bloom, star fields/crosses, meteor, moon halo/craters, three clouds, far ridges, third tree, bushes/rocks, fireflies and ground blades/flowers/pebbles/roots at all four widths; the Home-to-Cave seam; and Projects' 128px ceiling, six stalactites, drips, wall rocks/veins, four crystals, moss, four torches/embers, dust and stepped floor caps at all four widths.
- The cave stalactites now start at `top: 0` and rely on the ceiling being painted after them to hide their square tops. Check that every visible stalactite connects to the ceiling edge with no gap and that the deepest tips still clear the Projects kicker by 32px.
- The cave floor cap row is decor, not part of the 160px strip. Check that creatures still draw in front of it, that the caps clear the 88px phone lane top and that the dark gaps read as rock teeth rather than a second floor.
- Home uses `vw`/`vh` positions for stars, clouds, fireflies and the meteor. Check a short laptop and a tall phone for stars bunching behind the copy, clouds drifting into the signpost, or the meteor crossing the title; the phone rules hide the extra cloud, ridge and star cross but keep one of each.
- The cave wall rocks/veins and low torches are hidden at 1024px, and the main torches sit at 1% edges at 1024/760. Check that no flame/glow sits behind the first text glyph at 1024 or 760, and that the 600px cave still reads as a room without torches.
- The cave crystals are scaled down and the two large ones are lowered at 760px; only one 0.6-scale crystal remains at 600px. Check that no crystal overlaps the last Projects copy line or the creature lane at any width.
- The `is-live` class now also gates Home and Projects decoration. Check that the pause button stops Home stars/clouds/fireflies/grass and cave torches/crystals/drips/dust, that a reduced-motion reload keeps all decoration still, and that scrolling a section off screen pauses it.
- Screen-reader and reduced-motion behaviour should be unchanged because the scenery is `aria-hidden`; the new `is-live` class only gates CSS animation. Worth a quick Tab/AT pass on the pause button and "Play anyway", plus a reduced-motion reload to confirm the ash, lava breathe and star/glint twinkle are all still stopped.
- "Play anyway" deliberately restores creature motion only. Scenery stays paused under the system reduced-motion preference, so the page never animates decoration the user asked to suppress.
- The stepped Contact lip is now in. Check that its 56px (48px at 760) teeth clear the Contact kicker and that the Ember ground above it does not show a straight cut at 1024/760/360.
- The ash layers use `vh` offsets, so the drift band is tied to viewport height, not section height. Check on a short laptop and a tall phone that the specks stay inside the section and do not bunch at the top.
- Both About and Contact can be `is-live` for a moment while the seam is on screen; the whole-section observer intentionally allows that. If it is too busy, switch the observer to a smaller sentinel.
- The Ember pillars are pulled to the section edges at 1024px and hidden at 600px. Check the phone scene still reads as a room and that no pillar sits behind the copy at 760 or 1024.
- The shelf caps are decor, not part of the ground strip. Check that creatures still draw in front of them at the back lane and that the caps do not cover a creature's feet.
- The footer teeth overlap the bottom 16px of the Contact ground; check the seam does not look like a second ground.
- Phase 2e-3 art and `FloatCritter` have only been checked with Node art/width checks, `npm run lint` and `npm run build`, not in a browser. The screenshot pass should check the four new sprites at 4x and 3x, the Emberimp horns/tail, the Ashwisp core and detached embers, the Starmote translucency over both Void bands, the Gloamer eye slit and hem, and the floating bob/shadow at both scales.
- Floating creatures sway on a sine. Check that they do not clip the section edge, that the shadow stays on the ground while the body bobs, and that only the canvas flips when the sway changes direction.
- Ashwisp and Starmote have no blink frames; their two-frame flicker is the only idle animation. Check that it reads as a flicker, not a stutter.
- Gloamer's blink is a dimmed eye slit. Check that it reads as a blink and not a missing eye.
- Ember text sits on maroon-black, not on the lava. If any deep-orange copy is added later, re-check it against the banded background; the current tokens keep normal text above 4.5:1.
- `.scene--void` is reused on the footer purely as a palette scope. Keep both palette classes variable-only (`--bg`, `--ink`, accents); adding layout rules to `.scene--void` would also restyle the footer.
- Cave, About and Contact now set `--grass-depth` themselves (96px, 72px at 600px and below). If the lane maths in `CreatureScene.jsx` changes, update these three rules together with the ground seams.
- The desktop roster is now settled at 10 creatures under the awake-budget reading. If a future phase adds more zones or stops freezing off-screen zones, the 7-awake cap has to be rechecked.
- New art sizes are final for this pass: Emberimp, Ashwisp and Starmote are 16x16 and Gloamer is 16x32. A grid only changes if a silhouette fails at 3x on phones.
- Gloamer is still the riskiest silhouette: check the 3x phone size specifically. If the rounded hood and wide hem still read as an Enderman, widen the hem or shorten the hood rather than recoloring.
- Text sits directly on the scene, so the Ember orange kicker and the Void violet kicker need a real contrast check in the screenshots; both were chosen above 4.5:1 against their own backgrounds.
- The Foxel silhouette is dense at 16x16 (tail, head and body all touch). If it reads as one blob at 4x, separate the tail by one more source pixel in `composeFox`.
- Gloop's eye direction comes from the sprite flip, so it always looks the way the blob faces. Check that the pupil still reads at 3x on phones and that the hop lift (10px desktop, 6px phone) does not look like floating.
- Each world's ground edge now meets a different world below it. Check the Home-to-Cave lip, the Cave-to-Ember ceiling, the Ember-to-Void lip (now added) and the Contact-to-footer teeth in the screenshots.
- Creatures can overlap and walk through each other; there is no collision yet.
- The pause toggle is global across all four zones, disables "Play as Pix" and releases control, on purpose.
- "Play anyway" is session-only and has no off switch of its own; the system preference still controls the note and it is not remembered after a reload. If the system setting flips back to reduce-motion during the session, the override keeps creatures moving.
- Phones now show Pix (Home), Bonemoss (Cave), Emberimp (Ember) and Gloamer (Void). Gloop, Foxel, the dark Bonemoss, Mossling, Ashwisp and Starmote are desktop-only, so Home and the cave are intentionally quieter at 360px.
- Verify the 16x32 heads (Pix, Mossling, Bonemoss, Gloamer) clear the dialogue box, portrait, signpost and cave objects at 360px in the screenshot; desktop clearance is 84px and phone clearance is 64px. Gloamer also floats above the lane, so check its hood against the Contact copy at both widths.
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
- Only control changes Pix's view. The eight-direction helper returns `null` for opposite keys so the last pose survives, and the renderer reads the side pose again as soon as control is released. New 3/4 art is drawn facing right once and mirrored, which keeps the art file small.
- Depth movement reads one normalized key vector shared by smooth control and the reduced-motion step. `Math.SQRT1_2` on both axes keeps a diagonal at straight-line speed, and tap-to-walk uses the same `seekVelocity` path so touch cannot outrun the keyboard.
- The star field is kept out of the text by owning the top band (80px Home padding) and the far gutters instead of scattering dots behind the copy.
- The page is one descending world, so each section owns a palette scope and a fixed cast instead of the page owning one theme. Home keeps the Night/Day toggle; Projects, About and Contact keep their palette permanently.
- Docs are written before the art for each new world (2e-1), so Ember and Void scenery has a written color, roster and anti-lookalike contract to build against. Docs-first is cheaper than reworking art that drifted.
- Each world owns its palette scope and its scenery. Palette classes stay variable-only so the same scope can dress a section, a footer or a future dialog without dragging layout along.
- Ember and Void scenery is pure CSS: banded gradients, `clip-path` rock, stepped `box-shadow`/`drop-shadow` glows. No images. Part A adds CSS-only motion behind an `is-live` class so reduced motion, the pause button and off-screen sections can stop it without touching the ticker.
- Scenery motion is gated by `is-live` on the section, driven by a shared `useOnScreen` hook. The animation loop stays in CSS; JS only toggles the class.
- The About-to-Contact seam gets the stepped Ember-rock lip in the scenery pass where the seam belongs, instead of waiting for the creature pass.
- Phone scenery hides wide layers instead of shrinking them behind the copy. The ceiling, ash, one edge glint and the ground caps carry the scene at 360px.
- The 7-mob desktop limit is kept as an awake/visible budget, not a total-cast limit. All 10 creatures exist in their zones; freezing off-screen zones means only one zone is awake at a time (at most 3 creatures, plus the dragon). Phones use one creature per zone to respect both the 4-total and 2-per-section limits.
- Floating creatures get their own `FloatCritter` rather than a mode inside `Critter`. The ground wanderer's distance-driven walk, arrival easing and lane clamp do not apply to a bob, so keeping the two motion models apart avoids weakening either one.
- Floating bodies bob on whole pixels and keep the existing ground wrapper and shadow. The shadow stays put while the body lifts, which reads as hovering without any new shadow logic.
- Section reveals live on the section as Motion variant parents, so each label, heading, paragraph and link opts in with one `variants` prop and the 80ms stagger comes from DOM order. This avoided adding wrappers that could disturb the existing grid areas and safe zones.
- The reveal uses Motion's built-in `steps(4, 'end')` easing instead of smooth bezier timing. Four hard hops keep the motion on the 4px grid and match the pixel style; a 16px slide with four steps lands exactly on 16/12/8/4/0.
- `DialogueBox` and `PixelButton` became Motion roots so their existing `...rest` spread can carry `variants`. This keeps reveal props out of the DOM and avoids wrappers around boxes and links.
- Reduced motion mounts sections with `initial="show"` and no `whileInView`, rather than animating with zero duration. Final values are applied in the first paint, so there is no hidden frame and no stagger delay.

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
- Writing the roster per zone exposed the arithmetic: 10 desktop creatures against a 7-mob cap, and 8 phone-capable creatures against a 4-mob total. The cap can only hold as an awake/visible budget or by trimming, so roster plans need the maths checked at the same time as the cast list. Phase 2e-3 settled it: all 10 on desktop, one per zone on phones.
- A floating sprite can share the ground creature's wrapper and shadow; only the body needs a separate lift/bob transform. That kept the new component small and preserved pause, reduced-motion and off-screen freezing without touching `Critter`.
- Swaying on a sine with a per-creature phase gives a natural drift without a target-picking state machine. Initialising the phase in the placement pass avoids a first-frame jump when the zone wakes.
- Hard-stop `linear-gradient` bands read as stacked rock and sky; a single soft radial gradient would have looked airbrushed and broken the pixel style.
- Palette variables declared on the same element as the background work because both rules match that element; the trap is assuming the section's own CSS file has to define them.
- Hiding wide decor at the existing 1024/760 breakpoints is cheaper than trying to keep it clear of a text column that reflows between 760 and 1024px.
- `animation-play-state: paused` on the default state and a parent `.is-live` class is a cheap way to freeze CSS-only scenery off-screen or paused without a JS animation loop.
- A shared IntersectionObserver hook avoids duplicating the sentinel logic between `CreatureScene` and `App`.
- `box-shadow` glows are clipped by the element's `clip-path`; `filter: drop-shadow()` is the way to make a hard pixel glow follow a stepped shape.
- `vh`-based ash offsets only cover one viewport band, so the field needs a layer near the top, middle and bottom of a tall section.
- A custom stepped easing does not have to end at 1: Motion's JS animation substitutes the exact final keyframe when the tween finishes, so `steps(4)` can hold at 0.75 and still land on the real target.
- Framer Motion variants propagate through plain DOM wrappers via React context, so a section can own the reveal state without every intermediate div becoming a motion element.



