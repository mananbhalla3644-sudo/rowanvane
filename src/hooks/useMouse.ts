/* ───────────────────────────────────────────────────────────────────────────
   useMouse — React access to the pointer store.

   Returns the live store object, not a snapshot, so reading `pointer.sx` in an
   animation frame is correct. Pass `reactive: true` only for the rare element
   that must re-render (the custom cursor does its own rAF instead, so it does
   not need this).
   ─────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { pointerState, subscribePointer, type PointerState } from '../lib/pointerStore'

interface Options {
  /** Re-render on every pointer frame. Default false. */
  reactive?: boolean
}

export function useMouse(options: Options = {}): PointerState {
  const { reactive = false } = options
  const [, force] = useState(0)

  useEffect(() => {
    if (!reactive) return
    return subscribePointer(() => force((n) => n + 1))
  }, [reactive])

  return pointerState
}

/** True once a touch contact has been seen — used to retire the custom cursor. */
export function useIsTouch(): boolean {
  return pointerState.touch
}
