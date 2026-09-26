/* ───────────────────────────────────────────────────────────────────────────
   ui/SplitText — staggered word/character reveal.

   Accessibility: the visible glyphs are split across dozens of spans, which
   would make a screen reader read the headline letter by letter. So the outer
   element carries the full string as `aria-label` and every generated span is
   `aria-hidden`. The accessible name is the sentence, not the letters.

   Performance: the reveal is a CSS transition with a per-unit delay, not a
   GSAP tween per span. Twenty-two spans cost one style recalc each, not
   twenty-two tweens on the ticker.
   ─────────────────────────────────────────────────────────────────────────── */

import { createElement, type ElementType, type ReactNode } from 'react'
import { theme } from '../../theme/theme.config'
import { useRevealSettled } from '../../hooks/useRevealSettled'

interface SplitTextProps {
  text: string
  /** Element to render. Defaults to a <span> so it can sit inside any heading. */
  as?: ElementType
  by?: 'word' | 'char'
  /** Start the reveal. */
  active?: boolean
  /** Seconds to wait before the first unit. */
  delay?: number
  /** Overrides the theme stagger when set. */
  stagger?: number
  className?: string
  /** Render as an inline block so it can live inside a heading without breaking flow. */
  style?: React.CSSProperties
}

interface Unit {
  key: string
  text: string
  /** Spaces get no overflow clip — clipping them collapses the word gap. */
  spacer: boolean
}

function split(text: string, by: 'word' | 'char'): Unit[] {
  if (by === 'word') {
    return text.split(/(\s+)/).map((chunk, index) => ({
      key: `w${index}`,
      text: chunk,
      spacer: /^\s+$/.test(chunk),
    }))
  }
  return text.split('').map((char, index) => ({
    key: `c${index}`,
    text: char,
    spacer: /^\s$/.test(char),
  }))
}

export function SplitText({
  text,
  as,
  by = 'char',
  active = true,
  delay = 0,
  stagger,
  className = '',
  style,
}: SplitTextProps) {
  const Tag = (as ?? 'span') as ElementType
  const units = split(text, by)
  const gap = stagger ?? theme.motion.stagger
  // Only the first character of each word rises in char mode; the rest follow
  // tightly. Keeps a long headline from taking four seconds to finish.
  const compact = by === 'char' ? gap * 0.42 : gap
  const lastIndex = units.filter((u) => !u.spacer).length - 1
  const total = delay + Math.max(0, lastIndex) * compact + theme.motion.duration.slow
  // See useRevealSettled: the animation is the enhancement, the settled state
  // is the guarantee that the text is readable even if transitions never run.
  const settled = useRevealSettled(active, total)
  const shown = active || settled

  let unitIndex = 0
  const children: ReactNode = units.map((unit) => {
    const order = unit.spacer ? -1 : unitIndex++
    if (unit.spacer) {
      return (
        <span key={unit.key} aria-hidden="true">
          {unit.text}
        </span>
      )
    }
    return (
      <span
        key={unit.key}
        aria-hidden="true"
        className="inline-block overflow-hidden align-bottom"
        // A hair of bottom padding stops descenders (g, y, p) being clipped
        // by the overflow clip without changing the line box.
        style={{ paddingBottom: '0.12em', marginBottom: '-0.12em' }}
      >
        <span
          /* No will-change here, deliberately. A headline is 20+ spans, and
             promoting each to its own compositor layer is an anti-pattern: it
             costs memory, it defeats `background-clip: text` on the heading
             (a composited descendant is painted outside the ancestor's text
             clip, so a gradient headline silently disappears), and a plain
             transform/opacity transition is already composited. */
          className={`inline-block ease-[var(--rv-ease-primary)] ${
            settled
              ? ''
              : 'transition-[transform,opacity] duration-[var(--rv-dur-slow)]'
          } ${shown ? 'translate-y-0 opacity-100' : 'translate-y-[110%] opacity-0'}`}
          style={{ transitionDelay: `${delay + order * compact}s` }}
        >
          {unit.text}
        </span>
      </span>
    )
  })

  return createElement(
    Tag,
    {
      'aria-label': text,
      className,
      style,
    },
    children,
  )
}
