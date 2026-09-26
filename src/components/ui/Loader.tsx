/* ───────────────────────────────────────────────────────────────────────────
   ui/Loader

   Progress is real. It tracks the two hero font files actually being decoded
   and usable via document.fonts.load(), byte-weighted so a 67KB display face
   does not read as "half done" when it is a 13KB body face (Section 9).

   The exit is a clip-path wipe upward on the theme's primary curve, revealing
   the hero already in place behind it — there is no black frame between the
   loader and the page.
   ─────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { ASSET_BUDGET_MS, loadCriticalAssets, type LoadProgress } from '../../lib/assetLoader'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { theme } from '../../theme/theme.config'
import { person } from '../../content/site'

/**
 * Floor on how long the loader stays up, in ms. Below this it reads as a blink
 * rather than as an opening beat, and a loader that flashes is worse than no
 * loader at all.
 */
const MIN_VISIBLE_MS = 900

interface LoaderProps {
  /** Called once the exit animation has finished and it is safe to remove. */
  onComplete: () => void
}

const EMPTY: LoadProgress = { progress: 0, status: 'idle', completed: 0, total: 0 }

export function Loader({ onComplete }: LoaderProps) {
  const [state, setState] = useState<LoadProgress>(EMPTY)
  const [exiting, setExiting] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    let cancelled = false
    let holdTimer = 0
    let exitTimer = 0
    const startedAt = Date.now()

    const finish = () => {
      if (cancelled) return
      setExiting(true)
      exitTimer = window.setTimeout(onComplete, reduced ? 180 : theme.motion.duration.slow * 1000)
    }

    void loadCriticalAssets((progress) => {
      if (!cancelled) setState(progress)
    }).then(() => {
      if (cancelled) return
      /* Hold the finished state so 100% is readable rather than a flicker, but
         never less than MIN_VISIBLE_MS from mount — on a warm cache the fonts
         resolve instantly and without this the loader is a single blink, which
         reads as a glitch rather than as an intentional opening. */
      const elapsed = Date.now() - startedAt
      holdTimer = window.setTimeout(finish, Math.max(420, MIN_VISIBLE_MS - elapsed))
    })

    /* Last line of defence. `loadCriticalAssets` has its own budget, but this
       guarantees the overlay cannot outlive its own component logic under any
       circumstances — a thrown error, a suspended promise, a browser that
       never fires the callback. The page must never be held hostage by its own
       loading screen. */
    const watchdog = window.setTimeout(finish, MIN_VISIBLE_MS + ASSET_BUDGET_MS + theme.motion.duration.slow * 1000 + 1500)

    return () => {
      cancelled = true
      window.clearTimeout(holdTimer)
      window.clearTimeout(exitTimer)
      window.clearTimeout(watchdog)
    }
  }, [onComplete, reduced])

  const percent = Math.round(state.progress * 100)

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
      style={{
        // Wipe upward rather than fade: it keeps the page's language consistent
        // and never shows the hero through a translucent black.
        clipPath: exiting ? 'inset(0% 0% 100% 0%)' : 'inset(0% 0% 0% 0%)',
        transition: `clip-path ${reduced ? 180 : theme.motion.duration.slow * 1000}ms ${theme.motion.ease.primary}`,
      }}
      role="status"
      aria-live="polite"
      aria-label={`Loading, ${percent} percent`}
    >
      <div className="flex flex-col items-center gap-10 px-8">
        <p className="label text-muted">{person.name}</p>

        {/* The rule fills from the left. Width is animated on the compositor. */}
        <div className="relative h-px w-[min(46vw,320px)] overflow-hidden bg-line">
          <div
            className="absolute inset-y-0 left-0 bg-primary"
            style={{
              width: `${state.progress * 100}%`,
              transition: 'width 420ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </div>

        <p
          className="font-display text-3xl tabular-nums text-text"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {String(percent).padStart(3, '0')}
        </p>
      </div>
    </div>
  )
}
