// Phase 3l: one tiny renderer for the Celestial Gate's text-grid art. Every
// cell is a 1x1 rect with crisp edges, so the squares stay hard at every size.
// All of this art is decorative, so the svg is always hidden from assistive tech.
export default function GatePixel({ rows, palette, className = '' }) {
  const height = rows.length
  const width = rows[0].length

  return (
    <svg
      className={`gate-pixel ${className}`.trim()}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {rows.flatMap((row, y) =>
        row.split('').map((cell, x) => {
          const fill = palette[cell]
          if (!fill) return null
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              style={{ fill }}
            />
          )
        }),
      )}
    </svg>
  )
}
