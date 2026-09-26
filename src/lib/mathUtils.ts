/* ───────────────────────────────────────────────────────────────────────────
   lib/mathUtils — small, dependency-free helpers shared by the 3D layer.
   ─────────────────────────────────────────────────────────────────────────── */

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export const inverseLerp = (a: number, b: number, v: number): number =>
  a === b ? 0 : (v - a) / (b - a)

/** Maps v from one range to another, clamped. */
export const remap = (v: number, inA: number, inB: number, outA: number, outB: number): number =>
  lerp(outA, outB, clamp(inverseLerp(inA, inB, v), 0, 1))

/**
 * Frame-rate independent damping. `amount` is the fraction of the remaining
 * distance covered per 60fps frame, so the result is identical at 30, 60 or
 * 144 Hz. Lerping with a raw 0.1 per frame would feel twice as fast on a
 * 144 Hz display — this is the fix.
 */
export const damp = (current: number, target: number, amount: number, dt = 1 / 60): number =>
  lerp(current, target, 1 - Math.pow(1 - amount, dt * 60))

/** Smoothstep, for easing values inside shaders. */
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Cheap deterministic hash → 0…1, for scattering without a PRNG allocation. */
export const hash = (n: number): number => {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}
