/* ───────────────────────────────────────────────────────────────────────────
   useMagnetic — the restrained magnetic pull on primary actions.

   Theme: cursor.magneticStrength 0.22 and magneticRadius 110px. Both are
   deliberately low. A magnet strong enough to feel impressive is almost always
   strong enough to feel like the page is fighting you, which is exactly wrong
   for a luxury palette.

   Writes transform directly to the node inside a rAF that only runs while the
   pointer is nearby, so an idle page schedules no work at all.
   ─────────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef } from 'react'
import { theme } from '../theme/theme.config'

interface Options {
  /** 0–1. Defaults to the theme value. */
  strength?: number
  /** Activation radius in px. Defaults to the theme value. */
  radius?: number
  /** Disable without unmounting — used by the reduced-motion tier. */
  disabled?: boolean
}

export function useMagnetic<T extends HTMLElement = HTMLElement>(options: Options = {}) {
  const { strength = theme.cursor.magneticStrength, radius = theme.cursor.magneticRadius, disabled = false } = options
  const ref = useRef<T | null>(null)
  const frame = useRef<number | null>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  const settle = useCallback(() => {
    target.current.x = 0
    target.current.y = 0
  }, [])

  useEffect(() => {
    const node = ref.current
    if (!node || disabled) return

    let engaged = false

    const loop = () => {
      const c = current.current
      const t = target.current
      // Ease back to rest on the theme's primary curve rather than snapping.
      c.x += (t.x - c.x) * 0.18
      c.y += (t.y - c.y) * 0.18
      node.style.transform = `translate3d(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px, 0)`
      const settled = Math.abs(t.x - c.x) < 0.05 && Math.abs(t.y - c.y) < 0.05
      if (settled && t.x === 0 && t.y === 0) {
        node.style.transform = ''
        frame.current = null
        return
      }
      frame.current = requestAnimationFrame(loop)
    }

    const start = () => {
      if (frame.current === null) frame.current = requestAnimationFrame(loop)
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const rect = node.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = event.clientX - cx
      const dy = event.clientY - cy
      const distance = Math.hypot(dx, dy)
      const reach = Math.max(rect.width, rect.height) / 2 + radius
      if (distance > reach) {
        if (engaged) {
          engaged = false
          settle()
          start()
        }
        return
      }
      engaged = true
      target.current.x = dx * strength
      target.current.y = dy * strength
      start()
    }

    const onLeave = () => {
      engaged = false
      settle()
      start()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    node.addEventListener('pointerleave', onLeave)

    return () => {
      window.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', onLeave)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
      node.style.transform = ''
    }
  }, [strength, radius, disabled, settle])

  return ref
}
