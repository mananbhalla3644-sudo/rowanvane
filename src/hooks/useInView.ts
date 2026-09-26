/* ───────────────────────────────────────────────────────────────────────────
   useInView — IntersectionObserver, used for two things:
     · lazy-mounting below-the-fold sections and their assets
     · firing scroll reveals only once the element is actually on screen

   `once: true` (the default) is what stops a reveal from re-running every time
   the user scrolls back up.
   ─────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState, type RefObject } from 'react'

interface Options {
  /** Stop observing after the first intersection. */
  once?: boolean
  rootMargin?: string
  threshold?: number | number[]
  /** Skip observing entirely (reduced motion, static tier, print). */
  enabled?: boolean
}

export function useInView<T extends Element = HTMLDivElement>(
  options: Options = {},
): { ref: RefObject<T | null>; inView: boolean } {
  const { once = true, rootMargin = '0px 0px -12% 0px', threshold = 0.15, enabled = true } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!enabled) {
      // Treat "disabled" as "already visible" so content is never hidden.
      setInView(true)
      return
    }
    const node = ref.current
    if (!node) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setInView(false)
          }
        }
      },
      { rootMargin, threshold },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once, rootMargin, threshold, enabled])

  return { ref, inView }
}
