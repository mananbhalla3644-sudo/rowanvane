/* ───────────────────────────────────────────────────────────────────────────
   three/PerformanceGovernor

   Section 4.2, in full:
     · if average FPS stays below 45 for ~2s, step down one tier
     · never step back up more than once per session, to avoid flicker

   The tier step-down deliberately uses a rolling frame-time average rather
   than drei's <PerformanceMonitor factor>. PerformanceMonitor reports a 0–1
   score with no notion of *how long* the frame rate has been bad, and the spec
   is explicit about a two-second dwell — a single hitch during a scroll
   gesture would otherwise drop a capable desktop to LITE.

   drei's <PerformanceMonitor> and <AdaptiveDpr> are still mounted: their real
   job is regression, dropping the pixel ratio during interaction and restoring
   it afterwards. That is a different mechanism from a tier change, and it is
   the reason a drag never costs frames even at ULTRA.
   ─────────────────────────────────────────────────────────────────────────── */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor } from '@react-three/drei'
import { usePerformanceTier } from '../../hooks/usePerformanceTier'

/** Below this average, a downgrade is on the table. */
const FLOOR_FPS = 45
/** Above this average, and sustained, a single upgrade is allowed. */
const CEILING_FPS = 58
/** Seconds the average must stay bad before stepping down. */
const DOWN_DWELL = 2
/** Seconds the average must stay good before stepping up. */
const UP_DWELL = 4

export function PerformanceGovernor() {
  const { stepDown, stepUp, locked, tier } = usePerformanceTier()

  // Rolling window, not a per-frame check: a single slow frame is noise.
  const frames = useRef<number[]>([])
  const badFor = useRef(0)
  const goodFor = useRef(0)
  const settled = useRef(false)

  useFrame((_, delta) => {
    if (locked || settled.current) return

    // Ignore the first handful of frames — shader compilation and texture
    // upload make them meaningless.
    if (delta > 0.5) return

    frames.current.push(delta)
    if (frames.current.length > 90) frames.current.shift()
    if (frames.current.length < 45) return

    let total = 0
    for (const d of frames.current) total += d
    const average = frames.current.length / total

    if (average < FLOOR_FPS) {
      badFor.current += delta
      goodFor.current = 0
    } else if (average > CEILING_FPS) {
      goodFor.current += delta
      badFor.current = 0
    } else {
      // Between the two bands: neither earning a penalty nor a reward.
      badFor.current = Math.max(0, badFor.current - delta)
      goodFor.current = Math.max(0, goodFor.current - delta)
    }

    if (badFor.current >= DOWN_DWELL) {
      badFor.current = 0
      frames.current.length = 0
      if (tier !== 'static') {
        stepDown()
      } else {
        // Already at the floor — stop watching entirely.
        settled.current = true
      }
      return
    }

    if (goodFor.current >= UP_DWELL) {
      goodFor.current = 0
      frames.current.length = 0
      stepUp()
    }
  })

  return (
    <>
      <PerformanceMonitor />
      {/* Drops DPR while the user is interacting, restores it on idle. This is
          what keeps a fast scroll smooth on a machine that cannot hold 60fps
          while animating. */}
      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
    </>
  )
}
