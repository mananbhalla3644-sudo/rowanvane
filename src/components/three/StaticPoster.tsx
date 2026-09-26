/* ───────────────────────────────────────────────────────────────────────────
   three/StaticPoster

   The STATIC tier's stand-in for the WebGL scene (Section 4.1): a poster built
   from the same palette, with no canvas and no animation.

   It is not a screenshot and does not pretend to be one. It is the same
   composition reduced to what CSS can hold — a lit vertical form with a gold
   seam and a pool of light beneath it — so a reduced-motion visitor still gets
   the atmosphere the brief asked for, and a visitor on a machine with no
   WebGL gets something deliberate rather than a black rectangle.

   Zero JavaScript, zero layout cost, nothing to dispose.
   ─────────────────────────────────────────────────────────────────────────── */

import { theme } from '../../theme/theme.config'

export function StaticPoster() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Base wash — the studio's ambient falloff. */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(120% 80% at 50% 42%, ${theme.palette.bgElevated} 0%, ${theme.palette.bg} 62%)` }}
      />

      {/* The monolith, as two slabs separated by a gold seam. The seam is the
          only bright value in the composition, exactly as in the 3D scene. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex flex-col items-center"
          style={{
            filter: 'blur(0.4px)',
            transform: 'translateY(-2%)',
          }}
        >
          <div
            style={{
              width: 'clamp(120px, 16vw, 230px)',
              height: 'clamp(150px, 20vw, 300px)',
              background: `linear-gradient(105deg, ${theme.palette.surfaceAlt} 0%, ${theme.palette.surface} 46%, ${theme.palette.bgElevated} 100%)`,
              boxShadow: 'inset 0 0 0 1px rgba(244,241,236,0.06)',
            }}
          />
          <div
            style={{
              width: 'clamp(120px, 16vw, 230px)',
              height: 3,
              background: `linear-gradient(90deg, transparent, ${theme.palette.primary} 22%, ${theme.palette.glow} 50%, ${theme.palette.primary} 78%, transparent)`,
            }}
          />
          <div
            style={{
              width: 'clamp(120px, 16vw, 230px)',
              height: 'clamp(116px, 16vw, 240px)',
              background: `linear-gradient(105deg, ${theme.palette.surfaceAlt} 0%, ${theme.palette.surface} 46%, ${theme.palette.bgElevated} 100%)`,
              boxShadow: 'inset 0 0 0 1px rgba(244,241,236,0.06)',
            }}
          />
        </div>
      </div>

      {/* Key light, raking from the upper right — the same direction as the
          rig in three/Lights.tsx, so the two read as the same picture. */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 50% at 66% 26%, ${theme.palette.glow}22 0%, transparent 68%)`,
        }}
      />

      {/* Light pool on the floor. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38vh]"
        style={{
          background: `radial-gradient(58% 100% at 50% 108%, ${theme.palette.primary}2E 0%, transparent 70%)`,
        }}
      />

      {/* Vignette, matching theme.post.vignette. */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(120% 100% at 50% 50%, transparent 42%, ${theme.palette.bg} 100%)` }}
      />
    </div>
  )
}
