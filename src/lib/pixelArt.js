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

// Extra Pix views for player control. Only the right-facing 3/4 angles are
// drawn; the left versions are the same canvas flipped by Sprite. Every view
// keeps the 16x32 body: head 8 rows, torso 12 rows, legs 8 rows, boots 4 rows.
const PIX_FRONT_HEAD = {
  y: 0,
  rows: [
    '....KKKKKKKK....',
    '....KKKKKKKK....',
    '....RRRRRRRR....',
    '....KKSSSSKK....',
    '....KSESSESK....',
    '....KSSSSSSK....',
    '....KSSSSSSK....',
    '....KSSMMSSK....',
  ],
}

const PIX_FRONT_HEAD_BLINK = {
  y: 0,
  rows: [
    ...PIX_FRONT_HEAD.rows.slice(0, 4),
    '....KSSSSSSK....',
    '....KSSSSSSK....',
    ...PIX_FRONT_HEAD.rows.slice(6),
  ],
}

const PIX_BACK_HEAD = {
  y: 0,
  rows: [
    '....KKKKKKKK....',
    '....KKKKKKKK....',
    '....RRRRRRRR....',
    '....KKKRRKKK....',
    '....KKKRRKKK....',
    '....KKKRRKKK....',
    '....KKKKKKKK....',
    '....KKKKKKKK....',
  ],
}

const PIX_ANGLE_FRONT_HEAD = {
  y: 0,
  rows: [
    '....KKKKKKKK....',
    '....KKKKKKKK....',
    '....RRRRRRRR....',
    '....KKSSSSSS....',
    '....KKSESSES....',
    '....KKSSSSSS....',
    '....KSSSSSSS....',
    '....KSSSMMSS....',
  ],
}

const PIX_ANGLE_BACK_HEAD = {
  y: 0,
  rows: [
    '....KKKKKKKK....',
    '....KKKKKKKK....',
    '....RRRRRRRR....',
    '....KKKRRKKK....',
    '....KKKRRKSS....',
    '....KKKRRKSS....',
    '....KKKKKKKK....',
    '....KKKKKKKK....',
  ],
}

// Ink-blue sleeve with a warm skin hand, shared by every new view.
function pixArm(grid, x, y) {
  paint(grid, x, y, 2, 10, 'B')
  paint(grid, x, y + 10, 2, 2, 'S')
}

// One leg plus its amber boot. A lifted leg moves up a source pixel so the
// boot clears the ground without changing the other leg.
function pixLeg(grid, x, y, lift, color, bootX = x - 1, width = 3) {
  paint(grid, x, y - lift, width, 8, color)
  paint(grid, bootX, y + 8 - lift, 4, 4, 'A')
}

function composePixFront({
  bob = 0,
  leftLeg = 0,
  rightLeg = 0,
  leftArm = 0,
  rightArm = 0,
  blink = false,
} = {}) {
  const grid = emptyGrid(32)
  const y = 8 + bob

  pixLeg(grid, 4, 20, leftLeg, 'P', 3)
  pixLeg(grid, 9, 20, rightLeg, 'P', 9)

  // Both sleeves hang outside the torso, so both arms stay visible.
  pixArm(grid, 2, y - leftArm)
  pixArm(grid, 12, y - rightArm)

  // Cream hoodie with green backpack straps over the shoulders only.
  paint(grid, 4, y, 8, 12, 'C')
  paint(grid, 5, y, 2, 2, 'G')
  paint(grid, 9, y, 2, 2, 'G')

  stampPart(grid, blink ? PIX_FRONT_HEAD_BLINK : PIX_FRONT_HEAD, 0, bob)
  return grid
}

function composePixBack({
  bob = 0,
  leftLeg = 0,
  rightLeg = 0,
  leftArm = 0,
  rightArm = 0,
} = {}) {
  const grid = emptyGrid(32)
  const y = 8 + bob

  pixLeg(grid, 4, 20, leftLeg, 'P', 3)
  pixLeg(grid, 9, 20, rightLeg, 'P', 9)

  pixArm(grid, 2, y - leftArm)
  pixArm(grid, 12, y - rightArm)

  paint(grid, 4, y, 8, 12, 'C')

  // The pack covers most of the back; the hoodie hem and shoulder edges show.
  paint(grid, 5, y, 6, 10, 'G')
  paint(grid, 7, y + 4, 2, 2, 'A')

  stampPart(grid, PIX_BACK_HEAD, 0, bob)
  return grid
}

function composePixAngleFront({
  bob = 0,
  leftLeg = 0,
  rightLeg = 0,
  leftArm = 0,
  rightArm = 0,
} = {}) {
  const grid = emptyGrid(32)
  const y = 8 + bob

  // Far side first: the darker leg, the left arm and a sliver of the pack.
  pixLeg(grid, 4, 20, leftLeg, 'D', 3)
  pixArm(grid, 2, y - leftArm)
  paint(grid, 4, y, 2, 10, 'G')

  // The torso is shifted right, so the turn reads as a 3/4 front view.
  paint(grid, 6, y, 6, 12, 'C')

  // Near side on top: the right leg and arm are the closest limbs.
  pixLeg(grid, 8, 20, rightLeg, 'P', 8, 4)
  pixArm(grid, 12, y - rightArm)

  stampPart(grid, PIX_ANGLE_FRONT_HEAD, 0, bob)
  return grid
}

function composePixAngleBack({
  bob = 0,
  leftLeg = 0,
  rightLeg = 0,
  leftArm = 0,
  rightArm = 0,
} = {}) {
  const grid = emptyGrid(32)
  const y = 8 + bob

  pixLeg(grid, 4, 20, leftLeg, 'D', 3)
  pixArm(grid, 2, y - leftArm)

  paint(grid, 4, y, 8, 12, 'C')

  // The pack owns the far half; cream hoodie shows on the near right side.
  paint(grid, 4, y, 6, 10, 'G')
  paint(grid, 6, y + 4, 2, 2, 'A')

  pixLeg(grid, 8, 20, rightLeg, 'P', 8, 4)
  pixArm(grid, 12, y - rightArm)

  stampPart(grid, PIX_ANGLE_BACK_HEAD, 0, bob)
  return grid
}

// Four-frame cycle: neutral, left step, neutral, right step. The body dips one
// pixel on the step frames and the opposite arm lifts with each lifted boot.
const PIX_VIEW_STEPS = [0, 1, 0, -1]

function buildPixView(compose, blink = false) {
  const walk = PIX_VIEW_STEPS.map((step, index) =>
    compose({
      bob: index === 1 || index === 3 ? 1 : 0,
      leftLeg: step > 0 ? 1 : 0,
      rightLeg: step < 0 ? 1 : 0,
      leftArm: step < 0 ? 1 : 0,
      rightArm: step > 0 ? 1 : 0,
    }),
  )

  return {
    idle: [compose()],
    idleBlink: blink ? [compose({ blink: true })] : null,
    walk,
    lift: PIX_VIEW_STEPS.map((step) => (step === 0 ? 0 : 1)),
  }
}

export const PIX_VIEW_FRAMES = {
  side: PIX_FRAMES,
  front: buildPixView(composePixFront, true),
  back: buildPixView(composePixBack),
  angleFront: buildPixView(composePixAngleFront),
  angleBack: buildPixView(composePixAngleBack),
}

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

// Emberimp: a small, chunky side-view imp for the Ember world. Tiny ash horns,
// orange eyes, short legs and a thin ember-tipped tail. Original design; it is
// not a Piglin (no snout, tusks or gold) and not a Magma Cube (no segments).
export const EMBERIMP_PALETTE = {
  r: '#7a3222', // maroon skin
  R: '#a34a2e', // lit skin
  d: '#4a1c14', // skin shade
  e: '#ff8a2a', // orange eye
  f: '#ffd447', // hot core and claw
  h: '#d6bda9', // ash horns
  t: '#ff7a1a', // ember tail
}

function composeEmberimp({
  bob = 0,
  front = 0,
  back = 0,
  frontLift = 0,
  backLift = 0,
  tail = 0,
  arm = 0,
  blink = false,
} = {}) {
  const grid = emptyGrid(16)
  const y = 7 + bob

  // Thin tail curls up behind the hip, with a hot pixel at the tip.
  paint(grid, 2 + tail, y + 3, 2, 1, 't')
  paint(grid, 1 + tail, y + 2, 2, 1, 't')
  pixel(grid, tail, y + 1, 'f')

  // Back leg and foot.
  paint(grid, 4 + back, 12, 2, 3 - backLift, 'd')
  paint(grid, 4 + back, 15 - backLift, 3, 1, 'd')

  // Chunky body with a lit top edge and a darker belly.
  paint(grid, 4, y, 7, 6, 'r')
  paint(grid, 4, y, 7, 1, 'R')
  paint(grid, 4, y + 5, 7, 1, 'd')

  // Front leg and hot claw.
  paint(grid, 8 + front, 12, 2, 3 - frontLift, 'r')
  paint(grid, 8 + front, 15 - frontLift, 3, 1, 'r')
  pixel(grid, 10 + front, 15 - frontLift, 'f')

  // Short arm on the facing side.
  paint(grid, 10, y + 1 - arm, 2, 3, 'r')
  pixel(grid, 10, y + 4 - arm, 'd')

  // Head, tiny horns, one orange eye and a small mouth (no snout).
  paint(grid, 5, y - 5, 7, 5, 'r')
  paint(grid, 5, y - 5, 7, 1, 'R')
  pixel(grid, 6, y - 6, 'h')
  pixel(grid, 6, y - 7, 'h')
  pixel(grid, 10, y - 6, 'h')
  pixel(grid, 10, y - 7, 'h')

  if (blink) {
    paint(grid, 9, y - 3, 2, 1, 'd')
  } else {
    paint(grid, 9, y - 3, 2, 2, 'e')
    pixel(grid, 10, y - 3, 'f')
  }

  pixel(grid, 11, y - 1, 'd')

  return grid
}

const EMBERIMP_STEPS = [0, 1, 0, -1]

function buildEmberimp() {
  return {
    idle: [composeEmberimp(), composeEmberimp({ bob: 1 })],
    idleBlink: [
      composeEmberimp({ blink: true }),
      composeEmberimp({ bob: 1, blink: true }),
    ],
    walk: EMBERIMP_STEPS.map((step, index) =>
      composeEmberimp({
        bob: index === 1 || index === 3 ? 1 : 0,
        front: step,
        back: -step,
        frontLift: step > 0 ? 1 : 0,
        backLift: step < 0 ? 1 : 0,
        tail: index % 2 ? 1 : 0,
        arm: index % 2 ? 1 : 0,
      }),
    ),
  }
}

export const EMBERIMP_FRAMES = buildEmberimp()

// Ashwisp: a floating teardrop flame with a bright core and a few detached
// ember pixels. Original design; it is not a Blaze (no rods, no orbiting
// parts) and not a torch.
export const ASHWISP_PALETTE = {
  o: '#b8410f', // outer ember edge
  r: '#ff7a1a', // lava body
  R: '#ffab4d', // inner glow
  f: '#ffd447', // hot core
  m: '#ff8a2a', // floating ember
}

const WISP_SPANS = [
  [7, 8],
  [6, 9],
  [5, 10],
  [4, 11],
  [3, 12],
  [2, 13],
  [2, 13],
  [2, 13],
  [2, 13],
  [3, 12],
  [4, 11],
  [5, 10],
]

function composeAshwisp({ flicker = 0 } = {}) {
  const grid = emptyGrid(16)
  const top = 2

  WISP_SPANS.forEach(([left, right], index) => {
    const y = top + index
    paint(grid, left, y, right - left + 1, 1, 'o')
    if (right - left > 1) paint(grid, left + 1, y, right - left - 1, 1, 'r')
  })

  // Inner glow on the left and a bright, flickering core.
  paint(grid, 4, top + 4, 2, 4, 'R')
  paint(grid, 6, top + 5, 4, 3, 'f')

  if (flicker === 0) {
    paint(grid, 7, top + 4, 2, 1, 'f')
    paint(grid, 7, top + 8, 2, 1, 'f')
    pixel(grid, 2, top + 1, 'm')
    pixel(grid, 13, top + 4, 'm')
    pixel(grid, 11, top - 1, 'm')
  } else {
    paint(grid, 6, top + 4, 1, 1, 'f')
    paint(grid, 9, top + 4, 1, 1, 'f')
    paint(grid, 7, top + 8, 1, 1, 'f')
    pixel(grid, 3, top, 'm')
    pixel(grid, 13, top + 6, 'm')
    pixel(grid, 9, top - 1, 'm')
  }

  return grid
}

export const ASHWISP_FRAMES = {
  idle: [composeAshwisp({ flicker: 0 }), composeAshwisp({ flicker: 1 })],
  idleBlink: null,
}

// Gloamer: a tall, hooded Void shadow with short thick arms, a wide bell-shaped
// hem and one pale-violet eye slit. Original design; the hem never shows legs.
// Deliberately not an Enderman: no long thin limbs, no tall rectangular head,
// no particles and no teleporting.
export const GLOAMER_PALETTE = {
  o: '#120a1c', // outline and deep shade
  c: '#2a1740', // cloak
  C: '#3d2459', // cloak highlight
  d: '#1b0f2a', // cloak shade
  e: '#b58cff', // eye slit
  E: '#e6d6ff', // pale eye core
}

function composeGloamer({ blink = false, pulse = false } = {}) {
  const grid = emptyGrid(32)

  // Short, thick arms hang at the sides behind the cloak. The outer edge is
  // shaded so each arm reads against the body instead of merging into it.
  paint(grid, 2, 13, 2, 5, 'c')
  paint(grid, 12, 13, 2, 5, 'c')
  paint(grid, 2, 13, 1, 5, 'd')
  paint(grid, 13, 13, 1, 5, 'd')
  paint(grid, 2, 17, 2, 1, 'o')
  paint(grid, 12, 17, 2, 1, 'o')

  // Rounded hood: narrow at the crown, then a soft eight-wide face.
  paint(grid, 5, 1, 6, 1, 'c')
  paint(grid, 4, 2, 8, 6, 'c')
  paint(grid, 5, 8, 6, 1, 'c')
  paint(grid, 4, 2, 1, 6, 'C')
  paint(grid, 11, 2, 1, 6, 'd')

  // One pale-violet eye slit, never a pair of eyes.
  if (blink) {
    paint(grid, 6, 5, 4, 1, 'd')
  } else {
    paint(grid, 6, 5, 4, 1, 'e')
    paint(grid, 7, 5, 2, 1, 'E')
  }

  // Shoulders and cloak body.
  paint(grid, 3, 9, 10, 3, 'c')
  paint(grid, 4, 12, 8, 9, 'c')
  paint(grid, 3, 9, 1, 3, 'C')
  paint(grid, 4, 12, 1, 9, 'C')
  paint(grid, 11, 12, 1, 9, 'd')

  // Wide bell hem: no legs, and the hem itself is the ground contact.
  paint(grid, 3, 21, 10, 1, 'c')
  paint(grid, 2, 22, 12, 2, 'c')
  paint(grid, 1, 24, 14, 2, 'c')
  paint(grid, 0, 26, 16, 3, 'c')
  paint(grid, 0, 26, 8, 1, 'C')
  paint(grid, 0, 29, 16, 1, 'd')

  // Two cloak folds, shifted one pixel on the pulse frame.
  const fold = pulse ? 1 : 0
  paint(grid, 5 + fold, 12, 1, 9, 'd')
  paint(grid, 9 - fold, 12, 1, 9, 'C')

  return grid
}

export const GLOAMER_FRAMES = {
  idle: [composeGloamer(), composeGloamer({ pulse: true })],
  idleBlink: [
    composeGloamer({ blink: true }),
    composeGloamer({ blink: true, pulse: true }),
  ],
}

// Starmote: a tiny floating star-jelly for the Void. A four-point cream star
// core sits inside a soft, translucent violet body with a few violet glints.
export const STARMOTE_PALETTE = {
  o: 'rgba(181, 140, 255, 0.35)', // translucent jelly edge
  b: 'rgba(181, 140, 255, 0.18)', // translucent jelly body
  B: 'rgba(217, 194, 255, 0.32)', // jelly highlight
  s: '#f4e9c1', // star core
  S: '#fff6dd', // bright star center
  g: '#b58cff', // violet glint
}

const STARMOTE_SPANS = [
  [6, 9],
  [4, 11],
  [3, 12],
  [2, 13],
  [2, 13],
  [2, 13],
  [2, 13],
  [3, 12],
  [4, 11],
  [5, 10],
]

function composeStarmote({ pulse = 0 } = {}) {
  const grid = emptyGrid(16)
  const top = 3

  STARMOTE_SPANS.forEach(([left, right], index) => {
    const y = top + index
    paint(grid, left, y, right - left + 1, 1, 'b')
    pixel(grid, left, y, 'o')
    pixel(grid, right, y, 'o')
  })

  // Soft highlight on the upper left of the jelly.
  paint(grid, 4, top + 1, 3, 2, 'B')
  pixel(grid, 4, top + 3, 'B')

  // Four-point star core: one vertical bar and one horizontal bar.
  paint(grid, 7, top + 2, 2, 6, 's')
  paint(grid, 5, top + 4, 6, 2, 's')
  pixel(grid, 7, top + 4, 'S')
  pixel(grid, 8, top + 5, 'S')

  if (pulse) {
    pixel(grid, 7, top + 1, 's')
    pixel(grid, 8, top + 8, 's')
    pixel(grid, 4, top + 4, 's')
    pixel(grid, 11, top + 5, 's')
  }

  // A few violet glints around the body, swapped on the pulse frame.
  if (pulse) {
    pixel(grid, 1, top + 1, 'g')
    pixel(grid, 14, top + 5, 'g')
    pixel(grid, 12, top + 9, 'g')
  } else {
    pixel(grid, 2, top + 2, 'g')
    pixel(grid, 13, top + 4, 'g')
    pixel(grid, 13, top + 8, 'g')
  }

  return grid
}

export const STARMOTE_FRAMES = {
  idle: [composeStarmote({ pulse: 0 }), composeStarmote({ pulse: 1 })],
  idleBlink: null,
}
