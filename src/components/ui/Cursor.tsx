/* ───────────────────────────────────────────────────────────────────────────
   ui/Cursor — the custom cursor, and its raycast hook into the 3D scene.

   Why it is not a React re-render: the cursor moves at pointer frequency, so
   it writes `transform` straight to the node from the shared pointer rAF loop
   (lib/pointerStore). React never hears about it.

   Disabled on touch (pointerState.touch), on the STATIC tier, and under
   prefers-reduced-motion (Section 8). When disabled, the native cursor is
   restored by removing the class that hides it.
   ─────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from 'react'
import { pointerState, subscribePointer } from '../../lib/pointerStore'
import { usePerformanceTier } from '../../hooks/usePerformanceTier'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { theme } from '../../theme/theme.config'

/** Anything matching this grows the ring. */
const INTERACTIVE =
  'a, button, input, textarea, select, label, summary, [role="button"], [data-cursor="hover"]'

export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const hoveringRef = useRef(false)
  const visibleRef = useRef(false)
  const { tier } = usePerformanceTier()
  const reduced = useReducedMotion()
  const enabled = theme.cursor.enabled && !reduced && tier !== 'static'

  useEffect(() => {
    const ring = ringRef.current
    const dot = dotRef.current
    if (!ring || !dot) return

    if (!enabled) {
      // Restore the native cursor and unmount cleanly.
      document.documentElement.classList.remove('rv-custom-cursor')
      return
    }
    document.documentElement.classList.add('rv-custom-cursor')

    let hoverScale = 1
    let targetScale = 1
    let opacity = 0
    let targetOpacity = 0

    // Hover detection via delegation, so dynamically mounted sections need no
    // listeners of their own.
    const onOver = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const hit = target.closest(INTERACTIVE)
      if (hit) {
        hoveringRef.current = true
        targetScale = theme.cursor.hoverScale
        ring.dataset.state = 'hover'
      }
    }
    const onOut = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (!target.closest(INTERACTIVE)) return
      // Only reset when leaving the element entirely, not moving between its children.
      const to = event.relatedTarget
      if (to instanceof Element && to.closest(INTERACTIVE)) return
      hoveringRef.current = false
      targetScale = 1
      ring.dataset.state = 'idle'
    }

    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })

    // One subscription to the shared pointer loop, shared by both elements.
    const unsubscribe = subscribePointer((state) => {
      if (state.touch) {
        targetOpacity = 0
        return
      }
      if (!state.active && !visibleRef.current) return
      visibleRef.current = state.active
      targetOpacity = state.active ? 1 : 0
      if (!state.active) {
        hoveringRef.current = false
        targetScale = 1
        ring.dataset.state = 'idle'
      }
    })

    let frame = 0
    const loop = () => {
      hoverScale += (targetScale - hoverScale) * 0.16
      opacity += (targetOpacity - opacity) * 0.16

      const x = pointerState.x
      const y = pointerState.y
      // The ring lags the dot slightly — that offset is what makes it feel
      // like a physical object rather than a crosshair.
      const size = theme.cursor.size * hoverScale
      const dotSize = theme.cursor.dotSize

      ring.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0) scale(${hoverScale})`
      ring.style.opacity = String(opacity * (hoveringRef.current ? 0.9 : 0.6))
      ring.style.setProperty('--ring-size', `${size}px`)

      dot.style.transform = `translate3d(${x - dotSize / 2}px, ${y - dotSize / 2}px, 0)`
      dot.style.opacity = String(opacity)

      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frame)
      unsubscribe()
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      document.documentElement.classList.remove('rv-custom-cursor')
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        data-state="idle"
        className="pointer-events-none fixed left-0 top-0 z-[90] rounded-full border border-primary opacity-0 will-change-transform"
        style={{ width: theme.cursor.size, height: theme.cursor.size }}
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[91] rounded-full bg-primary opacity-0 will-change-transform"
        style={{ width: theme.cursor.dotSize, height: theme.cursor.dotSize }}
      />
    </>
  )
}
