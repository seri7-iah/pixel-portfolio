// Phase 3l: original pixel art for the Celestial Gate. Every grid is plain text,
// one character per 4px cell, so it stays hard-edged at any size.
//   #  main body      o  highlight      .  empty
//   h  hard pixel halo (added by withHalo)
//   S  constellation star              d  dotted constellation line
// Nothing here is traced or copied from another game.

// Crescent opening to the right, 6 cells (24px).
export const CRESCENT_MD = [
  '.o##..',
  '####..',
  '###...',
  '##....',
  '###...',
  '.###..',
]

// Smaller crescent for the hanging anchor, 5 cells (20px).
export const CRESCENT_SM = [
  '.o###',
  '####.',
  '###..',
  '###..',
  '.o###',
]

// Four-point star used beside the crest and on the signpost crown (20px).
export const STAR4 = [
  '..#..',
  '..#..',
  '#####',
  '..#..',
  '..#..',
]

// The same star turned into an X. The two swap with steps() for a twinkle.
export const STAR4_ALT = [
  '#...#',
  '.#.#.',
  '..#..',
  '.#.#.',
  '#...#',
]

// 12px plus star mounted on the four frame corners.
export const STAR_CORNER = [
  '.#.',
  '###',
  '.#.',
]

// Tiny pixel worlds for the two orbiting planets.
export const PLANET = [
  '.###.',
  '##o##',
  '#####',
  '###o#',
  '.###.',
]

export const PLANET_SM = [
  '.##.',
  '#o##',
  '####',
  '.##.',
]

// Celestial tablets. `#` is tinted with the zone colour through CSS currentColor
// variables, `o` is a star-white highlight. Layouts stay 8x8 like the old set.
export const GATE_ICONS = {
  house: [
    '...##...',
    '..####..',
    '.######.',
    '########',
    '##oooo##',
    '##.##.##',
    '##.##.##',
    '########',
  ],
  crystal: [
    '...##...',
    '..####..',
    '.######.',
    '##o##o##',
    '.######.',
    '..####..',
    '...##...',
    '........',
  ],
  flame: [
    '....#...',
    '...##...',
    '..####..',
    '..#o##..',
    '.##oo##.',
    '.##oo##.',
    '..####..',
    '...##...',
  ],
  star: [
    '...##...',
    '...##...',
    '..####..',
    '###oo###',
    '..####..',
    '...##...',
    '...##...',
    '........',
  ],
}

// A sparse, dithered halo around a silhouette. One extra cell on every side.
export function withHalo(rows) {
  const height = rows.length
  const width = rows[0].length
  const filled = (x, y) =>
    y >= 0 && y < height && x >= 0 && x < width && rows[y][x] !== '.'

  return Array.from({ length: height + 2 }, (_, gy) =>
    Array.from({ length: width + 2 }, (_, gx) => {
      const sx = gx - 1
      const sy = gy - 1
      if (filled(sx, sy)) return rows[sy][sx]
      // A checker of single cells keeps the halo hard, sparse and slight.
      if ((gx + gy) % 2 !== 0) return '.'
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue
          if (filled(sx + dx, sy + dy)) return 'h'
        }
      }
      return '.'
    }).join(''),
  )
}

export const CRESCENT_MD_HALO = withHalo(CRESCENT_MD)
export const CRESCENT_SM_HALO = withHalo(CRESCENT_SM)
export const STAR_CORNER_HALO = withHalo(STAR_CORNER)

// Two constellations for the left and right frame edges. The strip is only four
// cells wide so nothing can reach the photograph, and the stars alternate
// between columns 1 and 2 to form a gentle zigzag.
const CONST_COLS = 4
const CONST_ROWS = 28
const CONST_STARS = [
  [1, 1],
  [2, 4],
  [1, 7],
  [2, 10],
  [1, 13],
  [2, 16],
  [1, 19],
  [2, 22],
  [1, 25],
]

const STAR_PLUS = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]

const STAR_CROSS = [
  [0, 0],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
]

function dottedLine([x0, y0], [x1, y1], out) {
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  let step = 0
  let x = x0
  let y = y0

  for (;;) {
    // Every second cell, so the link reads as a dotted pixel line.
    if (step % 2 === 1) out.add(`${x},${y}`)
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x += sx
    }
    if (e2 <= dx) {
      err += dx
      y += sy
    }
    step += 1
  }
}

function buildConstellation(mask) {
  const cells = Array.from({ length: CONST_ROWS }, () =>
    Array(CONST_COLS).fill('.'),
  )
  const line = new Set()
  for (let index = 0; index < CONST_STARS.length - 1; index += 1) {
    dottedLine(CONST_STARS[index], CONST_STARS[index + 1], line)
  }
  line.forEach((key) => {
    const [x, y] = key.split(',').map(Number)
    if (x >= 0 && x < CONST_COLS && y >= 0 && y < CONST_ROWS) cells[y][x] = 'd'
  })
  CONST_STARS.forEach(([sx, sy]) => {
    mask.forEach(([dx, dy]) => {
      const x = sx + dx
      const y = sy + dy
      if (x >= 0 && x < CONST_COLS && y >= 0 && y < CONST_ROWS) cells[y][x] = 'S'
    })
  })
  return cells.map((row) => row.join(''))
}

export const CONSTELLATION_A = buildConstellation(STAR_PLUS)
export const CONSTELLATION_B = buildConstellation(STAR_CROSS)

// The signpost spire: a chain of 16px diamonds with a gold stud on each
// widest row. Diamonds alternate violet and indigo, so the slim column reads
// as stacked stones rather than a wooden post. 72 rows is 288px, tall enough
// for the full signpost; shorter layouts simply crop the repeating tail.
function buildSpire(rows) {
  const out = []
  for (let y = 0; y < rows; y += 1) {
    const unit = y % 4
    const tone = Math.floor(y / 4) % 2 === 0 ? 'v' : 'i'
    if (unit === 0 || unit === 3) out.push(`.${tone}${tone}.`)
    else out.push(`o${tone}${tone}o`)
  }
  return out
}

export const SPIRE = buildSpire(72)
