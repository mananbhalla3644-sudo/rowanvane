/* ───────────────────────────────────────────────────────────────────────────
   useScrollProgress — React access to the scroll store.

   Deliberately opt-in: the default subscriber renders on every scroll frame,
   which is fine for one small element and catastrophic for a page. Anything
   that needs per-frame values (parallax, the 3D camera) should read
   `scrollState` inside its own rAF or useFrame instead of using this hook.

     useScrollProgress()                        // re-renders on every frame
     useScrollProgress({ every: 0.05 })         // re-renders at most 20×/page
     useScrollProgress({ keys: ['scrolled'] })  // only when booleans flip
   ─────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { scrollState, subscribeScroll, type ScrollState } from '../lib/scrollStore'

interface Options {
  /** Re-render only when progress moves by at least this much. */
  every?: number
  /** Re-render only when one of these fields changes. */
  keys?: (keyof ScrollState)[]
}

export function useScrollProgress(options: Options = {}): ScrollState {
  const { every, keys } = options
  const [state, setState] = useState<ScrollState>(scrollState)

  useEffect(() => {
    if (keys?.length) {
      return subscribeScroll((next) => {
        setState((prev) => {
          const changed = keys.some((k) => prev[k] !== next[k])
          return changed ? { ...next } : prev
        })
      })
    }
    if (every) {
      let last = scrollState.progress
      return subscribeScroll((next) => {
        if (Math.abs(next.progress - last) < every) return
        last = next.progress
        setState({ ...next })
      })
    }
    return subscribeScroll((next) => setState({ ...next }))
  }, [every, keys])

  return state
}
