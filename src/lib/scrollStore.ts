/* ───────────────────────────────────────────────────────────────────────────
   lib/scrollStore

   A mutable module-level record, deliberately *not* React state.

   Scroll position changes on every frame. Putting it in React state would
   re-render the whole tree 60 times a second, so instead the 3D camera reads
   this object directly inside useFrame, and DOM components that genuinely need
   to re-render subscribe through useScrollProgress() with an explicit
   threshold or throttling.
   ─────────────────────────────────────────────────────────────────────────── */

export interface ScrollState {
  /** Document scroll progress, 0 → 1. */
  progress: number
  /** Pixels scrolled from the top. */
  y: number
  /** Lenis velocity in px/frame — used to push parallax and skew. */
  velocity: number
  /** True while the document is scrolled away from the very top. */
  scrolled: boolean
}

export const scrollState: ScrollState = {
  progress: 0,
  y: 0,
  velocity: 0,
  scrolled: false,
}

type Listener = (state: ScrollState) => void
const listeners = new Set<Listener>()

/** Called once per frame by the Lenis raf loop. */
export function setScrollState(next: Partial<ScrollState>): void {
  let changed = false
  for (const key of Object.keys(next) as (keyof ScrollState)[]) {
    if (scrollState[key] !== next[key]) {
      // @ts-expect-error — key/value pairs are index-compatible by construction.
      scrollState[key] = next[key]
      changed = true
    }
  }
  if (!changed) return
  for (const listener of listeners) listener(scrollState)
}

export function subscribeScroll(listener: Listener): () => void {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

/** Native-scroll fallback, used when Lenis is off (LITE / STATIC tiers). */
export function readNativeScroll(): void {
  const doc = document.documentElement
  const max = doc.scrollHeight - doc.clientHeight
  const y = window.scrollY
  setScrollState({
    y,
    progress: max > 0 ? Math.min(1, Math.max(0, y / max)) : 0,
    velocity: 0,
    scrolled: y > 4,
  })
}
