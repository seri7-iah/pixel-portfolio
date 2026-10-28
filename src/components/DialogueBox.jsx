import Typewriter from './Typewriter.jsx'
import { REVEAL_BASE, REVEAL_STEP } from '../lib/reveal.js'

const TYPED_SPEED = 22

// The only boxed element in the world. When `typed` is set, `lines` (plain
// strings) are typed out after the box opens from its centre line, then a
// blinking down-arrow appears. The untyped form keeps its normal children.
export default function DialogueBox({
  label = 'Dialogue',
  speaker,
  children,
  lines,
  typed = false,
  revealIndex = 0,
  className = '',
  style,
  ...rest
}) {
  const typedLines = typed ? (lines ?? []) : []
  const openDelay = REVEAL_BASE + revealIndex * REVEAL_STEP
  const typingStart = openDelay + 310
  const totalChars = typedLines.reduce(
    (sum, line) => sum + Array.from(line).length,
    0,
  )
  const arrowDelay = typingStart + totalChars * TYPED_SPEED + 240

  let lineDelay = 0

  return (
    <div
      className={['dialogue-box', className].filter(Boolean).join(' ')}
      style={{ '--rv-i': revealIndex, ...style }}
      {...rest}
    >
      <div className="dialogue-box__bar">
        <span className="dialogue-box__label">{label}</span>
        {speaker ? <span className="dialogue-box__speaker">{speaker}</span> : null}
      </div>
      <div className="dialogue-box__body">
        {typed
          ? typedLines.map((line, lineIndex) => {
              const lineStart = typingStart + lineDelay
              lineDelay += Array.from(line).length * TYPED_SPEED
              return (
                <Typewriter
                  key={`${lineIndex}-${line}`}
                  as="p"
                  text={line}
                  speed={TYPED_SPEED}
                  startDelay={lineStart}
                  cursor={false}
                />
              )
            })
          : children}
        {typed ? (
          <span
            className="rv-arrow"
            aria-hidden="true"
            style={{ '--rv-start': `${arrowDelay}ms` }}
          />
        ) : null}
      </div>
    </div>
  )
}
