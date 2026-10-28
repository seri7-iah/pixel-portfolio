import { Fragment } from 'react'
import { splitWords } from '../lib/glyphs.js'

// Game-UI typewriter. The full string is rendered once for assistive tech and
// the visible copy is pre-split into glyphs that CSS reveals one at a time, so
// no React render happens per character. A block cursor blinks while typing
// and is clipped away 400ms after the last glyph.
export default function Typewriter({
  text,
  as: Tag = 'p',
  className = '',
  speed = 28,
  startDelay = 0,
  cursor = true,
  style,
}) {
  const words = splitWords(text)
  const count = Array.from(String(text)).length

  const typeStyle = {
    '--rv-speed': `${speed}ms`,
    '--rv-start': `${startDelay}ms`,
    '--rv-count': count,
    ...style,
  }

  return (
    <Tag
      className={['rv-type', className].filter(Boolean).join(' ')}
      style={typeStyle}
    >
      <span className="sr-only">{text}</span>
      <span className="rv-type__layer" aria-hidden="true">
        {words.map(({ word, chars }, wordIndex) => (
          <Fragment key={`${word}-${wordIndex}`}>
            <span className="rv-type__word">
              {chars.map(({ char, index }) => (
                <span
                  className="rv-type__char"
                  style={{ '--rv-glyph': index }}
                  key={index}
                >
                  {char}
                </span>
              ))}
            </span>
            {wordIndex < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </span>
      {cursor ? <span className="rv-cursor" aria-hidden="true" /> : null}
    </Tag>
  )
}
