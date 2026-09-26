/* ───────────────────────────────────────────────────────────────────────────
   three/DustField — the supporting element.

   Motes in the key light. The motion is entirely in the vertex shader: each
   point carries a seed and drifts on its own sine, so the CPU never touches
   this after mount. A Points cloud is one draw call regardless of count,
   which is what makes 5,000 of them free enough to keep on ULTRA.

   Additive blending, depth-write off, depth-test on — so motes pass behind the
   monolith and in front of the floor without sorting.
   ─────────────────────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ShaderMaterial,
  Vector3,
} from 'three'
import { theme } from '../../theme/theme.config'
import { sceneMood } from './sceneMood'
import { useDustBudget } from '../../hooks/usePerformanceTier'
import { hash } from '../../lib/mathUtils'

const VERTEX = /* glsl */ `
  attribute float aSeed;
  attribute float aScale;

  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uRange;
  uniform vec3  uDrift;

  varying float vAlpha;

  void main() {
    vec3 p = position;

    // Slow vertical rise, wrapped. Every mote has its own speed, so the field
    // never looks like a single sheet of moving geometry.
    float speed = 0.018 + aSeed * 0.055;
    p.y = mod(p.y + uTime * speed + aSeed * uRange, uRange) - uRange * 0.5;

    // Lateral wander, as a slow lissajous in x and z.
    float t = uTime * 0.12 + aSeed * 6.2831;
    p.x += sin(t) * uDrift.x;
    p.z += cos(t * 0.83) * uDrift.z;
    p.y += sin(t * 0.61) * uDrift.y * 0.4;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Perspective size attenuation, clamped so a mote near the camera cannot
    // become a screen-filling blob.
    gl_PointSize = min(24.0, uSize * aScale * uPixelRatio * (1.0 / max(0.001, -mvPosition.z)));

    // Fade at both ends of the travel so motes do not pop in and out.
    float normalised = (p.y + uRange * 0.5) / uRange;
    vAlpha = smoothstep(0.0, 0.22, normalised) * (1.0 - smoothstep(0.72, 1.0, normalised));
  }
`

const FRAGMENT = /* glsl */ `
  uniform vec3  uColor;
  uniform float uOpacity;

  varying float vAlpha;

  void main() {
    // Soft circular sprite. Anything outside the radius is discarded, which
    // keeps the additive blend from smearing squares over each other.
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float falloff = 1.0 - smoothstep(0.0, 0.5, d);
    gl_FragColor = vec4(uColor, falloff * falloff * vAlpha * uOpacity);
  }
`

const RANGE = 9

export function DustField() {
  const budget = useDustBudget()
  const materialRef = useRef<ShaderMaterial>(null)
  const { gl } = useThree()

  const geometry = useMemo(() => {
    // Allocation happens once, here. Nothing is created inside useFrame.
    const positions = new Float32Array(budget * 3)
    const seeds = new Float32Array(budget)
    const scales = new Float32Array(budget)
    for (let i = 0; i < budget; i += 1) {
      // Motes cluster around the monolith rather than filling a uniform box,
      // so the density is where the light actually is.
      const radius = 1.2 + hash(i * 3.7) * 4.2
      const angle = hash(i * 7.1) * Math.PI * 2
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = (hash(i * 11.3) - 0.5) * RANGE
      positions[i * 3 + 2] = Math.sin(angle) * radius
      seeds[i] = hash(i * 5.9)
      scales[i] = 0.5 + hash(i * 2.3) * 1.4
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new BufferAttribute(seeds, 1))
    geo.setAttribute('aScale', new BufferAttribute(scales, 1))
    return geo
  }, [budget])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 7.5 },
          uPixelRatio: { value: Math.min(2, gl.getPixelRatio()) },
          uRange: { value: RANGE },
          uDrift: { value: new Vector3(0.42, 0.3, 0.42) },
          uColor: { value: new Color(theme.palette.primary) },
          uOpacity: { value: 0.5 },
        },
      }),
    [gl],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((_, delta) => {
    const node = materialRef.current
    if (!node) return
    node.uniforms.uTime.value += delta
    // The motes take the scene's key colour, so the dust goes warm in the
    // atelier and cool by the time the camera pulls back.
    ;(node.uniforms.uColor.value as Color).copy(sceneMood.key)
  })

  if (budget === 0) return null

  return (
    <points geometry={geometry} frustumCulled={false}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  )
}
