/* ───────────────────────────────────────────────────────────────────────────
   three/Monolith — the primary motif.

   Form: two obsidian slabs separated by a hairline gap, with a brushed-gold
   inlay sitting in the gap. One object, one light, one idea — which is what
   the luxury/editorial brief actually asks for. A "cool" scene would have put
   a particle storm and a shader-warp in here; this is the restrained reading.

   Everything is procedural. No model file, no texture file, nothing to load.
   ─────────────────────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  MeshPhysicalMaterial,
  SRGBColorSpace,
  type Texture,
} from 'three'
import { theme } from '../../theme/theme.config'
import { applyMonolithShader, type MonolithUniforms } from './shaders/monolith'
import { sceneMood } from './sceneMood'
import { usePerformanceTier } from '../../hooks/usePerformanceTier'

const M = theme.three.material

/** Slab geometry, in the theme's own proportions. */
const LOWER = { size: [1.62, 1.68, 0.52] as const, position: [0, -0.88, 0] as const }
const UPPER = { size: [1.62, 1.28, 0.52] as const, position: [0, 0.74, 0] as const }
/** The gap between the slabs, and the bar that fills it. */
const INLAY = { size: [1.64, 0.055, 0.54] as const, position: [0, 0.0, 0] as const }

/**
 * A radial light pool on the floor. Cheaper and more controllable than a
 * shadow map for a single object, and it gives the form somewhere to stand.
 */
function useLightPoolTexture(): Texture {
  const texture = useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      gradient.addColorStop(0, 'rgba(194, 164, 107, 0.55)')
      gradient.addColorStop(0.35, 'rgba(150, 128, 88, 0.20)')
      gradient.addColorStop(1, 'rgba(10, 10, 11, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
    }
    const map = new CanvasTexture(canvas)
    map.colorSpace = SRGBColorSpace
    return map
  }, [])

  // Section 4.4: textures are disposed on unmount, not left to the GC.
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

function Slab({
  size,
  position,
  children,
}: {
  size: readonly [number, number, number]
  position: readonly [number, number, number]
  children?: React.ReactNode
}) {
  return (
    <RoundedBox args={[...size]} radius={0.035} smoothness={3} position={[...position]} castShadow receiveShadow>
      {children}
    </RoundedBox>
  )
}

export function Monolith() {
  const group = useRef<Group>(null)
  const inlayRef = useRef<MeshPhysicalMaterial>(null)
  const { profile } = usePerformanceTier()
  const lightPool = useLightPoolTexture()

  /* The body material, patched with the theme's surface shader. Created once
     and disposed on unmount. */
  const bodyMaterial = useMemo(() => {
    const material = new MeshPhysicalMaterial({
      color: new Color(M.bodyColor),
      metalness: M.bodyMetalness,
      roughness: M.bodyRoughness,
      // Clearcoat is what separates "polished stone" from "dark plastic". Off on
      // BALANCED and below, where it is the most expensive thing on screen.
      clearcoat: profile.transmission ? 0.6 : 0,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.1,
    })
    return material
  }, [profile.transmission])

  const uniforms: MonolithUniforms = useMemo(() => applyMonolithShader(bodyMaterial), [bodyMaterial])

  const inlayMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color(M.inlayColor),
        metalness: M.inlayMetalness,
        roughness: M.inlayRoughness,
        emissive: new Color(theme.palette.primary),
        // A touch of self-illumination so the gold still reads when the key
        // light is dim — the 'edge' scene drops key intensity to 1.5.
        emissiveIntensity: 0.28,
        envMapIntensity: 1.6,
      }),
    [],
  )

  const floorMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color(M.floorColor),
        metalness: M.floorMetalness,
        roughness: M.floorRoughness,
        envMapIntensity: 0.8,
      }),
    [],
  )

  useEffect(
    () => () => {
      bodyMaterial.dispose()
      inlayMaterial.dispose()
      floorMaterial.dispose()
    },
    [bodyMaterial, inlayMaterial, floorMaterial],
  )

  useFrame((_, delta) => {
    uniforms.uTime.value += delta

    const node = group.current
    if (!node) return

    // Theme spin, 0.055 rad/s — about 114 seconds for a full turn. Slow enough
    // that the eye reads it as a change in the light rather than as rotation.
    node.rotation.y += theme.three.spin * delta

    if (inlayRef.current) {
      inlayRef.current.emissive.copy(sceneMood.key).multiplyScalar(0.3)
    }
  })

  return (
    <group ref={group}>
      <Slab size={LOWER.size} position={LOWER.position}>
        <primitive object={bodyMaterial} attach="material" />
      </Slab>

      <Slab size={UPPER.size} position={UPPER.position}>
        <primitive object={bodyMaterial} attach="material" />
      </Slab>

      {/* The inlay. Slightly proud of the slabs on every axis so it reads as a
          separate milled part, not a seam. */}
      <RoundedBox args={[...INLAY.size]} radius={0.02} smoothness={3} position={[...INLAY.position]}>
        <primitive object={inlayMaterial} attach="material" ref={inlayRef} />
      </RoundedBox>

      {/* Floor + light pool. The floor is what turns the gold into jewellery:
          it gives the reflection something to sit on. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.73, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.72, 0]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial
          map={lightPool}
          transparent
          opacity={0.75}
          side={DoubleSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
