/* ───────────────────────────────────────────────────────────────────────────
   three/PostFX

   Tier-gated (Section 4.1):
     ULTRA     → bloom + chromatic aberration + noise + vignette
     BALANCED  → bloom + noise + vignette
     LITE      → nothing; the CSS grain overlay in ui/Grain.tsx stands in
     STATIC    → no canvas at all

   All intensities, thresholds and opacities come from theme.post. The composer
   is unmounted entirely when post-processing is off, rather than being
   mounted with an empty effect list, because an EffectComposer still costs two
   full-screen render targets.
   ─────────────────────────────────────────────────────────────────────────── */

import { useMemo } from 'react'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { theme } from '../../theme/theme.config'
import { usePerformanceTier } from '../../hooks/usePerformanceTier'

export function PostFX() {
  const { profile } = usePerformanceTier()

  // A new Vector2 every render would be a new uniform upload every render.
  const aberration = useMemo(
    () => new Vector2(theme.post.chromaticAberration, theme.post.chromaticAberration),
    [],
  )

  if (profile.postFX === 'none') return null

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={theme.post.bloom.intensity}
        luminanceThreshold={theme.post.bloom.luminanceThreshold}
        luminanceSmoothing={theme.post.bloom.luminanceSmoothing}
        mipmapBlur={theme.post.bloom.mipmapBlur}
        radius={0.72}
      />

      {profile.postFX === 'full' && (
        <ChromaticAberration
          offset={aberration}
          radialModulation
          modulationOffset={0.38}
          blendFunction={BlendFunction.NORMAL}
        />
      )}

      <Noise premultiply={theme.post.noise.premultiply} opacity={theme.post.noise.opacity} />

      <Vignette offset={theme.post.vignette.offset} darkness={theme.post.vignette.darkness} eskil={false} />
    </EffectComposer>
  )
}
