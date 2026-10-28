import { Fragment } from 'react'
import { splitWords } from '../lib/glyphs.js'

// Section heading: each glyph falls 24px under a gravity curve, lands, bounces
// up 3px once and settles. CSS owns the animation; the glyph spans only carry
// their stagger index. Screen readers get the full string from the sr-only
// copy, and the animated layer is hidden from them.
export default function DropHeading({
  text,
  as: Tag = 'h2',
  id,
  className = '',
  startDelay = 160,
  stagger = 45,
  style,
}) {
  const words = splitWords(text)

  const headingStyle = {
    '--rv-start': `${startDelay}ms`,
    '--rv-stagger': `${stagger}ms`,
    ...style,
  }

  return (
    <Tag
      id={id}
      className={['rv-drop', className].filter(Boolean).join(' ')}
      style={headingStyle}
    >
      <span className="sr-only">{text}</span>
      <span className="rv-drop__layer" aria-hidden="true">
        {words.map(({ word, chars }, wordIndex) => (
          <Fragment key={`${word}-${wordIndex}`}>
            <span className="rv-drop__word">
              {chars.map(({ char, index }) => (
                <span
                  className="rv-drop__char"
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
    </Tag>
  )
}
