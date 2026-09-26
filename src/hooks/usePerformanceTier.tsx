/* ───────────────────────────────────────────────────────────────────────────
   usePerformanceTier — the single source of runtime capability (Section 4)

   Every 3D, shader, particle and post-processing component reads its budget
   from this hook. Nothing else in the codebase is allowed to sniff the device.

   Detection order (Section 4.2):
     1. ?tier=ultra|balanced|lite|static  — explicit override, wins outright
     2. prefers-reduced-motion              — hard stop, STATIC
     3. WebGL capability                    — hard stop, STATIC
     4. navigator.connection.saveData       — LITE
     5. deviceMemory / viewport             — LITE
     6. detect-gpu tier + hardwareConcurrency — ULTRA / BALANCED / LITE

   Runtime adaptation lives in <PerformanceGovernor> inside the Canvas: it
   steps down one tier if the average frame rate stays under 45 for ~2s, and
   will step back up at most once per session.
   ─────────────────────────────────────────────────────────────────────────── */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getGPUTier } from 'detect-gpu'
import { theme } from '../theme/theme.config'

export type Tier = 'ultra' | 'balanced' | 'lite' | 'static'

/** Ascending capability. Index in this array *is* the rank. */
export const TIER_ORDER: readonly Tier[] = ['static', 'lite', 'balanced', 'ultra'] as const

export interface TierProfile {
  /** Render the persistent WebGL canvas at all. */
  canvas: boolean
  /** DPR range handed to the renderer. */
  dpr: readonly [number, number]
  /** Which post-processing passes are allowed. */
  postFX: 'full' | 'minimal' | 'none'
  /** Dust particle budget. */
  particles: number
  /** Full scrubbed camera path, or a static hero framing. */
  cameraPath: boolean
  /** Refractive / transmissive materials. */
  transmission: boolean
  /** Grain implementation — a CSS overlay stands in where the GPU pass is off. */
  grain: 'canvas' | 'css' | 'none'
  /** Smooth scroll. */
  lenis: boolean
}

const PROFILES: Record<Tier, TierProfile> = {
  ultra: {
    canvas: true,
    dpr: [1, 2],
    postFX: 'full',
    particles: 50_000,
    cameraPath: true,
    transmission: true,
    grain: 'canvas',
    lenis: true,
  },
  balanced: {
    canvas: true,
    dpr: [1, 1.5],
    postFX: 'minimal',
    particles: 15_000,
    cameraPath: true,
    transmission: false,
    grain: 'css',
    lenis: true,
  },
  lite: {
    canvas: true,
    dpr: [1, 1],
    postFX: 'none',
    particles: 3_000,
    cameraPath: false,
    transmission: false,
    grain: 'css',
    lenis: true,
  },
  static: {
    canvas: false,
    dpr: [1, 1],
    postFX: 'none',
    particles: 0,
    cameraPath: false,
    transmission: false,
    grain: 'none',
    lenis: false,
  },
}

interface TierState {
  /** The tier actually in force right now, after any runtime downgrade. */
  tier: Tier
  profile: TierProfile
  /** True once the initial async GPU probe has settled. */
  ready: boolean
  /** True when the tier was pinned by ?tier=. */
  locked: boolean
  /** True if this tier was reached by a runtime downgrade rather than detection. */
  degraded: boolean
  /** Step-ups still available this session. Section 4.2 allows exactly one. */
  upgradesRemaining: number
  /** Step down one tier. No-op at the floor or when locked. */
  stepDown: () => void
  /** Step up one tier. Capped at one call per session by the caller. */
  stepUp: () => void
}

const TierContext = createContext<TierState | null>(null)

export function usePerformanceTier(): TierState {
  const ctx = useContext(TierContext)
  if (!ctx) throw new Error('usePerformanceTier must be used inside <PerformanceTierProvider>')
  return ctx
}

/** Convenience accessor for the common case. */
export function useTierProfile(): TierProfile {
  return usePerformanceTier().profile
}

const rank = (t: Tier) => TIER_ORDER.indexOf(t)

/* ── Detection primitives ─────────────────────────────────────────────── */

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) return false
    // Release the probe immediately. The scene's single persistent context is
    // the only long-lived one (Section 4.4).
    const lose = gl.getExtension('WEBGL_lose_context')
    lose?.loseContext()
    return true
  } catch {
    return false
  }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const isTouchFirst = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches
}

const isNarrow = () => typeof window !== 'undefined' && window.innerWidth < 820

const readParam = (): Tier | null => {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get('tier')
  return value && (TIER_ORDER as readonly string[]).includes(value) ? (value as Tier) : null
}

interface NavigatorHints {
  saveData: boolean
  deviceMemory: number
  cores: number
}

const readNavigatorHints = (): NavigatorHints => {
  if (typeof navigator === 'undefined') return { saveData: false, deviceMemory: 8, cores: 8 }
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  return {
    saveData: connection?.saveData === true,
    deviceMemory,
    cores: navigator.hardwareConcurrency ?? 8,
  }
}

async function detectTier(): Promise<{ tier: Tier; locked: boolean }> {
  const override = readParam()
  if (override) return { tier: override, locked: true }

  // Hard stops first — these can never be argued around.
  if (prefersReducedMotion()) return { tier: 'static', locked: false }
  if (!supportsWebGL()) return { tier: 'static', locked: false }

  const hints = readNavigatorHints()
  const touch = isTouchFirst()

  // Data saver is an explicit user instruction. Respect it literally.
  if (hints.saveData) return { tier: 'lite', locked: false }
  if ((hints.deviceMemory <= 4 || (touch && isNarrow())) && hints.cores <= 4) {
    return { tier: 'lite', locked: false }
  }

  let tier: Tier
  try {
    const gpu = await getGPUTier()
    // detect-gpu: 0 = fallback/software, 1 = low, 2 = mid, 3 = high.
    if (gpu.tier <= 0) tier = 'static'
    else if (gpu.tier === 1) tier = 'lite'
    else if (gpu.tier === 3 && hints.cores >= 8 && !touch) tier = 'ultra'
    else tier = 'balanced'
  } catch {
    // Probe failed — assume a typical laptop rather than a phone.
    tier = 'balanced'
  }

  // A very narrow desktop window is a strong hint the GPU is fine but the
  // viewport is not. Never promote to ULTRA on a small screen.
  if (tier === 'ultra' && isNarrow()) tier = 'balanced'

  return { tier, locked: false }
}

/* ── Provider ─────────────────────────────────────────────────────────── */

export function PerformanceTierProvider({ children }: { children: ReactNode }) {
  // Start conservative so the first paint never asks for something it cannot
  // have, then correct once the probe resolves.
  const [tier, setTierRaw] = useState<Tier>('balanced')
  const [ready, setReady] = useState(false)
  const [locked, setLocked] = useState(false)
  const [degraded, setDegraded] = useState(false)
  const [upgradesLeft, setUpgradesLeft] = useState(1)

  useEffect(() => {
    let cancelled = false
    void detectTier().then((result) => {
      if (cancelled) return
      setTierRaw(result.tier)
      setLocked(result.locked)
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const stepDown = useCallback(() => {
    if (locked) return
    setTierRaw((current) => {
      const next = TIER_ORDER[Math.max(0, rank(current) - 1)]
      if (next !== current) setDegraded(true)
      return next
    })
  }, [locked])

  const stepUp = useCallback(() => {
    if (locked) return
    setUpgradesLeft((left) => {
      if (left <= 0) return 0 // one step up per session, then never again
      setTierRaw((current) => {
        const next = TIER_ORDER[Math.min(TIER_ORDER.length - 1, rank(current) + 1)]
        if (next !== current) setDegraded(false)
        return next
      })
      return left - 1
    })
  }, [locked])

  // Crossing into STATIC must not leave a canvas or a scroll hijack behind.
  const profile = PROFILES[tier]

  useEffect(() => {
    document.documentElement.dataset.tier = tier
  }, [tier])

  const value = useMemo<TierState>(
    () => ({
      tier,
      profile,
      ready,
      locked,
      degraded,
      upgradesRemaining: upgradesLeft,
      stepDown,
      stepUp,
    }),
    [tier, profile, ready, locked, degraded, upgradesLeft, stepDown, stepUp],
  )

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>
}

/**
 * Dust budget = the theme's per-tier value, clamped by the tier profile's
 * absolute particle ceiling. Taking the min of the two means neither the
 * design nor the performance table can be silently exceeded.
 */
export function useDustBudget(): number {
  const { tier, profile } = usePerformanceTier()
  return Math.min(theme.three.dust[tier], profile.particles)
}
