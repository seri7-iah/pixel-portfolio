// Splits text into words of single glyphs for the CSS typewriter and the
// letter drop. Each word gets its own wrapper so an inline-block glyph can
// never break a word across lines. The running index also counts the space
// between words, so typing keeps its rhythm across gaps.
export function splitWords(text) {
  const parts = String(text).split(' ')
  let index = 0

  return parts.map((word, wordIndex) => {
    const chars = Array.from(word).map((char) => {
      const glyph = { char, index }
      index += 1
      return glyph
    })

    if (wordIndex < parts.length - 1) index += 1

    return { word, chars }
  })
}
