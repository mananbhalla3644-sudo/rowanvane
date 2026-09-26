/* ───────────────────────────────────────────────────────────────────────────
   ui/Reveal — the section-level entrance.

   Opacity and transform only. Nothing here animates a layout property, because
   animating layout is the single most reliable way to lose a frame budget
   (Section 4.4).

   `stagger` wraps each direct child in its own transition, which is what makes
   a list feel like it arrives in order rather than all at once.
   ─────────────────────────────────────────────────────────────────────────── */

import {
  Children,
  createElement,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'
import { useInView } from '../../hooks/useInView'
import { useRevealSettled } from '../../hooks/useRevealSettled'
import { theme } from '../../theme/theme.config'

interface RevealProps {
  children: ReactNode
  as?: ElementType
  /** Seconds. Combined with the per-child stagger. */
  delay?: number
  /** Travel distance in px. */
  y?: number
  /** Fade as well as move. */
  fade?: boolean
  /** Treat each direct child as its own staggered unit. */
  stagger?: boolean
  className?: string
  style?: CSSProperties
}

const TRANSITION: CSSProperties = {
  transitionProperty: 'transform, opacity',
  transitionDuration: 'var(--rv-dur-slow)',
  transitionTimingFunction: 'var(--rv-ease-primary)',
}

const state = (
  shown: boolean,
  settled: boolean,
  y: number,
  fade: boolean,
  delay: number,
): CSSProperties => ({
  ...(settled ? {} : TRANSITION),
  transitionDelay: `${delay}s`,
  transform: shown ? 'translate3d(0,0,0)' : `translate3d(0,${y}px,0)`,
  opacity: shown || !fade ? 1 : 0,
  // Only hint the compositor while the element is actually moving.
  willChange: shown ? 'auto' : 'transform, opacity',
})

export function Reveal({
  children,
  as,
  delay = 0,
  y = 28,
  fade = true,
  stagger = false,
  className = '',
  style,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const Tag = (as ?? 'div') as ElementType
  // See useRevealSettled: the settled state guarantees the content is visible
  // even where transitions never run.
  const settled = useRevealSettled(inView, delay + theme.motion.duration.slow)
  const shown = inView || settled

  if (!stagger) {
    return createElement(
      Tag,
      { ref, className, style: { ...style, ...state(shown, settled, y, fade, delay) } },
      children,
    )
  }

  return createElement(
    Tag,
    { ref, className, style },
    Children.map(children, (child, index) => (
      <div key={index} style={state(shown, settled, y, fade, delay + index * theme.motion.stagger)}>
        {child}
      </div>
    )),
  )
}
