/* ───────────────────────────────────────────────────────────────────────────
   ui/Marquee — seamless scrolling text.

   How the loop hides: the track holds the item list twice, and the keyframe
   translates it by exactly -50%. At the moment the animation restarts, the
   second copy is sitting precisely where the first one started, so there is no
   visible jump (Section 10, item 6).

   Reduced motion: the animation is dropped and the row becomes a static,
   wrapped, centred list. A marquee that moves is exactly the thing a user who
   asked for reduced motion did not ask for.
   ─────────────────────────────────────────────────────────────────────────── */

import type { CSSProperties } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface MarqueeProps {
  items: readonly string[]
  /** 'left' scrolls right→left, 'right' scrolls left→right. */
  direction?: 'left' | 'right'
  /** Seconds for one full cycle of the doubled track. */
  speed?: number
  className?: string
  itemClassName?: string
  /** Separator between items. */
  separator?: string
  /** Fade the left and right edges into the page. */
  fade?: boolean
}

export function Marquee({
  items,
  direction = 'left',
  speed = 38,
  className = '',
  itemClassName = '',
  separator = '—',
  fade = true,
}: MarqueeProps) {
  const reduced = useReducedMotion()
  const doubled = [...items, ...items]

  if (reduced) {
    return (
      <ul className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 ${className}`}>
        {items.map((item) => (
          <li key={item} className={`label text-muted ${itemClassName}`}>
            {item}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div
      className={`relative overflow-hidden ${fade ? 'edge-fade-x' : ''} ${className}`}
      // The track must never be focusable; it is decoration repeating content
      // that already exists in the accessible tree once.
      aria-hidden="true"
    >
      <div
        className={`flex w-max ${direction === 'left' ? 'rv-marquee-left' : 'rv-marquee-right'}`}
        style={{ animationDuration: `${speed}s` } as CSSProperties}
      >
        {doubled.map((item, index) => (
          <span key={`${item}-${index}`} className={`flex shrink-0 items-center ${itemClassName}`}>
            <span className="label px-8 text-muted">{item}</span>
            <span className="text-primary/40">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
