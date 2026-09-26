/* ───────────────────────────────────────────────────────────────────────────
   three/Lights

   A studio rig, not a scene full of lamps: one key, one cool rim, one low
   fill. The key and rim take their colour from sceneMood, so they cross-fade
   with the camera rather than being re-created five times.

   The environment map is drei's <Environment> built from Lightformers — a
   procedural studio, generated on the GPU at mount. It is deliberately *not*
   re-rendered per scene: reflections that shift colour as the camera moves
   read as a bug, and a static cube target costs one render instead of five.
   The direct lights carry the mood; the environment carries the material.
   ─────────────────────────────────────────────────────────────────────────── */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import type { DirectionalLight } from 'three'
import { theme } from '../../theme/theme.config'
import { sceneMood } from './sceneMood'
import { pointerState } from '../../lib/pointerStore'
import { usePerformanceTier } from '../../hooks/usePerformanceTier'

export function Lights() {
  const keyRef = useRef<DirectionalLight>(null)
  const rimRef = useRef<DirectionalLight>(null)
  const { profile } = usePerformanceTier()

  useFrame(() => {
    const key = keyRef.current
    const rim = rimRef.current
    if (!key || !rim) return

    key.color.copy(sceneMood.key)
    key.intensity = sceneMood.keyIntensity
    rim.color.copy(sceneMood.rim)

    // Section 8: the cursor interacts with the scene. The key light leans a
    // little toward the pointer, so the monolith's highlight slides across it
    // as the mouse moves. Small amplitude on purpose — a light that chases the
    // cursor is a toy, not a studio.
    key.position.x = 3.2 + pointerState.sx * 1.1
    key.position.z = 4.0 + pointerState.sy * 0.8
  })

  return (
    <>
      {/* Key: warm, high and to the right, raking across the front face. */}
      <directionalLight
        ref={keyRef}
        position={[3.2, 4.6, 4]}
        intensity={sceneMood.keyIntensity}
        castShadow={profile.postFX === 'full'}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      {/* Rim: cool, behind and to the left, separating the form from the fog. */}
      <directionalLight ref={rimRef} position={[-4.5, 2.4, -3.6]} intensity={1.15} color={sceneMood.rim} />

      {/* Fill: just enough that the shadow side is not pure black. */}
      <ambientLight intensity={0.14} />

      {/* Procedural studio environment. 256px cube target, rendered once. */}
      <Environment resolution={256} frames={1} background={false}>
        {/* Large soft key softbox, upper right. */}
        <Lightformer
          form="rect"
          intensity={3.4}
          color={theme.palette.glow}
          position={[4, 5, 3]}
          scale={[9, 9, 1]}
          target={[0, 0, 0]}
        />
        {/* Long cool strip, behind left — this is what draws the gold edge. */}
        <Lightformer
          form="rect"
          intensity={1.9}
          color={theme.palette.accent}
          position={[-5, 2, -3]}
          rotation={[0, Math.PI / 2.4, 0]}
          scale={[12, 1.4, 1]}
        />
        {/* Dim floor bounce so the underside is not dead. */}
        <Lightformer
          form="rect"
          intensity={0.55}
          color={theme.palette.secondary}
          position={[0, -4, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
        />
      </Environment>
    </>
  )
}
