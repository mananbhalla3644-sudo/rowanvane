/* ───────────────────────────────────────────────────────────────────────────
   lib/gsap — one registration point for GSAP plugins.

   Registering ScrollTrigger here rather than in each component means it is
   registered exactly once, and any ordering surprises (triggering a
   ScrollTrigger from inside another) are impossible.
   ─────────────────────────────────────────────────────────────────────────── */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ScrollTrigger measures on refresh; late-loading fonts change layout, so a
// refresh once fonts settle prevents scrub positions being computed against
// fallback metrics.
if (typeof document !== 'undefined' && 'fonts' in document) {
  void document.fonts.ready.then(() => ScrollTrigger.refresh())
}

// Section 6: lagSmoothing(0) so GSAP's ticker drives Lenis directly and no
// frame is ever "caught up" in a burst.
gsap.ticker.lagSmoothing(0)

export { gsap, ScrollTrigger }
