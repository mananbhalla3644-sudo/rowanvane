/* ───────────────────────────────────────────────────────────────────────────
   ui/StatCounter

   Counts up once, when the stat scrolls into view, on the theme's primary
   ease. Under reduced motion the final value is rendered immediately and no
   rAF is ever scheduled — a counter that animates is exactly as unwanted as a
   marquee that moves.

   The number is exposed to assistive tech as the finished figure via an
   aria-label, so the intermediate values are never announced.
   ─────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import { useInView } from '../../hooks/useInView'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { theme } from '../../theme/theme.config'

interface StatCounterProps {
  value: number
  suffix?: string
  /** Seconds the count takes. */
  duration?: number
  className?: string
}

export function StatCounter({ value, suffix = '', duration = theme.motion.duration.slow, className = '' }: StatCounterProps) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.5 })
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    if (!inView) return

    let start: number | null = null
    const step = (timestamp: number) => {
      if (start === null) start = timestamp
      const t = Math.min(1, (timestamp - start) / (duration * 1000))
      // The same expo-out curve the rest of the site uses, so the numbers
      // settle at the same rate as the type around them.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setDisplay(Math.round(eased * value))
      if (t < 1) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [inView, value, duration, reduced])

  return (
    <span
      ref={ref}
      className={`tabular-nums ${className}`}
      aria-label={`${value}${suffix}`}
    >
      {/* The visible digits are hidden from AT; the label above carries them. */}
      <span aria-hidden="true">
        {display}
        {suffix}
      </span>
    </span>
  )
}
