/* ───────────────────────────────────────────────────────────────────────────
   lib/pointerStore

   Same reasoning as scrollStore: the pointer moves at input frequency, and
   both the custom cursor (DOM) and the 3D camera rig (WebGL) need it every
   frame. One mutable record, written at most once per animation frame by a
   single rAF loop, read by everyone. No React state, no prop drilling through
   the canvas boundary (Section 4.4: throttle pointer updates to one per frame).
   ─────────────────────────────────────────────────────────────────────────── */

export interface PointerState {
  /** Viewport pixels. */
  x: number
  y: number
  /** Normalised to -1 … 1 across the viewport. This is what the camera uses. */
  nx: number
  ny: number
  /** Smoothed normalised position — what the camera rig actually reads, so the
   *  hero drifts with the pointer instead of jittering against it. */
  sx: number
  sy: number
  /** True while the pointer is over the document. */
  active: boolean
  /** True when the primary pointer is a touch contact. */
  touch: boolean
}

export const pointerState: PointerState = {
  x: 0,
  y: 0,
  nx: 0,
  ny: 0,
  sx: 0,
  sy: 0,
  active: false,
  touch: false,
}

let rawX = 0
let rawY = 0
let queued = false
let loopId: number | null = null
let damping = 0.14

function commitPosition(): void {
  queued = false
  pointerState.x = rawX
  pointerState.y = rawY
}

/** Called from the event listeners. Coalesces bursts into one write per frame. */
export function queuePointer(x: number, y: number): void {
  rawX = x
  rawY = y
  pointerState.nx = (x / window.innerWidth) * 2 - 1
  pointerState.ny = -((y / window.innerHeight) * 2 - 1)
  if (queued) return
  queued = true
  requestAnimationFrame(commitPosition)
}

/**
 * One rAF loop for the whole site advances the damped values and notifies
 * subscribers. Started once from <App>. The damping amount comes from the
 * theme so the cursor's weight and the hero's drift can never drift apart.
 */
export function startPointerLoop(amount = damping): void {
  damping = amount
  if (loopId !== null) return

  const tick = () => {
    // Frame-rate independent: same feel at 30, 60 or 144 Hz.
    const k = 1 - Math.pow(1 - damping, 1)
    pointerState.sx += (pointerState.nx - pointerState.sx) * k
    pointerState.sy += (pointerState.ny - pointerState.sy) * k
    for (const listener of listeners) listener(pointerState)
    loopId = requestAnimationFrame(tick)
  }
  loopId = requestAnimationFrame(tick)
}

export function stopPointerLoop(): void {
  if (loopId === null) return
  cancelAnimationFrame(loopId)
  loopId = null
}

type Listener = (state: PointerState) => void
const listeners = new Set<Listener>()

export function subscribePointer(listener: Listener): () => void {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

/** Attaches the global listeners. Returns a teardown that removes all of them. */
export function bindPointerEvents(): () => void {
  const onMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') pointerState.touch = true
    pointerState.active = true
    queuePointer(event.clientX, event.clientY)
  }
  const onLeave = () => {
    pointerState.active = false
  }
  const onEnter = () => {
    pointerState.active = true
  }
  // A touch scroll must not leave a stale cursor position behind.
  const onTouch = () => {
    pointerState.touch = true
    pointerState.active = false
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerleave', onLeave)
  document.addEventListener('pointerenter', onEnter)
  window.addEventListener('touchstart', onTouch, { passive: true })

  return () => {
    window.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerleave', onLeave)
    document.removeEventListener('pointerenter', onEnter)
    window.removeEventListener('touchstart', onTouch)
  }
}
