/* ───────────────────────────────────────────────────────────────────────────
   ui/ScrollProgress — a hairline across the top of the page.

   Driven by the same rAF that moves the camera, writing scaleX directly to the
   node. A React state update per scroll frame for a 1px line would be the
   single most wasteful thing on the page.
   ─────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from 'react'
import { subscribeScroll } from '../../lib/scrollStore'

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = barRef.current
    if (!node) return
    return subscribeScroll((state) => {
      node.style.transform = `scaleX(${state.progress})`
    })
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-px bg-transparent"
    >
      <div
        ref={barRef}
        className="h-px origin-left bg-primary"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}
