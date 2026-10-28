import Sprite from './Sprite.jsx'

// A 10x14 text-grid "!" bubble: amber body, a dark "!" glyph and a stepped
// tail. It scales with the creature canvas (4x desktop, 3x phone) so it stays
// on the same pixel grid as the sprites. The parent toggles `.is-on` from the
// ticker, so showing and hiding the bubble never re-renders React.
//
// The bubble now goes through the same baked lighting pass as the creatures
// (Phase 3c-art). The old hand-drawn near-black ring was replaced by the
// bubble's own amber, so the pass can draw the silhouette: one tinted 1px
// outline, a top-lit amber ramp and a small `h` glint that reads as emissive.
// The "!" glyph stays hand-drawn `d`, so the mark is still crisp at 3x.
const NOTICE_BUBBLE_FRAME = [
  '..aaaaaa..',
  '.ahaaaaaa.',
  'ahaaaaaaaa',
  'aaaaddaaaa',
  'aaaaddaaaa',
  'aaaaddaaaa',
  'aaaaddaaaa',
  'aaaaaaaaaa',
  'aaaaddaaaa',
  'aaaaaaaaaa',
  '.aaaaaaaa.',
  '..aaaaaa..',
  '...aa.....',
  '..aa......',
]

const NOTICE_BUBBLE_FRAMES = [NOTICE_BUBBLE_FRAME]
const NOTICE_BUBBLE_PALETTE = {
  a: '#ffb347',
  h: '#ffd98a',
  d: '#1a1208',
}

// `world` is the owning section, so the bubble's rim light matches the light
// that falls on the creature holding it. The glow holds its static tone: the
// bubble lives for 700ms, so a 2 fps pulse would run while it is hidden.
export default function NoticeBubble({ bubbleRef, scale = 4, world = 'home' }) {
  return (
    <span ref={bubbleRef} className="notice" aria-hidden="true">
      <Sprite
        frames={NOTICE_BUBBLE_FRAMES}
        palette={NOTICE_BUBBLE_PALETTE}
        scale={scale}
        frameIndex={0}
        playing={false}
        light="notice"
        world={world}
      />
    </span>
  )
}
