/* ───────────────────────────────────────────────────────────────────────────
   ui/Grain

   A CSS overlay, not a canvas pass. A full-screen 2D canvas repainting noise
   every frame is the single most expensive thing on this site and it is
   invisible to the user; a static SVG turbulence layer is free after paint.

   ULTRA still gets *living* grain: a second layer whose background-position
   steps through a handful of offsets at 12fps. That is genuine animation at
   ~1/5 the frame cost of the alternative, and it stops the page looking like a
   flat JPEG.

   The STATIC tier renders nothing — reduced-motion users have asked for less
   visual noise, not for a different kind of it.
   ─────────────────────────────────────────────────────────────────────────── */

import { usePerformanceTier } from '../../hooks/usePerformanceTier'

export function Grain() {
  const { profile } = usePerformanceTier()
  if (profile.grain === 'none') return null

  return (
    <>
      <div className="grain" aria-hidden="true" />
      {profile.grain === 'canvas' && <div className="grain grain--live" aria-hidden="true" />}
    </>
  )
}
