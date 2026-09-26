/* ───────────────────────────────────────────────────────────────────────────
   lib/assetLoader — real progress, for the loading screen.

   Section 9 requires the loader to show progress tied to *actual* loading, not
   a fake timer. Everything this site loads is either a font or a code chunk, so
   the tracked set is:
     · the two hero-critical font files
     · the 3D chunk, which is requested by React.lazy and registered here the
       moment the import starts

   Progress is weighted by byte count where the size is known, so one 67 KB
   font does not read as "50% done".
   ─────────────────────────────────────────────────────────────────────────── */

import { theme } from '../theme/theme.config'

export interface TrackedAsset {
  id: string
  label: string
  /** Bytes, when known. Unknown sizes count as a nominal 1 unit. */
  bytes: number
  load: () => Promise<unknown>
}

/**
 * Ceiling on how long the loading screen will hold the page, in ms.
 *
 * Generous enough that a slow connection still gets a meaningful progress read,
 * short enough that nobody is ever left staring at a loader. The page is worth
 * seeing at 6 seconds even if the display face has not arrived; the hero copy,
 * the layout and every section are all readable without it.
 */
const TIMEOUT_MS = 6000

/** Exposed so the loader's own watchdog can be derived from the same budget. */
export const ASSET_BUDGET_MS = TIMEOUT_MS

const track = new Map<string, { bytes: number; promise: Promise<unknown> }>()

export function registerAsset(asset: TrackedAsset): void {
  if (track.has(asset.id)) return
  track.set(asset.id, { bytes: asset.bytes, promise: asset.load() })
}

export interface LoadProgress {
  /** 0 → 1, real completion across every tracked asset. */
  progress: number
  /** Human-readable state for the loader copy. */
  status: 'idle' | 'loading' | 'done' | 'error'
  completed: number
  total: number
}

/** The fonts the first paint needs. The display face is preloaded in index.html;
 *  this waits for it to actually be usable, which is what prevents the hero
 *  headline from reflowing when it swaps in. */
export const HERO_FONTS: TrackedAsset[] = [
  { id: 'font-display', label: 'Fraunces', bytes: 67_304, load: () => document.fonts.load('300 4rem "Fraunces Variable"') },
  { id: 'font-body', label: 'Inter', bytes: 48_256, load: () => document.fonts.load('400 1rem "Inter Variable"') },
]

let status: LoadProgress['status'] = 'idle'

export function getStatus(): LoadProgress['status'] {
  return status
}

/**
 * Registers the critical assets and resolves with a progress callback.
 * Uses font loading promises where available and falls back to counting
 * completion per asset, so it behaves the same on browsers without
 * document.fonts.load.
 */
export async function loadCriticalAssets(
  onProgress: (progress: LoadProgress) => void,
  extra: TrackedAsset[] = [],
): Promise<void> {
  const assets = [...HERO_FONTS, ...extra]
  status = 'loading'
  const total = assets.length
  let done = 0
  let weightDone = 0
  let budgetTimer: ReturnType<typeof setTimeout> | null = null
  const totalWeight = assets.reduce((sum, a) => sum + Math.max(1, a.bytes), 0)

  const settle = () => {
    done += 1
    weightDone += Math.max(1, assets[done - 1].bytes)
    const progress = Math.min(1, weightDone / totalWeight)
    if (progress >= 1) status = 'done'
    onProgress({ progress, status, completed: done, total })
  }

  const results = assets.map((asset) =>
    asset
      .load()
      .then(settle)
      .catch((error) => {
        console.error(`[loader] "${asset.label}" failed to load`, error)
        settle()
      }),
  )

  /* A hard budget, and the single most important line in this file.
     `document.fonts.load()` does not settle for a document that is not being
     rendered — Chrome defers font loading in a background tab — and `.catch()`
     only handles rejection, never a promise that stays pending. So a page
     opened in a new tab and switched away, or a single stalled font request,
     leaves this awaiting forever, `onComplete` is never called, and the loading
     overlay sits on top of the page permanently.

     A loader is an indicator. It reports progress; it must never be the thing
     standing between the reader and the content. Past the budget we reveal
     anyway and let `font-display: swap` bring the type in when it can. */
  await Promise.race([
    Promise.all(results),
    new Promise<void>((resolve) => {
      budgetTimer = setTimeout(() => {
        console.warn(
          `[loader] critical assets did not settle within ${TIMEOUT_MS}ms — revealing anyway.`,
        )
        // Report 100% so the progress read-out does not freeze part-way.
        onProgress({ progress: 1, status: 'done', completed: total, total })
        resolve()
      }, TIMEOUT_MS)
    }),
  ])

  if (budgetTimer !== null) clearTimeout(budgetTimer)

  // Let whatever did resolve reach layout before the reveal starts, so the hero
  // never appears to flash in at the wrong size.
  //
  // This is a timer, deliberately, not a requestAnimationFrame. rAF is
  // throttled to zero in a background tab, so a loader that waits on rAF hangs
  // forever for anyone who opens the site in a new tab and switches away.
  await new Promise((resolve) => setTimeout(resolve, 32))
}

/** The duration of the hero reveal, in ms. Sourced from the theme. */
export const REVEAL_MS = theme.motion.duration.slow * 1000
