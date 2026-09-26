/* ───────────────────────────────────────────────────────────────────────────
   three/sceneMood

   The cross-fade between the five camera scenes.

   Progress is interpolated here, once per frame, into a single mutable record.
   Lights, fog and the dust field all read that record inside their own
   useFrame rather than re-rendering React sixty times a second — a colour
   change is exactly the kind of value that does not belong in component state.

   Runs at priority -1000 so it is guaranteed to execute before anything that
   reads from it (R3F sorts frame callbacks ascending by priority; a negative
   value does not take over the render loop, only positive ones do).
   ─────────────────────────────────────────────────────────────────────────── */

import { Color } from 'three'
import { theme } from '../../theme/theme.config'

export interface SceneMood {
  key: Color
  rim: Color
  fog: Color
  keyIntensity: number
  exposure: number
  /** 0 → 1 across the whole path, for effects that want the journey, not the place. */
  progress: number
}

const scenes = theme.three.scenes

const precomputed = scenes.map((scene) => ({
  key: new Color(scene.key),
  rim: new Color(scene.rim),
  fog: new Color(scene.fog),
  keyIntensity: scene.keyIntensity,
  exposure: scene.exposure,
}))

export const sceneMood: SceneMood = {
  key: precomputed[0].key.clone(),
  rim: precomputed[0].rim.clone(),
  fog: precomputed[0].fog.clone(),
  keyIntensity: precomputed[0].keyIntensity,
  exposure: precomputed[0].exposure,
  progress: 0,
}

/** Number of segments between waypoints. */
const segments = precomputed.length - 1

export function updateSceneMood(progress: number): void {
  const p = Math.min(1, Math.max(0, progress))
  sceneMood.progress = p

  // Map overall progress onto the waypoint segment range. The path is driven
  // by document scroll, but the mood should reach its final scene slightly
  // before the very bottom, where the contact section takes over.
  const scaled = p * segments
  const index = Math.min(segments - 1, Math.floor(scaled))
  const local = scaled - index
  const a = precomputed[index]
  const b = precomputed[index + 1]

  sceneMood.key.copy(a.key).lerp(b.key, local)
  sceneMood.rim.copy(a.rim).lerp(b.rim, local)
  sceneMood.fog.copy(a.fog).lerp(b.fog, local)
  sceneMood.keyIntensity = a.keyIntensity + (b.keyIntensity - a.keyIntensity) * local
  sceneMood.exposure = a.exposure + (b.exposure - a.exposure) * local
}

/** The colour the scene's fog is currently at, as a CSS string for the DOM. */
export function fogAsCss(): string {
  return `#${sceneMood.fog.getHexString()}`
}
