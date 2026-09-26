/* ───────────────────────────────────────────────────────────────────────────
   useRevealSettled

   Every reveal on this site is a CSS transition from a hidden state. That is
   fast and cheap, but it makes the *content itself* conditional on a
   transition running to completion — and transitions do not always run:

     · a tab opened in the background has its animation timeline frozen, so the
       reveal sits at opacity 0 until the tab is focused
     · a browser or environment with animations disabled never advances it
     · headless capture and some assistive/automation contexts never tick it

   In all of those cases the reader is left looking at a page with no headline,
   which for a content site is a real failure, not a cosmetic one.

   So every reveal carries a deterministic backstop: when it has been active
   for longer than its own delay + duration + a margin, it is declared settled
   and the final state is applied with transitions switched off. The animation
   is the enhancement; the settled state is the guarantee.
   ─────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'

/** Slack on top of the transition, in ms, for clock skew and late frames. */
const MARGIN_MS = 400

export function useRevealSettled(active: boolean, totalSeconds: number): boolean {
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!active) {
      setSettled(false)
      return
    }
    const ms = Math.max(0, totalSeconds * 1000 + MARGIN_MS)
    const timer = window.setTimeout(() => setSettled(true), ms)
    return () => window.clearTimeout(timer)
  }, [active, totalSeconds])

  return settled
}
