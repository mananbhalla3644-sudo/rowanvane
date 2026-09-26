/* ───────────────────────────────────────────────────────────────────────────
   useAppReady

   One flag: has the loading screen finished?

   The hero and the first section below it must not start their reveals before
   the loader has wiped away, or the two animations overlap and the page looks
   like it loaded twice. Everything else in the site doesn't care, which is why
   this is a tiny context rather than a store or a prop drilled everywhere.
   ─────────────────────────────────────────────────────────────────────────── */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface ReadyState {
  ready: boolean
  setReady: (ready: boolean) => void
}

const ReadyContext = createContext<ReadyState>({ ready: false, setReady: () => {} })

export function AppReadyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const value = useMemo<ReadyState>(() => ({ ready, setReady }), [ready])
  return <ReadyContext.Provider value={value}>{children}</ReadyContext.Provider>
}

export function useAppReady(): boolean {
  return useContext(ReadyContext).ready
}

export function useSetAppReady(): (ready: boolean) => void {
  return useContext(ReadyContext).setReady
}
