import Sprite from './Sprite.jsx'

// A 10x14 text-grid "!" bubble: amber fill, one dark outline pixel and a stepped
// tail. It scales with the creature canvas (4x desktop, 3x phone) so it stays
// on the same pixel grid as the sprites. The parent toggles `.is-on` from the
// ticker, so showing and hiding the bubble never re-renders React.
const NOTICE_BUBBLE_FRAME = [
  '..dddddd..',
  '.dhaaaaad.',
  'dhaaaaaaad',
  'daaaddaaad',
  'daaaddaaad',
  'daaaddaaad',
  'daaaddaaad',
  'daaaaaaaad',
  'daaaddaaad',
  'daaaaaaaad',
  '.daaaaaad.',
  '..dddddd..',
  '...dd.....',
  '..dd......',
]

const NOTICE_BUBBLE_FRAMES = [NOTICE_BUBBLE_FRAME]
const NOTICE_BUBBLE_PALETTE = {
  a: '#ffb347',
  h: '#ffd98a',
  d: '#1a1208',
}

export default function NoticeBubble({ bubbleRef, scale = 4 }) {
  return (
    <span ref={bubbleRef} className="notice" aria-hidden="true">
      <Sprite
        frames={NOTICE_BUBBLE_FRAMES}
        palette={NOTICE_BUBBLE_PALETTE}
        scale={scale}
        frameIndex={0}
        playing={false}
      />
    </span>
  )
}
