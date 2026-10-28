// Phase 3c: ordered dithering for the descent bands between worlds. Every cell
// is a hard square of either the upper world's colour or the lower world's, so
// nothing in here needs a gradient, a blur or an opacity fade.

// Classic 8x8 Bayer matrix (0..63). A cell flips to the lower world once the
// level's threshold passes its value, which spreads the stipple over the whole
// band instead of eating in from one edge.
export const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
]

// 16 levels: 0 is the whole band in the upper world, 15 is the whole band in
// the lower one, and the 14 steps between advance the stipple.
export const BAND_LEVELS = 16
export const BAND_MAX_LEVEL = BAND_LEVELS - 1

// Scroll progress through one band (0 when its first row reaches the bottom of
// the viewport, 1 once it is fully past) to one of the 16 levels. Keeping the
// maths here means the component can compare levels and skip the redraw.
export function bandLevel(progress) {
  const clamped = Math.min(1, Math.max(0, progress))
  return Math.min(BAND_MAX_LEVEL, Math.floor(clamped * BAND_LEVELS))
}

// A fixed 24-cell rock underside: clumps of one to four teeth with gaps. It is
// hand-drawn on purpose, so the lip keeps the same silhouette on every redraw.
const ROCK_TEETH = [
  1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0,
]

// Deterministic per-cell hash for the sparse lip dust. Math.imul keeps it in
// 32-bit integers, so the pattern is identical in every browser and on every
// redraw (no Math.random, no flicker while scrolling).
function cellHash(x, y) {
  let hash = Math.imul(x, 73856093) ^ Math.imul(y, 19349663)
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177)
  return (hash ^ (hash >>> 16)) >>> 0
}

// Read one palette colour off a section, so each band follows the live palettes
// instead of copying hex values into JS.
export function readColor(el, name) {
  if (!el || !name) return ''
  return getComputedStyle(el).getPropertyValue(name).trim()
}

// Two rows of ragged rock under the seam. Row 0 is the shadowed underside, row
// 1 is a broken tooth line, plus a few lit pixels on the rock face.
function paintRockLip(ctx, { cell, cols, dark, light }) {
  ctx.fillStyle = dark
  ctx.fillRect(0, 0, cols * cell, cell)

  for (let col = 0; col < cols; col += 1) {
    if (ROCK_TEETH[col % ROCK_TEETH.length]) {
      ctx.fillRect(col * cell, cell, cell, cell)
    }
  }

  ctx.fillStyle = light
  for (let col = 0; col < cols; col += 1) {
    const tooth = ROCK_TEETH[col % ROCK_TEETH.length]
    if (tooth && col % 7 === 3) {
      ctx.fillRect(col * cell, 0, cell, cell)
    }
  }
}

// Pale rock dust carried over the void edge: single cells over the top three
// rows, denser on the first row, with an occasional bright speck.
function paintDustLip(ctx, { cell, cols, dark, light }) {
  for (let row = 0; row < 3; row += 1) {
    const spacing = 9 + row * 4
    for (let col = 0; col < cols; col += 1) {
      const hash = cellHash(col, row)
      if (hash % spacing !== 0) continue
      ctx.fillStyle = (hash >>> 8) % 5 === 0 ? light : dark
      ctx.fillRect(col * cell, row * cell, cell, cell)
    }
  }
}

function paintLip(ctx, { cell, cols, lip }) {
  if (lip.kind === 'dust') {
    paintDustLip(ctx, { cell, cols, dark: lip.dark, light: lip.light })
    return
  }
  paintRockLip(ctx, { cell, cols, dark: lip.dark, light: lip.light })
}

// Repaint one band at one quantised level. All coordinates are whole device
// pixels and every cell is exactly `cell` wide, so no edge is antialiased.
export function paintBand(
  ctx,
  { width, height, cell, cols, rows, upper, lower, level, lip = null },
) {
  ctx.fillStyle = upper
  ctx.fillRect(0, 0, width, height)

  if (lower && level > 0) {
    const threshold = (level / BAND_MAX_LEVEL) * 64
    ctx.fillStyle = lower

    for (let row = 0; row < rows; row += 1) {
      const matrixRow = (row % 8) * 8
      const y = row * cell
      for (let col = 0; col < cols; col += 1) {
        if (BAYER8[matrixRow + (col % 8)] < threshold) {
          ctx.fillRect(col * cell, y, cell, cell)
        }
      }
    }
  }

  if (lip) paintLip(ctx, { cell, cols, lip })
}
