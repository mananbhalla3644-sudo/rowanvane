/* ───────────────────────────────────────────────────────────────────────────
   ui/WorkPlate — procedural cover art for the work section.

   There is no photography on this site. Each project gets a generated
   composition instead, built from the project's own two colours, which means
   the work section reads as a considered set rather than as six missing
   images. It also costs nothing: an inline SVG per project instead of six
   photographs at 300KB each.

   All the geometry is deterministic (driven by index maths, not Math.random),
   so the plate is identical on every render and cannot flicker.
   ─────────────────────────────────────────────────────────────────────────── */

import type { CSSProperties } from 'react'

export type WorkMotif = 'ring' | 'wave' | 'bars' | 'blocks' | 'arc' | 'grid'

export interface WorkPlate {
  /** Deeper colour, bottom of the gradient. */
  from: string
  /** Base colour, top of the gradient. */
  to: string
  /** The one bright colour in the composition. */
  accent: string
  motif: WorkMotif
}

interface WorkPlateProps {
  plate: WorkPlate
  /** Stable per-project seed so two projects never draw the same composition. */
  seed: number
  className?: string
  /** Shown to sighted users only — the caption lives in the DOM next to it. */
  title?: string
}

const W = 400
const H = 300

function Motif({ motif, accent, seed }: { motif: WorkMotif; accent: string; seed: number }) {
  const cx = W / 2
  const cy = H / 2
  // A per-project rotation of the whole composition, so identical motifs
  // across two projects still read as different images.
  const rotate = (seed % 7) * 9 - 27

  switch (motif) {
    case 'ring': {
      const radii = [58, 92, 126]
      return (
        <g transform={`rotate(${rotate} ${cx} ${cy})`}>
          {radii.map((r, i) => (
            <circle
              key={r}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={accent}
              strokeWidth={i === 1 ? 9 : 1}
              strokeOpacity={i === 1 ? 0.85 : 0.28}
              strokeDasharray={i === 2 ? `${r * 0.62} ${r * 4}` : undefined}
              transform={i === 2 ? `rotate(${-40 + i * 30} ${cx} ${cy})` : undefined}
            />
          ))}
          <circle cx={cx} cy={cy} r={7} fill={accent} fillOpacity={0.9} />
        </g>
      )
    }

    case 'wave': {
      // Two stacked sine ribbons, phase-shifted against each other.
      const ribbon = (offset: number, opacity: number, thickness: number) => {
        const points: string[] = []
        for (let i = 0; i <= 48; i += 1) {
          const x = (i / 48) * W
          const t = i / 48
          const y = cy + Math.sin(t * Math.PI * 2 + offset) * (46 + t * 26)
          points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
        }
        return (
          <polyline
            key={offset}
            points={points.join(' ')}
            fill="none"
            stroke={accent}
            strokeWidth={thickness}
            strokeOpacity={opacity}
            strokeLinecap="round"
          />
        )
      }
      return (
        <g transform={`rotate(${rotate * 0.3} ${cx} ${cy})`}>
          {ribbon(seed * 0.4, 0.22, 1)}
          {ribbon(seed * 0.4 + 1.9, 0.5, 1.5)}
          {ribbon(seed * 0.4 + 3.4, 0.9, 2.5)}
        </g>
      )
    }

    case 'bars': {
      const count = 11
      return (
        <g transform={`rotate(${rotate * 0.2} ${cx} ${cy})`}>
          {Array.from({ length: count }, (_, i) => {
            const t = i / (count - 1)
            // A half-sine distribution: tall in the middle, short at the ends.
            const height = 26 + Math.sin(t * Math.PI) * 186
            const x = 34 + t * (W - 68)
            return (
              <rect
                key={i}
                x={x}
                y={cy - height / 2}
                width={9}
                height={height}
                rx={4.5}
                fill={accent}
                fillOpacity={0.22 + Math.sin(t * Math.PI) * 0.62}
              />
            )
          })}
        </g>
      )
    }

    case 'blocks': {
      const size = 58
      const gap = 18
      const cols = 4
      const offsetX = (W - (cols * size + (cols - 1) * gap)) / 2
      const offsetY = (H - (3 * size + 2 * gap)) / 2
      return (
        <g transform={`rotate(${rotate * 0.15} ${cx} ${cy})`}>
          {Array.from({ length: 12 }, (_, i) => {
            const col = i % cols
            const row = Math.floor(i / cols)
            // A diagonal band of lit cells, rotated per project.
            const lit = Math.abs(col + row * 0.8 - (2 + (seed % 3) * 0.6)) < 1.15
            return (
              <rect
                key={i}
                x={offsetX + col * (size + gap)}
                y={offsetY + row * (size + gap)}
                width={size}
                height={size}
                fill={accent}
                fillOpacity={lit ? 0.78 : 0.09}
              />
            )
          })}
        </g>
      )
    }

    case 'arc': {
      const r = 148
      return (
        <g transform={`rotate(${rotate} ${cx} ${cy})`}>
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={accent}
            strokeWidth={1.25}
            strokeOpacity={0.35}
          />
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r * 0.2} ${cy - r * 0.98}`}
            fill="none"
            stroke={accent}
            strokeWidth={7}
            strokeOpacity={0.82}
            strokeLinecap="round"
          />
          <line x1={cx - r - 20} y1={cy} x2={cx + r + 20} y2={cy} stroke={accent} strokeOpacity={0.22} />
        </g>
      )
    }

    case 'grid': {
      const cols = 9
      const rows = 7
      return (
        <g>
          {Array.from({ length: cols }, (_, i) => (
            <line
              key={`v${i}`}
              x1={(i / (cols - 1)) * W}
              y1={0}
              x2={(i / (cols - 1)) * W}
              y2={H}
              stroke={accent}
              strokeWidth={1}
              strokeOpacity={0.14}
            />
          ))}
          {Array.from({ length: rows }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={(i / (rows - 1)) * H}
              x2={W}
              y2={(i / (rows - 1)) * H}
              stroke={accent}
              strokeWidth={1}
              strokeOpacity={0.14}
            />
          ))}
          {/* One lit diagonal, the "route". */}
          <line
            x1={0}
            y1={H}
            x2={W}
            y2={0}
            stroke={accent}
            strokeWidth={2}
            strokeOpacity={0.9}
            strokeDasharray="14 9"
          />
        </g>
      )
    }
  }
}

export function WorkPlate({ plate, seed, className = '', title }: WorkPlateProps) {
  const gradientId = `plate-${seed}-${plate.motif}`
  const style: CSSProperties = { aspectRatio: `${W} / ${H}` }

  return (
    <div className={`relative overflow-hidden bg-surface ${className}`} style={style}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full transition-transform duration-[var(--rv-dur-slow)] ease-[var(--rv-ease-primary)] motion-safe:group-hover:scale-[1.04]"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={title ? `Cover artwork for ${title}` : undefined}
        aria-hidden={title ? undefined : true}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor={plate.from} />
            <stop offset="100%" stopColor={plate.to} />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${gradientId})`} />
        <Motif motif={plate.motif} accent={plate.accent} seed={seed} />
      </svg>
    </div>
  )
}
