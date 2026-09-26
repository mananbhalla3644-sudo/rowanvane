/* ───────────────────────────────────────────────────────────────────────────
   lib/lenis — smooth scroll, wired to GSAP and to the scroll store.

   The sync matters (Section 6):
     · lenis.on('scroll', ScrollTrigger.update)   — one source of truth for
       scroll position, so ScrollTrigger and the DOM never disagree
     · gsap.ticker drives lenis.raf                 — a single rAF for the whole
       site; Lenis does not start its own loop
     · gsap.ticker.lagSmoothing(0)                 — set in lib/gsap, no frame
       is ever replayed in a burst after a stall

   A provider decides whether Lenis runs at all: the STATIC tier and
   prefers-reduced-motion use native scrolling, and this module stays inert.
   ─────────────────────────────────────────────────────────────────────────── */

import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { readNativeScroll, setScrollState } from './scrollStore'
import { theme } from '../theme/theme.config'

let instance: Lenis | null = null
/** Held so the ticker subscription can be removed by identity on teardown. */
let raf: ((time: number) => void) | null = null

export function initLenis(): Lenis | null {
  if (typeof window === 'undefined') return null
  if (instance) return instance

  const lenis = new Lenis({
    // Luxury preset: a long, weighted glide rather than a short snap.
    duration: theme.motion.duration.slow,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    // Native touch scrolling is better than a JS-driven emulation of it.
    syncTouch: false,
    touchMultiplier: 1.6,
    wheelMultiplier: 0.9,
  })

  lenis.on('scroll', (event: { progress: number; scroll: number; velocity: number }) => {
    setScrollState({
      progress: event.progress,
      y: event.scroll,
      velocity: event.velocity,
      scrolled: event.scroll > 4,
    })
    ScrollTrigger.update()
  })

  // GSAP's ticker reports *seconds*; Lenis's raf expects *milliseconds*. Without
  // this conversion Lenis's internal delta is ~0, it never finishes an
  // animation, and its isScrolling flag sticks on — which desynchronises it
  // from the real scroll position and produces large jumps on the next native
  // scroll event.
  raf = (time: number) => lenis.raf(time * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)

  instance = lenis
  return lenis
}

export function getLenis(): Lenis | null {
  return instance
}

export function destroyLenis(): void {
  if (!instance) return
  if (raf) gsap.ticker.remove(raf)
  instance.destroy()
  instance = null
  raf = null
}

/** Lock scrolling — used by the enquiry form's success state. */
export function lockScroll(locked: boolean): void {
  if (instance) {
    if (locked) instance.stop()
    else instance.start()
  }
  document.documentElement.classList.toggle('lenis-stopped', locked)
}

/**
 * Fallback path for the STATIC tier and reduced motion: a plain scroll
 * listener writing the same store, so the camera and parallax code downstream
 * cannot tell the difference.
 */
export function startNativeScrollListener(): () => void {
  readNativeScroll()
  window.addEventListener('scroll', readNativeScroll, { passive: true })
  window.addEventListener('resize', readNativeScroll)
  return () => {
    window.removeEventListener('scroll', readNativeScroll)
    window.removeEventListener('resize', readNativeScroll)
  }
}
