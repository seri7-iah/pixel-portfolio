// Emberwing, the Contact sky dragon. 32x32 text-grid art, side view facing
// right. The silhouette takes after a jagged void dragon: obsidian scales,
// tall crystal spines, torn wings and violet light bleeding through cracks in
// the body. The one warm note is the ember-orange eye and its short trail. All
// art is hand-built for this project and stays clear of Minecraft's dragon.

const WIDTH = 32
const HEIGHT = 32

export const EMBERWING_PALETTE = {
  o: '#06020b', // outline, darker than the void sky
  s: '#0c0616', // obsidian spines, horns and claws
  S: '#4a2472', // spine edge catch-light
  b: '#3d1d66', // body base
  B: '#7a35d0', // body highlight
  d: '#241040', // body shade
  c: '#6a2aa8', // crystal shard
  C: '#c98aff', // crystal and crack glow
  v: '#521f8a', // underbody
  V: '#a85cf0', // underbody glow
  m: '#1c0c33', // near wing membrane
  M: '#a05cf0', // near membrane glow
  n: '#120722', // far wing membrane
  N: '#6a35a0', // far membrane glow
  w: '#0f0619', // wing bone and leading edge
  h: '#1a0c29', // horn base
  e: '#ff7a1a', // eye orange
  E: '#ffd447', // eye hot
  x: '#ff5a1f', // eye trail
  X: '#ffd447', // eye trail hot
  t: '#b06cff', // tail crystal tip
  g: '#c98aff', // violet motes
}

function emptyGrid() {
  return Array.from({ length: HEIGHT }, () => '.'.repeat(WIDTH))
}

function paint(grid, x, y, width, height, char) {
  for (let row = y; row < y + height; row += 1) {
    if (row < 0 || row >= HEIGHT) continue

    const line = grid[row].split('')
    for (let column = x; column < x + width; column += 1) {
      if (column < 0 || column >= WIDTH) continue
      line[column] = char
    }
    grid[row] = line.join('')
  }
}

function pixel(grid, x, y, char) {
  paint(grid, x, y, 1, 1, char)
}

function outline(grid) {
  const source = grid.map((row) => row.split(''))
  const next = grid.map((row) => row.split(''))

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (source[y][x] !== '.') continue

      const edge =
        (source[y - 1]?.[x] && source[y - 1][x] !== '.') ||
        (source[y + 1]?.[x] && source[y + 1][x] !== '.') ||
        (source[y][x - 1] && source[y][x - 1] !== '.') ||
        (source[y][x + 1] && source[y][x + 1] !== '.')

      if (edge) next[y][x] = 'o'
    }
  }

  for (let y = 0; y < HEIGHT; y += 1) grid[y] = next[y].join('')
}

function line(grid, x0, y0, x1, y1, char) {
  const dx = x1 - x0
  const dy = y1 - y0
  const steps = Math.max(Math.abs(dx), Math.abs(dy))

  for (let step = 0; step <= steps; step += 1) {
    const t = steps === 0 ? 0 : step / steps
    pixel(
      grid,
      Math.round(x0 + dx * t),
      Math.round(y0 + dy * t),
      char,
    )
  }
}

function fillPolygon(grid, points, char) {
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))

  for (let y = minY; y <= maxY; y += 1) {
    const hits = []

    for (let index = 0; index < points.length; index += 1) {
      const from = points[index]
      const to = points[(index + 1) % points.length]

      if (from.y === to.y) {
        if (y === from.y) hits.push(from.x, to.x)
        continue
      }

      const t = (y - from.y) / (to.y - from.y)
      if (t >= 0 && t <= 1) hits.push(from.x + (to.x - from.x) * t)
    }

    if (hits.length < 2) continue

    hits.sort((a, b) => a - b)
    for (let index = 0; index < hits.length - 1; index += 2) {
      const left = Math.round(hits[index])
      const right = Math.round(hits[index + 1])
      paint(grid, left, y, right - left + 1, 1, char)
    }
  }
}

function drawTail(grid, perched, sway = 0) {
  for (let x = 2; x <= 13; x += 1) {
    const t = (13 - x) / 11
    const top = (perched ? 24 : 18) + Math.round(t * 2)
    const height = 3 + Math.round(t * 3)

    paint(grid, x, top, 1, height, 'b')
    pixel(grid, x, top + height - 1, 'd')
    if (x % 3 === 0) pixel(grid, x, top + 1, 'V')
  }

  const tipY = perched ? 26 + sway : 19
  paint(grid, 0, tipY, 4, 3, 't')
  pixel(grid, 0, tipY, 'C')
  pixel(grid, 1, tipY + 2, 'c')

  // Jagged crystal spines along the top of the tail.
  const spikeBase = perched ? 23 : 16
  pixel(grid, 4, spikeBase + 3, 's')
  pixel(grid, 4, spikeBase + 4, 's')
  pixel(grid, 5, spikeBase + 4, 's')
  pixel(grid, 7, spikeBase + 2, 's')
  pixel(grid, 7, spikeBase + 3, 's')
  pixel(grid, 8, spikeBase + 3, 's')
  pixel(grid, 10, spikeBase + 2, 's')
  pixel(grid, 10, spikeBase + 3, 's')
  pixel(grid, 11, spikeBase + 3, 's')
  pixel(grid, 12, spikeBase + 2, 's')
  pixel(grid, 4, spikeBase + 3, 'S')
  pixel(grid, 7, spikeBase + 2, 'S')
  pixel(grid, 10, spikeBase + 2, 'S')
}

function drawBody(grid, perched) {
  if (perched) {
    // Seated torso with a glowing belly crack.
    paint(grid, 12, 16, 10, 3, 'b')
    paint(grid, 10, 19, 13, 5, 'b')
    paint(grid, 11, 24, 11, 2, 'v')
    paint(grid, 12, 22, 10, 2, 'v')
    paint(grid, 13, 23, 6, 1, 'V')
    pixel(grid, 15, 23, 'C')
    pixel(grid, 18, 23, 'C')
    paint(grid, 12, 17, 4, 1, 'B')
    paint(grid, 10, 20, 2, 3, 'B')
    paint(grid, 20, 21, 3, 3, 'd')

    paint(grid, 20, 17, 4, 8, 'b')
    paint(grid, 21, 22, 3, 3, 'v')

    paint(grid, 23, 10, 6, 2, 'b')
    paint(grid, 22, 12, 9, 7, 'b')
    paint(grid, 23, 19, 8, 2, 'b')
    paint(grid, 25, 21, 4, 1, 'b')
    paint(grid, 29, 16, 2, 3, 'b')
    pixel(grid, 31, 17, 'd')

    // Swept horns and a spiked crest.
    pixel(grid, 23, 9, 'h')
    pixel(grid, 22, 8, 'h')
    pixel(grid, 22, 7, 's')
    pixel(grid, 21, 6, 's')
    pixel(grid, 25, 7, 'h')
    pixel(grid, 25, 8, 's')
    pixel(grid, 24, 9, 's')
    // Shoulder shards.
    pixel(grid, 11, 18, 'c')
    pixel(grid, 12, 17, 'C')

    // Ember eye with a hot core.
    pixel(grid, 27, 13, 'e')
    paint(grid, 26, 14, 3, 1, 'e')
    pixel(grid, 26, 15, 'X')
    pixel(grid, 27, 15, 'E')
    pixel(grid, 28, 15, 'e')
    paint(grid, 26, 16, 3, 1, 'e')
    pixel(grid, 27, 17, 'e')

    pixel(grid, 29, 19, 'o')
    pixel(grid, 30, 19, 'o')

    pixel(grid, 14, 22, 'V')
    pixel(grid, 17, 22, 'V')
    pixel(grid, 20, 22, 'C')
    pixel(grid, 15, 23, 'V')
    pixel(grid, 18, 23, 'C')

    paint(grid, 14, 25, 3, 5, 'b')
    paint(grid, 15, 30, 2, 1, 'v')
    paint(grid, 19, 25, 3, 5, 'b')
    paint(grid, 20, 30, 2, 1, 'v')
    pixel(grid, 14, 31, 's')
    pixel(grid, 17, 31, 's')
    pixel(grid, 19, 31, 's')
    pixel(grid, 22, 31, 's')

    return
  }

  // Flying torso, chest and haunch.
  paint(grid, 12, 13, 9, 2, 'b')
  paint(grid, 10, 15, 13, 4, 'b')
  paint(grid, 12, 19, 9, 2, 'd')
  paint(grid, 12, 19, 9, 1, 'v')
  paint(grid, 13, 20, 7, 1, 'V')
  pixel(grid, 15, 19, 'C')
  pixel(grid, 18, 19, 'C')
  paint(grid, 12, 14, 4, 1, 'B')
  paint(grid, 10, 16, 2, 3, 'B')
  paint(grid, 20, 16, 3, 3, 'd')

  paint(grid, 20, 12, 4, 5, 'b')
  paint(grid, 22, 11, 3, 2, 'b')

  // Angular head, snout and jaw.
  paint(grid, 23, 9, 6, 2, 'b')
  paint(grid, 22, 11, 8, 4, 'b')
  paint(grid, 23, 15, 6, 2, 'b')
  paint(grid, 26, 17, 4, 1, 'b')
  paint(grid, 29, 13, 3, 2, 'b')
  paint(grid, 30, 15, 2, 1, 'b')
  pixel(grid, 31, 14, 'd')
  paint(grid, 24, 12, 3, 1, 'd')
  paint(grid, 25, 15, 3, 1, 'd')
  paint(grid, 27, 16, 4, 1, 'd')
  pixel(grid, 31, 17, 's')
  pixel(grid, 30, 18, 's')

  // Ember eye with a hot core.
  pixel(grid, 27, 12, 'e')
  paint(grid, 26, 13, 3, 1, 'e')
  pixel(grid, 26, 14, 'X')
  pixel(grid, 27, 14, 'E')
  pixel(grid, 28, 14, 'e')
  paint(grid, 26, 15, 3, 1, 'e')
  pixel(grid, 27, 16, 'e')

  pixel(grid, 30, 16, 'o')

  // Swept horns.
  pixel(grid, 21, 6, 's')
  pixel(grid, 21, 7, 's')
  pixel(grid, 22, 7, 's')
  pixel(grid, 22, 8, 's')
  pixel(grid, 23, 8, 'h')
  pixel(grid, 26, 6, 's')
  pixel(grid, 26, 7, 's')
  pixel(grid, 25, 7, 'h')
  pixel(grid, 25, 8, 's')
  pixel(grid, 24, 9, 's')

  // Shoulder shards and body cracks.
  pixel(grid, 11, 14, 'c')
  pixel(grid, 12, 13, 'C')
  pixel(grid, 10, 15, 'c')
  pixel(grid, 15, 17, 'C')
  pixel(grid, 16, 17, 'V')
  pixel(grid, 18, 18, 'C')

  pixel(grid, 14, 20, 'V')
  pixel(grid, 17, 20, 'V')
  pixel(grid, 20, 20, 'C')
  pixel(grid, 15, 21, 'V')
  pixel(grid, 18, 21, 'C')

  // Legs and obsidian claws.
  paint(grid, 14, 21, 3, 2, 'b')
  paint(grid, 15, 23, 2, 1, 'v')
  paint(grid, 19, 21, 3, 2, 'b')
  paint(grid, 20, 23, 2, 1, 'v')
  pixel(grid, 14, 23, 's')
  pixel(grid, 16, 23, 's')
  pixel(grid, 19, 23, 's')
  pixel(grid, 21, 23, 's')
}

// The dorsal crest sits on top of the wings, so jagged black shards cut across
// the violet membrane the way they do in the reference silhouette.
function drawSpines(grid, perched) {
  if (perched) {
    pixel(grid, 11, 14, 's')
    pixel(grid, 11, 15, 's')
    pixel(grid, 12, 15, 's')
    pixel(grid, 14, 12, 's')
    pixel(grid, 14, 13, 's')
    pixel(grid, 15, 13, 's')
    pixel(grid, 17, 11, 's')
    pixel(grid, 17, 12, 's')
    pixel(grid, 18, 12, 's')
    pixel(grid, 20, 12, 's')
    pixel(grid, 20, 13, 's')
    pixel(grid, 21, 13, 's')
    pixel(grid, 23, 13, 's')
    pixel(grid, 23, 14, 's')
    pixel(grid, 24, 14, 's')
    pixel(grid, 14, 12, 'S')
    pixel(grid, 17, 11, 'S')
    pixel(grid, 20, 12, 'S')
    return
  }

  pixel(grid, 11, 12, 's')
  pixel(grid, 11, 11, 's')
  pixel(grid, 12, 11, 's')
  pixel(grid, 13, 9, 's')
  pixel(grid, 13, 10, 's')
  pixel(grid, 14, 10, 's')
  pixel(grid, 15, 7, 's')
  pixel(grid, 15, 8, 's')
  pixel(grid, 16, 8, 's')
  pixel(grid, 17, 6, 's')
  pixel(grid, 17, 7, 's')
  pixel(grid, 18, 7, 's')
  pixel(grid, 19, 8, 's')
  pixel(grid, 19, 9, 's')
  pixel(grid, 20, 9, 's')
  pixel(grid, 21, 10, 's')
  pixel(grid, 21, 11, 's')
  pixel(grid, 22, 11, 's')
  pixel(grid, 11, 11, 'S')
  pixel(grid, 13, 9, 'S')
  pixel(grid, 15, 7, 'S')
  pixel(grid, 17, 6, 'S')
  pixel(grid, 19, 8, 'S')
  pixel(grid, 21, 10, 'S')
}

function drawFoldedWing(grid, dx, dy, far) {
  const membrane = far ? 'n' : 'm'
  const glow = far ? 'N' : 'M'

  paint(grid, 9 + dx, 13 + dy, 7, 1, 'w')
  paint(grid, 8 + dx, 14 + dy, 9, 2, membrane)
  paint(grid, 9 + dx, 16 + dy, 8, 2, membrane)
  paint(grid, 10 + dx, 18 + dy, 6, 2, membrane)
  paint(grid, 11 + dx, 20 + dy, 4, 1, 'w')

  pixel(grid, 10 + dx, 14 + dy, glow)
  pixel(grid, 11 + dx, 15 + dy, glow)
  pixel(grid, 12 + dx, 16 + dy, glow)
  pixel(grid, 13 + dx, 17 + dy, glow)
  pixel(grid, 14 + dx, 18 + dy, glow)

  // Torn trailing edge and black talon tips.
  pixel(grid, 8 + dx, 14 + dy, 's')
  pixel(grid, 16 + dx, 15 + dy, 's')
  pixel(grid, 17 + dx, 16 + dy, 's')
  pixel(grid, 15 + dx, 19 + dy, 's')
  pixel(grid, 11 + dx, 20 + dy, 's')
  pixel(grid, 13 + dx, 20 + dy, 's')
}

const WING_POSES = [
  {
    tip: [1, 1],
    trailing: [
      [12, 13],
      [10, 15],
      [7, 14],
      [4, 10],
      [2, 6],
    ],
  },
  {
    tip: [1, 5],
    trailing: [
      [12, 13],
      [10, 15],
      [7, 14],
      [4, 11],
      [2, 8],
    ],
  },
  {
    tip: [2, 10],
    trailing: [
      [12, 14],
      [10, 15],
      [7, 15],
      [5, 13],
      [3, 12],
    ],
  },
  {
    tip: [2, 16],
    trailing: [
      [12, 14],
      [10, 15],
      [7, 16],
      [5, 16],
      [3, 17],
    ],
  },
]

function drawFlyingWing(grid, pose, far) {
  const offsetX = far ? -2 : 0
  const offsetY = far ? 1 : 0
  const [tipX, tipY] = WING_POSES[pose].tip
  const tip = { x: tipX + offsetX, y: tipY + offsetY }
  const rootTop = { x: 12 + offsetX, y: 8 + offsetY }
  const rootBottom = { x: 14 + offsetX, y: 15 + offsetY }
  const trailing = WING_POSES[pose].trailing.map(([x, y]) => ({
    x: x + offsetX,
    y: y + offsetY,
  }))
  const membrane = far ? 'n' : 'm'
  const glow = far ? 'N' : 'M'
  const edge = 'w'
  const polygon = [tip, rootTop, rootBottom, ...trailing]

  fillPolygon(grid, polygon, membrane)
  line(grid, tip.x, tip.y, rootTop.x, rootTop.y, edge)
  line(grid, rootTop.x, rootTop.y, rootBottom.x, rootBottom.y, edge)

  let previous = rootBottom
  for (const point of trailing) {
    line(grid, previous.x, previous.y, point.x, point.y, glow)
    previous = point
  }
  line(grid, previous.x, previous.y, tip.x, tip.y, glow)

  // Violet light running through the membrane and a hot shoulder joint.
  line(grid, rootTop.x, rootTop.y + 1, trailing[1].x, trailing[1].y - 1, glow)
  line(grid, rootBottom.x - 1, rootBottom.y - 1, trailing[2].x, trailing[2].y, glow)
  pixel(grid, rootTop.x, rootTop.y, 'C')
  pixel(grid, rootBottom.x, rootBottom.y, 'c')

  // Obsidian claws breaking the leading edge.
  pixel(grid, rootTop.x - 1, rootTop.y - 1, 's')
  pixel(grid, rootTop.x - 2, rootTop.y - 2, 's')
  pixel(
    grid,
    Math.round((tip.x + rootTop.x) / 2) - 1,
    Math.round((tip.y + rootTop.y) / 2) - 1,
    's',
  )

  if (!far) {
    pixel(
      grid,
      Math.round((tip.x + rootTop.x) / 2) + 1,
      Math.round((tip.y + rootTop.y) / 2) + 1,
      'g',
    )
    pixel(grid, 8, 10, 'g')
    pixel(grid, 9, 11, 'g')
  }

  pixel(grid, tip.x, tip.y, 's')
  for (const point of trailing) pixel(grid, point.x, point.y, 's')
}

function addEyeTrail(grid, length, y) {
  paint(grid, 26 - length, y, length, 1, 'x')
  pixel(grid, 25, y, 'X')
  pixel(grid, 24, y + 1, 'x')
  if (length > 2) pixel(grid, 22, y - 1, 'x')
}

function addEmbers(grid, pose) {
  const embers = [
    [
      [2, 13, 'g'],
      [5, 25, 'g'],
      [19, 26, 'C'],
    ],
    [
      [3, 11, 'g'],
      [6, 24, 'g'],
      [21, 27, 'g'],
    ],
    [
      [1, 15, 'g'],
      [7, 25, 'g'],
      [18, 26, 'C'],
    ],
    [
      [4, 12, 'g'],
      [8, 24, 'g'],
      [20, 27, 'g'],
    ],
  ]

  for (const [x, y, char] of embers[pose]) pixel(grid, x, y, char)
}

function buildFlyingFrame(pose) {
  const grid = emptyGrid()

  drawFlyingWing(grid, pose, true)
  drawTail(grid, false)
  drawFlyingWing(grid, pose, false)
  drawBody(grid, false)
  drawSpines(grid, false)
  outline(grid)
  addEyeTrail(grid, 3 + (pose % 2), 13)
  addEmbers(grid, pose)

  return grid
}

function buildPerchedFrame(sway) {
  const grid = emptyGrid()

  drawFoldedWing(grid, -2, 1, true)
  drawTail(grid, true, sway)
  drawBody(grid, true)
  drawFoldedWing(grid, 0, 0, false)
  drawSpines(grid, true)
  outline(grid)
  addEyeTrail(grid, 3, 14)

  return grid
}

export const EMBERWING_FLY_FRAMES = [0, 1, 2, 3].map(buildFlyingFrame)
export const EMBERWING_PERCH_FRAMES = [0, -1].map(buildPerchedFrame)
