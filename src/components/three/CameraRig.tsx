/* ───────────────────────────────────────────────────────────────────────────
   three/CameraRig

   The camera travels a CatmullRomCurve3 through the five waypoints in
   theme.three.cameraPath, scrubbed by document scroll (Section 8). A second
   curve carries the look-at targets, so the framing interpolates as smoothly
   as the position does.

   Three things worth knowing:
     · Progress is read from the module-level scroll store, not React state.
       Re-rendering a component tree sixty times a second to move a camera is
       the classic way to lose a frame budget.
     · The camera *damps* toward the target rather than being set to it, which
       is what gives the movement its weight. Snapping to a scroll value looks
       mechanical no matter how good the curve is.
     · It stops travelling at 78% of the document. The last two scenes resolve
       as the proof section lands, and the contact section gets a quiet,
       nearly empty frame behind it.
   ─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CatmullRomCurve3, Vector3 } from 'three'
import { theme } from '../../theme/theme.config'
import { scrollState } from '../../lib/scrollStore'
import { pointerState } from '../../lib/pointerStore'
import { sceneMood, updateSceneMood } from './sceneMood'
import { usePerformanceTier } from '../../hooks/usePerformanceTier'
import { damp } from '../../lib/mathUtils'

/** The slice of document scroll the camera actually uses. */
const SCROLL_START = 0
const SCROLL_END = 0.78

/** Pointer parallax amplitude, in world units. Deliberately tiny. */
const PARALLAX = 0.28

const WAYPOINTS = theme.three.cameraPath

export function CameraRig() {
  const { camera, gl } = useThree()
  const { profile } = usePerformanceTier()

  const { positionCurve, targetCurve, target, current } = useMemo(() => {
    const positionCurve = new CatmullRomCurve3(
      WAYPOINTS.map((w) => new Vector3(...w.pos)),
      false,
      'catmullrom',
      0.5,
    )
    const targetCurve = new CatmullRomCurve3(
      WAYPOINTS.map((w) => new Vector3(...w.look)),
      false,
      'catmullrom',
      0.5,
    )
    return {
      positionCurve,
      targetCurve,
      // Scratch vectors, allocated once. Nothing is created per frame.
      target: new Vector3(),
      current: new Vector3(WAYPOINTS[0].pos[0], WAYPOINTS[0].pos[1], WAYPOINTS[0].pos[2]),
    }
  }, [])

  const lookAt = useRef(new Vector3(...WAYPOINTS[0].look))

  useFrame((_, delta) => {
    // Scroll progress → 0…1 across the usable slice of the document.
    const scroll = scrollState.progress
    const t = Math.min(1, Math.max(0, (scroll - SCROLL_START) / (SCROLL_END - SCROLL_START)))

    // Scene mood first, so anything reading it this frame sees fresh values.
    updateSceneMood(t)

    if (profile.cameraPath) {
      positionCurve.getPoint(t, target)
      targetCurve.getPoint(t, lookAt.current)
    } else {
      // LITE: no travel. The hero framing, with a slow idle orbit so the
      // frame is never completely dead.
      const idle = performance.now() * 0.00006
      target.set(Math.sin(idle) * 0.6, 0.45 + Math.sin(idle * 0.7) * 0.12, 8.6)
      lookAt.current.set(0, 0.1, 0)
    }

    // Pointer parallax, applied to the sampled point rather than to the camera
    // after the fact, so the look-at stays locked to the object.
    target.x += pointerState.sx * PARALLAX
    target.y += pointerState.sy * PARALLAX * 0.6

    const k = 0.075
    current.x = damp(current.x, target.x, k, delta)
    current.y = damp(current.y, target.y, k, delta)
    current.z = damp(current.z, target.z, k, delta)

    camera.position.copy(current)
    camera.lookAt(lookAt.current)

    // Exposure is part of the scene's mood, so a scene can be darker or
    // brighter than its neighbour rather than merely a different colour.
    gl.toneMappingExposure = damp(gl.toneMappingExposure, sceneMood.exposure, 0.08, delta)
  }, -900)

  return null
}
