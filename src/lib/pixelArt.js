// Original pixel characters drawn as text grids (16x16, plus the 16x32
// people). Every row is 16 characters; "." is transparent and each letter
// maps to a color in the matching palette. All art is hand-drawn for this
// project.

const WIDTH = 16

// Empty text-grid frame. "." is transparent and every other character is a
// palette key, so the art stays a plain array of strings.
function emptyGrid(height) {
  return Array.from({ length: height }, () => '.'.repeat(WIDTH))
}

// Paints a block of one colour. Side-view poses are assembled from rectangles
// so each limb can move without copying a whole 16x32 frame by hand.
function paint(grid, x, y, width, height, char) {
  for (let row = y; row < y + height; row += 1) {
    if (row < 0 || row >= grid.length) continue

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

export const PIX_PALETTE = {
  K: '#1a1626', // black hair
  R: '#e05a3c', // red-orange headband
  S: '#f0c39b', // warm skin
  E: '#221a2b', // dark eye
  M: '#b9825c', // mouth
  B: '#2f3d66', // ink-blue sleeve
  C: '#f1e3c4', // cream hoodie
  G: '#4f8f52', // green backpack
  P: '#3b4159', // dark slate pants
  D: '#292d40', // darker slate (back leg)
  A: '#d9892b', // amber boots
}

export const GLOOP_PALETTE = {
  o: '#123c3d', // outline
  g: '#46cdb8', // jelly body
  G: '#93f1e2', // jelly sheen
  d: '#2a9a8a', // jelly shade
  w: '#f4ecd8', // eye white
  e: '#16202f', // pupil
}

// Pix is drawn in side view, facing right. The art is split into separate part
// layers so the walk cycle can move the limbs independently without redrawing
// the head, backpack or torso. Each part is a small text grid plus the row it
// starts on inside the 16x32 frame.
function block(count, row) {
  return Array.from({ length: count }, () => row)
}

const PIX_HEAD = {
  y: 0,
  rows: [
    '....KKKKKKKK....',
    '....KKKKKKKK....',
    '....RRRRRRRR....',
    '....KKKSSSSS....',
    '....KKKSSSES....',
    '....KKKSSSSS....',
    '....KKKSSSSM....',
    '....KKSSSSSS....',
  ],
}

const PIX_HEAD_BLINK = {
  y: 0,
  rows: [
    PIX_HEAD.rows[0],
    PIX_HEAD.rows[1],
    PIX_HEAD.rows[2],
    PIX_HEAD.rows[3],
    '....KKKSSSSS....',
    PIX_HEAD.rows[5],
    PIX_HEAD.rows[6],
    PIX_HEAD.rows[7],
  ],
}

// The cream hoodie sits behind the arm. The arm reveals it as it swings.
const PIX_TORSO = { y: 8, rows: block(12, '......CCCC......') }

// Green backpack, always behind the torso and the swinging arm.
const PIX_BACKPACK = { y: 9, rows: block(9, '...GGG..........') }

// Ink-blue sleeve with a warm skin hand. The same part is used for the back
// arm; it is drawn first and is hidden by the torso in the idle pose.
const PIX_ARM = {
  y: 8,
  rows: [...block(8, '......BBBB......'), ...block(2, '......SSSS......')],
}

// Front leg uses slate P, back leg uses the darker D so both read when they
// swing apart. Boots are a separate layer so they can lift off the ground
// while the rest of the body keeps its breathing bob. The toes point right.
const PIX_FRONT_LEG = { y: 20, rows: block(8, '......PPPP......') }
const PIX_BACK_LEG = { y: 20, rows: block(8, '......DDDD......') }
const PIX_BOOT = { y: 28, rows: block(4, '......AAAAA.....') }

function stampPart(grid, part, dx = 0, dy = 0) {
  for (let row = 0; row < part.rows.length; row += 1) {
    const y = part.y + row + dy
    if (y < 0 || y >= grid.length) continue

    const line = grid[y].split('')
    const source = part.rows[row]

    for (let column = 0; column < source.length; column += 1) {
      const color = source[column]
      if (color === '.') continue

      const x = column + dx
      if (x < 0 || x >= WIDTH) continue
      line[x] = color
    }

    grid[y] = line.join('')
  }
}

// Composites one 16x32 frame. Offsets are whole pixels; `lift` raises a leg
// one pixel so the boot clears the ground during its forward swing.
function composePix({
  blink = false,
  bob = 0,
  frontLeg = 0,
  backLeg = 0,
  frontArm = 0,
  backArm = 0,
  frontLift = 0,
  backLift = 0,
} = {}) {
  const grid = Array.from({ length: 32 }, () => '.'.repeat(WIDTH))

  stampPart(grid, PIX_ARM, backArm, bob)
  stampPart(grid, PIX_BACKPACK, 0, bob)
  stampPart(grid, PIX_BACK_LEG, backLeg, bob - backLift)
  stampPart(grid, PIX_BOOT, backLeg, -backLift)
  stampPart(grid, PIX_TORSO, 0, bob)
  stampPart(grid, PIX_FRONT_LEG, frontLeg, bob - frontLift)
  stampPart(grid, PIX_BOOT, frontLeg, -frontLift)
  stampPart(grid, PIX_ARM, frontArm, bob)
  stampPart(grid, blink ? PIX_HEAD_BLINK : PIX_HEAD, 0, bob)

  return grid
}

// Eight-frame walk: the front leg and back arm share one swing, the back leg
// and front arm swing the other way. The cycle passes through +/-3 pixels and
// the upper body dips one pixel twice per loop. Frame 0 is the neutral pose,
// so the walk starts cleanly from idle.
const PIX_SWING = [0, 2, 3, 2, 0, -2, -3, -2]

function buildPixFrames() {
  const idle = [composePix(), composePix({ bob: 1 })]
  const idleBlink = [
    composePix({ blink: true }),
    composePix({ blink: true, bob: 1 }),
  ]

  const walk = PIX_SWING.map((swing, index) =>
    composePix({
      bob: index === 1 || index === 5 ? 1 : 0,
      frontLeg: swing,
      backLeg: -swing,
      frontArm: -swing,
      backArm: swing,
      frontLift: swing > 0 ? 1 : 0,
      backLift: swing < 0 ? 1 : 0,
    }),
  )

  // 1 while either boot is off the ground, used by the shadow.
  const lift = PIX_SWING.map((swing) => (swing === 0 ? 0 : 1))

  return { idle, idleBlink, walk, lift }
}

export const PIX_FRAMES = buildPixFrames()

// Gloop: a side-view teal jelly blob with one big eye on its facing side. The
// body is built from row spans, so the same drawing can squash before a hop,
// stretch in the air and flatten on landing.
const GLOOP_REST = {
  top: 4,
  spans: [
    [5, 10],
    [4, 11],
    [3, 12],
    [2, 13],
    [2, 13],
    [2, 13],
    [2, 13],
    [2, 13],
    [2, 13],
    [3, 12],
    [4, 11],
    [5, 10],
  ],
}

const GLOOP_BREATH = {
  top: 5,
  spans: [
    [5, 10],
    [3, 12],
    [2, 13],
    [2, 13],
    [2, 13],
    [2, 13],
    [2, 13],
    [2, 13],
    [3, 12],
    [4, 11],
    [5, 10],
  ],
}

const GLOOP_SQUAT = {
  top: 7,
  spans: [
    [4, 11],
    [2, 13],
    [1, 14],
    [1, 14],
    [1, 14],
    [1, 14],
    [1, 14],
    [2, 13],
    [3, 12],
  ],
}

const GLOOP_LAUNCH = {
  top: 3,
  spans: [
    [6, 9],
    [5, 10],
    [4, 11],
    [3, 12],
    [3, 12],
    [3, 12],
    [3, 12],
    [3, 12],
    [3, 12],
    [3, 12],
    [4, 11],
    [5, 10],
    [6, 9],
  ],
}

const GLOOP_AIR = {
  top: 2,
  spans: [
    [6, 9],
    [5, 10],
    [4, 11],
    [3, 12],
    [3, 12],
    [3, 12],
    [3, 12],
    [3, 12],
    [3, 12],
    [3, 12],
    [4, 11],
    [4, 11],
    [5, 10],
    [6, 9],
  ],
}

const GLOOP_DESCEND = {
  top: 4,
  spans: [
    [6, 9],
    [5, 10],
    [4, 11],
    [3, 12],
    [3, 12],
    [3, 12],
    [3, 12],
    [3, 12],
    [3, 12],
    [4, 11],
    [5, 10],
    [6, 9],
  ],
}

const GLOOP_LAND = {
  top: 8,
  spans: [
    [4, 11],
    [2, 13],
    [1, 14],
    [1, 14],
    [1, 14],
    [2, 13],
    [3, 12],
    [4, 11],
  ],
}

function composeGloop(pose, blink = false) {
  const grid = emptyGrid(16)
  const { top, spans } = pose
  const last = spans.length - 1

  spans.forEach(([left, right], index) => {
    const y = top + index

    if (index === 0 || index === last) {
      paint(grid, left, y, right - left + 1, 1, 'o')
      return
    }

    pixel(grid, left, y, 'o')
    pixel(grid, right, y, 'o')
    paint(grid, left + 1, y, right - left - 1, 1, 'g')
  })

  // Jelly sheen on the top-left and a darker belly.
  const shine = spans[1]
  paint(grid, shine[0] + 1, top + 1, 2, 1, 'G')
  pixel(grid, shine[0] + 1, top + 2, 'G')

  const belly = spans[last - 1]
  paint(grid, belly[0] + 1, top + last - 1, belly[1] - belly[0] - 1, 1, 'd')

  // One eye on the facing (right) side. The pupil sits at the right edge of
  // the white so the gaze follows the direction the sprite faces.
  const eyeIndex = Math.max(1, Math.round(last * 0.36))
  const eyeRow = spans[eyeIndex]
  const eyeX = eyeRow[1] - 4
  const eyeY = top + eyeIndex

  if (blink) {
    paint(grid, eyeX, eyeY + 1, 4, 1, 'd')
  } else {
    paint(grid, eyeX, eyeY, 4, 3, 'w')
    paint(grid, eyeX + 2, eyeY + 1, 2, 1, 'e')
  }

  return grid
}

export const GLOOP_FRAMES = {
  idle: [composeGloop(GLOOP_REST), composeGloop(GLOOP_BREATH)],
  idleBlink: [
    composeGloop(GLOOP_REST, true),
    composeGloop(GLOOP_BREATH, true),
  ],
  hop: [
    composeGloop(GLOOP_SQUAT),
    composeGloop(GLOOP_LAUNCH),
    composeGloop(GLOOP_AIR),
    composeGloop(GLOOP_AIR),
    composeGloop(GLOOP_DESCEND),
    composeGloop(GLOOP_LAND),
  ],
  // 0 on the ground, 1 at the top of the hop. Drives the body lift and the
  // shadow shrink without touching the frame timing.
  lift: [0, 0.45, 1, 1, 0.55, 0],
}

// Mossling: a slow, friendly side-view shambler. Moss-green skin, an ochre
// tunic with a darker patch and a torn hem, tattered brown pants, one tired
// eye on the facing side and a small leaf sprout. Original design; it is not
// a Minecraft zombie.
export const MOSS_PALETTE = {
  m: '#7fa864', // moss skin
  M: '#a0c684', // moss highlight
  d: '#5d8049', // moss shade
  e: '#22301f', // tired eye
  r: '#a9854e', // ochre tunic
  R: '#c5a468', // tunic highlight
  q: '#795a33', // darker tunic patch
  p: '#5d4426', // torn tunic hem
  k: '#463527', // dark brown pants
  K: '#33261b', // pants shade
  l: '#7ec95b', // leaf
  L: '#4d8f3c', // leaf shade
  s: '#3f5c2e', // sprout stem
}

const MOSS_HEAD = {
  y: 2,
  rows: [
    '.....mmmmmm.....',
    '....mmmmmmmm....',
    '....mMmmmmmm....',
    '....mmmmemmm....',
    '....mmmmmmmmm...',
    '....mmmmmmmd....',
    '....mdddddm.....',
    '.....mmmmm......',
  ],
}

const MOSS_LEAF = {
  y: 0,
  rows: ['......l.........', '.....lLl........', '.......s........'],
}

// 16x32 side view facing right. The head and tunic sit one column ahead of the
// legs, which gives the permanent forward lean; the front arm swings over the
// tunic and the back arm is a sliver behind it.
function composeMoss({
  bob = 0,
  swing = 0,
  frontLift = 0,
  backLift = 0,
  blink = false,
} = {}) {
  const grid = emptyGrid(32)

  // Back arm and back leg first so the torso overlaps them.
  paint(grid, 5 + swing, 11 + bob, 2, 8, 'm')
  paint(grid, 5 + swing, 19 + bob, 2, 2, 'M')
  paint(grid, 5 - swing, 20, 3, 9, 'K')
  paint(grid, 5 - swing, 29 - backLift, 4, 3, 'd')

  // Ochre tunic with a darker patch, worn highlight and a torn hem.
  paint(grid, 6, 10 + bob, 6, 9, 'r')
  paint(grid, 6, 10 + bob, 1, 9, 'R')
  paint(grid, 9, 12 + bob, 2, 5, 'q')
  paint(grid, 6, 17 + bob, 6, 2, 'r')
  paint(grid, 4, 19 + bob, 9, 1, 'p')
  paint(grid, 4, 20 + bob, 4, 1, 'p')
  paint(grid, 9, 20 + bob, 4, 1, 'p')
  pixel(grid, 5, 21 + bob, 'p')
  pixel(grid, 7, 21 + bob, 'p')
  pixel(grid, 10, 21 + bob, 'p')

  // Front leg, then the front arm over the tunic.
  paint(grid, 8 + swing, 20, 3, 9, 'k')
  paint(grid, 8 + swing, 29 - frontLift, 4, 3, 'm')
  pixel(grid, 8 + swing + 3, 31 - frontLift, 'd')

  paint(grid, 11 - swing, 11 + bob, 2, 8, 'm')
  paint(grid, 11 - swing, 19 + bob, 2, 2, 'M')

  stampPart(grid, MOSS_HEAD, 0, bob)
  stampPart(grid, MOSS_LEAF, 0, bob)

  // Closed eye for the idle blink.
  if (blink) pixel(grid, 9, 5 + bob, 'd')

  return grid
}

const MOSS_SWING = [0, 1, 2, 1, 0, -1, -2, -1]

export const MOSS_FRAMES = {
  idle: [composeMoss(), composeMoss({ bob: 1 })],
  idleBlink: [composeMoss({ blink: true }), composeMoss({ bob: 1, blink: true })],
  walk: MOSS_SWING.map((swing, index) =>
    composeMoss({
      bob: index === 1 || index === 5 ? 1 : 0,
      swing,
      frontLift: swing > 0 ? 1 : 0,
      backLift: swing < 0 ? 1 : 0,
    }),
  ),
}

// Bonemoss: an original skeleton-zombie hybrid for the cave, now in side view.
// Square bone skull with a glowing teal eye on the facing side and a dark
// mouth line, plain bone torso with no ribcage pattern, mossy shoulder, a
// ragged slate-green cloth at the waist, arms hanging down and no weapon.
export const BONEMOSS_PALETTE = {
  b: '#cfcdb8', // skull bone
  n: '#b0ae99', // body bone
  d: '#83836f', // bone shade
  e: '#5be3d0', // glowing teal eye
  m: '#5f8a4c', // moss patch
  M: '#7fae64', // moss highlight
  s: '#586c62', // slate-green cloth
  S: '#728878', // cloth highlight
  x: '#3a4640', // cloth shade
  y: '#5be3d0', // shoulder crystal (dark variant only)
}

const BONEMOSS_HEAD = {
  y: 1,
  rows: [
    '....bbbbbbbb....',
    '....bnnnnnnb....',
    '....bnnnnnnb....',
    '....bnnnneeb....',
    '....bnnnnnnb....',
    '....bnnnnnnb....',
    '....bnnndddb....',
    '....bddddddb....',
  ],
}

function composeBonemoss({
  bob = 0,
  swing = 0,
  frontLift = 0,
  backLift = 0,
  blink = false,
  crystal = false,
} = {}) {
  const grid = emptyGrid(32)

  // Back arm and back leg.
  paint(grid, 4 + swing, 10 + bob, 2, 8, 'n')
  paint(grid, 4 + swing, 18 + bob, 2, 2, 'b')
  paint(grid, 5 - swing, 20, 3, 9, 'd')
  paint(grid, 5 - swing, 29 - backLift, 4, 3, 'd')

  // Plain bone torso, mossy shoulder and a ragged cloth at the waist.
  paint(grid, 5, 9 + bob, 6, 11, 'n')
  paint(grid, 5, 9 + bob, 1, 11, 'd')
  paint(grid, 6, 9 + bob, 2, 2, 'm')
  pixel(grid, 6, 9 + bob, 'M')
  paint(grid, 5, 17 + bob, 6, 1, 's')
  paint(grid, 5, 18 + bob, 7, 1, 'S')
  paint(grid, 4, 19 + bob, 8, 1, 's')
  paint(grid, 8, 19 + bob, 3, 1, 'x')
  pixel(grid, 4, 20 + bob, 's')
  pixel(grid, 7, 20 + bob, 's')
  pixel(grid, 10, 20 + bob, 'x')

  // Front leg and the front arm hanging over the torso.
  paint(grid, 8 + swing, 20, 3, 9, 'n')
  paint(grid, 8 + swing, 29 - frontLift, 4, 3, 'b')
  paint(grid, 11 - swing, 10 + bob, 2, 8, 'n')
  paint(grid, 11 - swing, 18 + bob, 2, 2, 'b')

  stampPart(grid, BONEMOSS_HEAD, 0, bob)

  // Dark variant only: one small teal crystal on the front shoulder.
  if (crystal) {
    pixel(grid, 10, 10 + bob, 'y')
    pixel(grid, 11, 10 + bob, 'y')
    pixel(grid, 10, 11 + bob, 'y')
  }

  // The eye dims to a closed socket line on the idle blink.
  if (blink) paint(grid, 9, 4 + bob, 2, 1, 'd')

  return grid
}

const BONEMOSS_SWING = [0, 1, 2, 1, 0, -1, -2, -1]

function buildBonemoss(crystal) {
  const walk = BONEMOSS_SWING.map((swing, index) =>
    composeBonemoss({
      bob: index === 1 || index === 5 ? 1 : 0,
      swing,
      frontLift: swing > 0 ? 1 : 0,
      backLift: swing < 0 ? 1 : 0,
      crystal,
    }),
  )

  return {
    idle: [
      composeBonemoss({ crystal }),
      composeBonemoss({ bob: 1, crystal }),
    ],
    idleBlink: [
      composeBonemoss({ blink: true, crystal }),
      composeBonemoss({ bob: 1, blink: true, crystal }),
    ],
    walk,
  }
}

export const BONEMOSS_FRAMES = buildBonemoss(false)
export const BONEMOSS_DARK_PALETTE = {
  ...BONEMOSS_PALETTE,
  b: '#a3a292',
  n: '#8b8978',
  d: '#686857',
}
export const BONEMOSS_DARK_FRAMES = buildBonemoss(true)

// Foxel: a square little side-view fox facing right, with the tail behind.
// Original design. The parts are filled first and the whole silhouette then
// gets one clean pixel outline, so the tail, head and legs stay distinct at
// 16x16.
export const FOX_PALETTE = {
  o: '#3d2116', // outline
  f: '#e07a2f', // fur
  F: '#f7a552', // ear and fur highlight
  w: '#f4ecd8', // muzzle, belly and tail tip
  e: '#1a1a2e', // eye
  n: '#2a1a20', // nose and paws
}

function filled(grid, x, y) {
  const row = grid[y]
  return Boolean(row && row[x] && row[x] !== '.')
}

// Outlines the outside of the silhouette only. Reading from a snapshot keeps
// the new outline pixels from growing a second ring.
function outline(grid) {
  const source = grid.map((line) => line.split(''))
  const next = grid.map((line) => line.split(''))

  for (let y = 0; y < source.length; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (source[y][x] !== '.') continue

      const near =
        filled(source, x, y - 1) ||
        filled(source, x, y + 1) ||
        filled(source, x - 1, y) ||
        filled(source, x + 1, y)

      if (near) next[y][x] = 'o'
    }
  }

  return next.map((line) => line.join(''))
}

function composeFox({
  bob = 0,
  front = 0,
  back = 0,
  frontLift = 0,
  backLift = 0,
  tail = 0,
  ear = 0,
  blink = false,
} = {}) {
  const grid = emptyGrid(16)

  // Tail behind the body: fur steps up to a white tip.
  paint(grid, 0, 3 + tail, 2, 2, 'w')
  paint(grid, 1, 5 + tail, 2, 2, 'f')
  paint(grid, 2, 7 + tail, 2, 2, 'f')

  // Back leg, body, front leg.
  paint(grid, 3 + back, 12 + bob, 2, 3 - backLift, 'f')
  paint(grid, 3 + back, 15 - backLift, 2, 1, 'n')
  paint(grid, 8 + front, 12 + bob, 2, 3 - frontLift, 'f')
  paint(grid, 8 + front, 15 - frontLift, 2, 1, 'n')

  paint(grid, 3, 8 + bob, 7, 5, 'f')
  paint(grid, 4, 11 + bob, 5, 1, 'w')

  // Ears sit behind the head, then the head and muzzle.
  paint(grid, 7, 1 + bob + ear, 2, 3, 'f')
  paint(grid, 12, 1 + bob, 2, 3, 'f')
  pixel(grid, 7, 1 + bob + ear, 'F')
  pixel(grid, 12, 1 + bob, 'F')
  paint(grid, 8, 4 + bob, 7, 6, 'f')

  paint(grid, 13, 7 + bob, 2, 2, 'w')
  pixel(grid, 15, 7 + bob, 'n')

  if (blink) {
    paint(grid, 10, 6 + bob, 2, 1, 'o')
  } else {
    paint(grid, 10, 5 + bob, 2, 2, 'e')
  }

  return outline(grid)
}

const FOX_TROT = [1, 0, -1, 0]

export const FOX_FRAMES = {
  idle: [composeFox(), composeFox({ ear: 1, tail: 1 })],
  idleBlink: [
    composeFox({ blink: true }),
    composeFox({ ear: 1, tail: 1, blink: true }),
  ],
  trot: FOX_TROT.map((step, index) =>
    composeFox({
      bob: index === 1 || index === 3 ? 1 : 0,
      front: step,
      back: -step,
      frontLift: step > 0 ? 1 : 0,
      backLift: step < 0 ? 1 : 0,
      tail: index % 2 ? 1 : 0,
    }),
  ),
}
