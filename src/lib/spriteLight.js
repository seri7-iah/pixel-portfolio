// Hard-edged sprite lighting for the creature cast.
//
// Every sprite frame is still one text grid plus its palette; this module bakes
// a lit version ONCE per sprite/frame/scale/world and caches the offscreen
// canvas. Nothing here runs per frame: the Sprite component only draws a cached
// canvas, and the emissive pulse swaps between two pre-baked glow tones.
//
// Rules: whole-pixel squares, a small tone ladder per material (dark / base /
// light / bright), a tinted 35% outline, a checkerboard emissive halo and a
// world accent rim light. No blur, gradient, filter or opacity halo.

const TONE_LIGHT = 0.11
const TONE_DARK = -0.13
const TONE_BRIGHT = 0.16
const TONE_BRIGHT_HOT = 0.24
const TONE_HALO = 0.09
const TONE_HALO_HOT = 0.16
const OUTLINE_LEVEL = 0.35
const RIM_MIX = 0.3
const PAD = 1

// Palette letters that glow. Art owns the choice; colors are never changed.
const EMISSIVE = {
  pix: '',
  gloop: '',
  foxel: '',
  mossling: '',
  bonemoss: 'ey',
  'bonemoss-dark': 'ey',
  emberimp: 'eft',
  ashwisp: 'Rfm',
  gloamer: 'eE',
  starmote: 'sSg',
  emberwing: 'eExcCVtg',
  notice: 'h',
}

// Fallbacks only used when a section's CSS variables cannot be read.
const FALLBACK_ACCENT = {
  home: '#5f6aa6',
  cave: '#5be3d0',
  ember: '#ff8a2a',
  void: '#b58cff',
}

const cache = new Map()
const paletteIds = new WeakMap()
const toneCache = new WeakMap()
let nextPaletteId = 1

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

function parseColor(value) {
  if (typeof value !== 'string') return null

  const text = value.trim()

  if (text[0] === '#') {
    const hex = text.slice(1)
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      }
    }
    if (hex.length === 6 || hex.length === 8) {
      const number = parseInt(hex.slice(0, 6), 16)
      return {
        r: (number >> 16) & 255,
        g: (number >> 8) & 255,
        b: number & 255,
        a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
      }
    }
    return null
  }

  const match = text.match(/rgba?\(([^)]+)\)/i)
  if (!match) return null

  const parts = match[1].split(',').map((part) => Number(part.trim()))
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null

  return {
    r: parts[0],
    g: parts[1],
    b: parts[2],
    a: parts.length > 3 ? parts[3] : 1,
  }
}

function rgbToHsl(r, g, b) {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const l = (max + min) / 2

  if (max === min) return { h: 0, s: 0, l }

  const delta = max - min
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let h

  if (max === red) h = (green - blue) / delta + (green < blue ? 6 : 0)
  else if (max === green) h = (blue - red) / delta + 2
  else h = (red - green) / delta + 4

  return { h: h * 60, s, l }
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360

  if (s === 0) {
    const value = Math.round(l * 255)
    return { r: value, g: value, b: value }
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const channel = (t) => {
    let angle = t
    if (angle < 0) angle += 1
    if (angle > 1) angle -= 1
    if (angle < 1 / 6) return p + (q - p) * 6 * angle
    if (angle < 1 / 2) return q
    if (angle < 2 / 3) return p + (q - p) * (2 / 3 - angle) * 6
    return p
  }

  return {
    r: Math.round(channel(hue / 360 + 1 / 3) * 255),
    g: Math.round(channel(hue / 360) * 255),
    b: Math.round(channel(hue / 360 - 1 / 3) * 255),
  }
}

function tint(base, dl, ds = 0, alpha = base.a) {
  const { h, s, l } = rgbToHsl(base.r, base.g, base.b)
  const rgb = hslToRgb(h, clamp01(s + ds), clamp01(l + dl))
  return { ...rgb, a: alpha }
}

function mix(first, second, amount) {
  return {
    r: first.r + (second.r - first.r) * amount,
    g: first.g + (second.g - first.g) * amount,
    b: first.b + (second.b - first.b) * amount,
    a: first.a,
  }
}

function toCss(color) {
  const alpha = Math.round(color.a * 1000) / 1000
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(
    color.b,
  )}, ${alpha})`
}

// One material = one palette letter. Four tones, never a gradient.
function tonesFor(color) {
  const base = parseColor(color)
  if (!base) return null

  const { h, s, l } = rgbToHsl(base.r, base.g, base.b)
  const level = (target, alpha = base.a) => {
    // Even the darkest step keeps a tint, so no tone ever snaps to pure black.
    const lightness = Math.min(0.97, Math.max(0.035, target))
    const rgb = hslToRgb(h, s, lightness)
    return { ...rgb, a: alpha }
  }

  return {
    dark: level(l + TONE_DARK),
    base,
    light: level(l + TONE_LIGHT),
    bright: level(l + TONE_BRIGHT),
    brightHot: level(l + TONE_BRIGHT_HOT),
    halo: tint(base, TONE_HALO, 0.04),
    haloHot: tint(base, TONE_HALO_HOT, 0.06),
    // Very dark, same hue. Never pure black.
    outline: level(Math.max(0.05, l * OUTLINE_LEVEL), 1),
  }
}

function paletteTones(palette) {
  let tones = toneCache.get(palette)
  if (tones) return tones

  tones = {}
  for (const [letter, color] of Object.entries(palette)) {
    tones[letter] = tonesFor(color)
  }

  toneCache.set(palette, tones)
  return tones
}

function paletteId(palette) {
  let id = paletteIds.get(palette)
  if (id) return id

  id = nextPaletteId
  nextPaletteId += 1
  paletteIds.set(palette, id)
  return id
}

export function hasEmissive(spriteId) {
  return Boolean(spriteId && EMISSIVE[spriteId])
}

// Bakes one lit frame at `scale`. Callers get a canvas whose art sits one pixel
// in from every edge (the outline padding), or null when there is no DOM.
export function getLitSprite(
  frame,
  palette,
  { scale = 4, world = 'home', spriteId = '', accent, glow = 0 } = {},
) {
  if (typeof document === 'undefined' || !frame || !palette) return null

  const rows = frame.length
  const cols = frame[0].length
  const baseAccent = parseColor(accent) || parseColor(FALLBACK_ACCENT[world])
  const keys = `${paletteId(palette)}|${spriteId}|${world}|${scale}|${glow}|${
    accent || ''
  }|${frame}`

  const cached = cache.get(keys)
  if (cached) return cached

  const source = frame.map((row) => row.split(''))
  const tones = paletteTones(palette)
  const emissive = new Set((EMISSIVE[spriteId] || '').split('').filter(Boolean))

  const inBounds = (x, y) => y >= 0 && y < rows && x >= 0 && x < cols
  const filled = (x, y) =>
    inBounds(x, y) && source[y][x] !== '.'

  // (a) Selective outline: transparent cells touching a filled cell get a dark
  // tint of that neighbour. Reading the source snapshot keeps it one pixel.
  const outline = Array.from({ length: rows }, () => Array(cols).fill(null))
  const directions = [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
  ]

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (source[y][x] !== '.') continue

      for (const [dx, dy] of directions) {
        const nx = x + dx
        const ny = y + dy
        if (!filled(nx, ny)) continue

        const toned = tones[source[ny][nx]]
        if (toned) outline[y][x] = toned.outline
        break
      }
    }
  }

  const isEdge = (x, y) => !filled(x, y) || Boolean(outline[y]?.[x])

  // (b) Shading, (c) emissive pixels and (d) world rim light.
  const cells = Array.from({ length: rows }, () => Array(cols).fill(null))

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (source[y][x] === '.') {
        cells[y][x] = outline[y][x]
        continue
      }

      const toned = tones[source[y][x]]
      if (!toned) continue

      if (emissive.has(source[y][x])) {
        cells[y][x] = glow === 1 ? toned.brightHot : toned.bright
        continue
      }

      const upEmpty = isEdge(x, y - 1)
      const leftEmpty = isEdge(x - 1, y)
      const downEmpty = isEdge(x, y + 1)
      const rightEmpty = isEdge(x + 1, y)

      let cell = toned.base
      if (upEmpty || leftEmpty) cell = toned.light
      else if (downEmpty || rightEmpty) cell = toned.dark

      // Lit side: full top edge, dithered left edge.
      if (baseAccent && (upEmpty || (leftEmpty && y % 2 === 0))) {
        cell = mix(cell, baseAccent, RIM_MIX)
      }

      cells[y][x] = cell
    }
  }

  // (c) Emissive halo: one hard pixel around each glow pixel, checkerboard only.
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const letter = source[y][x]
      if (!emissive.has(letter)) continue

      const toned = tones[letter]
      if (!toned) continue
      const halo = glow === 1 ? toned.haloHot : toned.halo

      for (const [dx, dy] of directions) {
        const nx = x + dx
        const ny = y + dy
        if (!inBounds(nx, ny)) continue
        if ((nx + ny) % 2 !== 0) continue
        if (emissive.has(source[ny][nx])) continue

        cells[ny][nx] = halo
      }
    }
  }

  // Draw the baked grid at the requested pixel scale, smoothing disabled.
  const canvas = document.createElement('canvas')
  canvas.width = (cols + PAD * 2) * scale
  canvas.height = (rows + PAD * 2) * scale

  const context = canvas.getContext('2d')
  if (!context) return null

  context.imageSmoothingEnabled = false
  context.clearRect(0, 0, canvas.width, canvas.height)

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cell = cells[y][x]
      if (!cell) continue

      context.fillStyle = toCss(cell)
      context.fillRect(
        (x + PAD) * scale,
        (y + PAD) * scale,
        scale,
        scale,
      )
    }
  }

  cache.set(keys, canvas)
  return canvas
}

export function litPadding() {
  return PAD
}
