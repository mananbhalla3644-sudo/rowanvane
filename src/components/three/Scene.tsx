/* ───────────────────────────────────────────────────────────────────────────
   three/Scene — the single persistent WebGL context (Section 4.4).

   One <Canvas> for the whole site, fixed behind the document, driven by scroll
   progress. Not one canvas per section: a second context costs a second copy
   of every shader, every texture upload and another GPU memory budget, and
   browsers start dropping the oldest context once there are more than a
   handful.

   The canvas is aria-hidden and pointer-events-none. Everything a user can
   interact with lives in the DOM above it, and the scene is decorative — its
   entire contribution is available in text beside it.
   ─────────────────────────────────────────────────────────────────────────── */

import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping, FogExp2 } from 'three'
import { theme } from '../../theme/theme.config'
import { usePerformanceTier } from '../../hooks/usePerformanceTier'
import { sceneMood } from './sceneMood'
import { CameraRig } from './CameraRig'
import { Lights } from './Lights'
import { Monolith } from './Monolith'
import { DustField } from './DustField'
import { PostFX } from './PostFX'
import { PerformanceGovernor } from './PerformanceGovernor'
import { StaticPoster } from './StaticPoster'

/** Pauses rendering when the tab is hidden. A backgrounded tab burning 60fps
 *  is the most common cause of "my laptop fan spins up". */
function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => !document.hidden)
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
  return visible
}

/**
 * Fog has to follow the scene mood, and it cannot be done with JSX args —
 * those are only read at mount. Created imperatively and updated per frame
 * alongside everything else that reads sceneMood.
 */
function SceneFog() {
  const { scene } = useThree()
  const fog = useMemo(() => new FogExp2(sceneMood.fog.getHex(), 0.052), [])

  useEffect(() => {
    scene.fog = fog
    return () => {
      // Fog holds no GPU resources, so there is nothing to dispose — only the
      // reference to release.
      scene.fog = null
    }
  }, [scene, fog])

  useFrame(() => {
    fog.color.copy(sceneMood.fog)
  }, -950)
  return null
}

function SceneContents() {
  return (
    <>
      <SceneFog />
      <CameraRig />
      <Lights />
      <Monolith />
      <DustField />
      <PerformanceGovernor />
      <PostFX />
    </>
  )
}

export function Scene() {
  const { profile } = usePerformanceTier()
  const visible = usePageVisible()

  // STATIC tier: a poster built from the same palette, not a canvas.
  if (!profile.canvas) return <StaticPoster />

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
      // Tells the compositor this layer never changes size, so scrolling the
      // page does not force a re-raster of a full-viewport WebGL surface.
      style={{ contain: 'strict' }}
    >
      <Canvas
        // 'never' while the tab is hidden: no frames, no GPU work, no heat.
        frameloop={visible ? 'always' : 'never'}
        dpr={profile.dpr as unknown as [number, number]}
        // Required by AdaptiveDpr, which is what protects frame rate during a
        // scroll gesture on a machine already at its limit.
        performance={{ min: 0.5, max: 1, debounce: 220 }}
        gl={{
          antialias: profile.postFX === 'full',
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        camera={{
          fov: 34,
          near: 0.1,
          far: 80,
          position: [...theme.three.cameraPath[0].pos],
        }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = ACESFilmicToneMapping
          // Matches the fog's opening colour so the first frame does not flash
          // a different background before the rig has run.
          gl.setClearColor(theme.palette.bg, 1)
          scene.background = null
        }}
      >
        <Suspense fallback={null}>
          <SceneContents />
        </Suspense>
      </Canvas>
    </div>
  )
}
