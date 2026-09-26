/* ───────────────────────────────────────────────────────────────────────────
   App — providers, global systems, and the section order.

   Section order, justified against the audience goal (Section 10): the visitor
   is a brand lead deciding whether to spend an hour of attention, so the page
   answers their questions in the order they ask them.

     Hero        → what is this and is it for me
     Practice    → who is behind it, and how do they think
     Capabilities→ can they do the specific thing I need
     Work        → proof, at length
     Proof       → what do other people say, and what has it won
     Clients     → the short credibility strip, skimmable in two seconds
     Contact     → the ask, last, once they have a reason

   Load order note: the 3D scene is React.lazy so three / r3f / drei / postfx
   arrive as a separate chunk after first paint. The DOM sections are *not*
   split into separate requests — they total a few KB, and a second round trip
   costs more than the parse it saves. Their expensive work (reveal timelines,
   observers) is gated on IntersectionObserver instead, so nothing below the
   fold does any work until it is nearly on screen.
   ─────────────────────────────────────────────────────────────────────────── */

import { Suspense, lazy, useEffect, useState } from 'react'
import { PerformanceTierProvider, usePerformanceTier } from './hooks/usePerformanceTier'
import { AppReadyProvider, useSetAppReady } from './hooks/useAppReady'
import { Header } from './components/Header'
import { Loader } from './components/ui/Loader'
import { Cursor } from './components/ui/Cursor'
import { Grain } from './components/ui/Grain'
import { ScrollProgress } from './components/ui/ScrollProgress'
import { Hero } from './sections/Hero'
import { Story } from './sections/Story'
import { Capabilities } from './sections/Capabilities'
import { Work } from './sections/Work'
import { Proof } from './sections/Proof'
import { Clients } from './sections/Clients'
import { Contact } from './sections/Contact'
import { Footer } from './sections/Footer'
import { bindPointerEvents, startPointerLoop, stopPointerLoop } from './lib/pointerStore'
import { initLenis, startNativeScrollListener } from './lib/lenis'
import { theme } from './theme/theme.config'

/* The whole WebGL layer, in one chunk. */
const Scene = lazy(() =>
  import('./components/three/Scene').then((module) => ({ default: module.Scene })),
)

/**
 * Everything that depends on the detected tier, and therefore must wait for
 * detection to settle before the scroll system is wired up.
 */
function TierSystems({ children }: { children: React.ReactNode }) {
  const { profile, ready } = usePerformanceTier()

  useEffect(() => {
    if (!ready) return

    if (profile.lenis) {
      initLenis()
    } else {
      // STATIC tier: native scrolling, writing the same store so the camera
      // and parallax code downstream cannot tell the difference.
      return startNativeScrollListener()
    }
    return undefined
  }, [ready, profile.lenis])

  return <>{children}</>
}

function GlobalListeners() {
  useEffect(() => {
    const unbind = bindPointerEvents()
    startPointerLoop(theme.cursor.damping)
    return () => {
      unbind()
      stopPointerLoop()
    }
  }, [])
  return null
}

function Page() {
  const setReady = useSetAppReady()
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <GlobalListeners />
      <TierSystems>
        <Cursor />
        <ScrollProgress />

        {/* Decorative background: pointer-events-none, aria-hidden, and
            entirely redundant with the text beside it. */}
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <Grain />

        <Header />

        <main id="main" className="relative z-10">
          <Hero />
          <Story />
          <Capabilities />
          <Work />
          <Proof />
          <Clients />
          <Contact />
        </main>

        <Footer />
      </TierSystems>

      {/* The loader covers everything, including the header, and is the last
          thing to leave the screen. */}
      {!loaded && (
        <Loader
          onComplete={() => {
            setLoaded(true)
            setReady(true)
          }}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <PerformanceTierProvider>
      <AppReadyProvider>
        <Page />
      </AppReadyProvider>
    </PerformanceTierProvider>
  )
}
