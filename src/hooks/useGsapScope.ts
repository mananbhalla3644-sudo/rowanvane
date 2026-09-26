/* ───────────────────────────────────────────────────────────────────────────
   useGsapScope — runs a GSAP setup inside a scoped context.

   gsap.context() is what makes ScrollTrigger clean-up reliable: every trigger,
   tween and ScrollTo created inside the callback is recorded, and ctx.revert()
   removes all of them. Without it, a section that unmounts leaves live
   ScrollTriggers pointing at detached nodes, which is the classic
   "scroll behaviour gets weird after navigating back" bug (Section 4.4,
   no leaks).
   ─────────────────────────────────────────────────────────────────────────── */

import { useLayoutEffect, useRef, type DependencyList, type RefObject } from 'react'
import { gsap } from '../lib/gsap'

type Setup<T extends HTMLElement> = (scope: RefObject<T | null>) => void | (() => void)

export function useGsapScope<T extends HTMLElement = HTMLDivElement>(
  setup: Setup<T>,
  deps: DependencyList = [],
): RefObject<T | null> {
  const scope = useRef<T | null>(null)

  useLayoutEffect(() => {
    if (!scope.current) return
    const context = gsap.context(() => {
      const cleanup = setup(scope)
      if (typeof cleanup === 'function') return cleanup
      return undefined
    }, scope)

    return () => {
      context.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return scope
}
