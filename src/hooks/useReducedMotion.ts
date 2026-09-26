/* ───────────────────────────────────────────────────────────────────────────
   useReducedMotion — live-updating prefers-reduced-motion.

   Not just an initial read: a user can flip the OS setting while the page is
   open, and the site is supposed to fall into the STATIC tier immediately.
   ─────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function getInitial(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(QUERY).matches
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getInitial)

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    setReduced(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return reduced
}
