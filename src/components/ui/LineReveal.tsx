/* ───────────────────────────────────────────────────────────────────────────
   ui/LineReveal — a line-masked rise, one element per line.

   Why this exists instead of using <SplitText> for the hero headline: the
   headline is the one place on the site whose type is filled with a gradient
   via `background-clip: text` and softened with a `drop-shadow` filter. That
   technique does not survive being nested under dozens of individually
   transformed, transitioning descendants — a composited descendant is painted
   outside its ancestor's text clip, and the glyphs come out fully transparent.
   That failure is invisible in a static test and only appears once the spans
   are actually animating.

   Two masked lines is two descendants, which paints reliably, and a line
   rising out of its own mask is a better editorial gesture for a serif
   headline than a letter-by-letter shuffle anyway.

   Accessibility is the same deal as SplitText: the visible glyphs are split
   across elements, so the container carries the full sentence as aria-label
   and the generated spans are aria-hidden.
   ─────────────────────────────────────────────────────────────────────────── */

import { createElement, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { theme } from '../../theme/theme.config'
import { useRevealSettled } from '../../hooks/useRevealSettled'

interface LineRevealProps {
  /** One entry per line. */
  lines: readonly string[]
  /** Start the reveal. */
  active?: boolean
  /** Seconds before the first line. */
  delay?: number
  /** Seconds between lines. */
  stagger?: number
  as?: ElementType
  className?: string
  style?: CSSProperties
}

export function LineReveal({
  lines,
  active = true,
  delay = 0,
  stagger = theme.motion.stagger * 1.6,
  as,
  className = '',
  style,
}: LineRevealProps) {
  const Tag = (as ?? 'span') as ElementType
  const total = delay + Math.max(0, lines.length - 1) * stagger + theme.motion.duration.slow
  const settled = useRevealSettled(active, total)

  // Once settled, the final state is applied outright and the transition is
  // switched off — see useRevealSettled for why the guarantee is needed.
  const shown = active || settled

  const children: ReactNode = lines.map((line, index) => (
    <span
      key={line}
      className="block overflow-hidden align-bottom"
      style={{ paddingBottom: '0.1em', marginBottom: '-0.1em' }}
    >
      <span
        aria-hidden="true"
        className={`block transition-transform ease-[var(--rv-ease-primary)] ${
          settled ? '' : 'transition-transform duration-[var(--rv-dur-slow)]'
        } ${shown ? 'translate-y-0' : 'translate-y-[105%]'}`}
        style={{ transitionDelay: `${delay + index * stagger}s` }}
      >
        {line}
      </span>
    </span>
  ))

  return createElement(
    Tag,
    {
      // The accessible name is the whole headline, not the masked lines.
      'aria-label': lines.join(' '),
      className,
      style,
    },
    children,
  )
}
