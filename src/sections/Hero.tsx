/* ───────────────────────────────────────────────────────────────────────────
   sections/Hero

   Legibility rules from Section 10, item 1, implemented literally:
     · a soft, edge-free dark gradient behind the headline — strongest at
       ~18% from the left, gone by ~48%, with no hard edge anywhere in it
     · the headline itself is a white → warm-tint gradient with a soft shadow,
       so it separates from the moving 3D behind it without an outline
     · an oversized wordmark, ~90vw, centred and bottom-anchored, which the
       theme allows because an editorial portfolio is exactly where that
       treatment belongs

   The headline reveals line by line after the loader clears, driven by
   SplitText. Everything else is CSS.
   ─────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from 'react'
import { hero, person } from '../content/site'
import { theme } from '../theme/theme.config'
import { useAppReady } from '../hooks/useAppReady'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { usePerformanceTier } from '../hooks/usePerformanceTier'
import { useMagnetic } from '../hooks/useMagnetic'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LineReveal } from '../components/ui/LineReveal'
import { Marquee } from '../components/ui/Marquee'
import { subscribeScroll } from '../lib/scrollStore'
import { useRevealSettled } from '../hooks/useRevealSettled'

export function Hero() {
  const ready = useAppReady()
  const reduced = useReducedMotion()
  const { tier } = usePerformanceTier()
  const contentRef = useRef<HTMLDivElement>(null)
  const wordmarkRef = useRef<HTMLDivElement>(null)
  const ctaRef = useMagnetic<HTMLDivElement>({ disabled: reduced || tier === 'static' })

  /* The hero content is gated on the loader clearing. If the transition that
     carries it never runs — frozen tab, disabled animations — it must still
     become readable, so the whole block settles on a timer as well. */
  const settleAt = 0.35 + hero.headline.length * 0.16 + 0.2 + theme.motion.duration.slow
  const settled = useRevealSettled(ready, settleAt)
  const shown = ready || settled

  /* Once settled, the fade is dropped and the final opacity is simply applied.
     A transition that never runs would otherwise hold these at opacity 0
     forever — see useRevealSettled. */
  const FADE = settled
    ? ''
    : 'transition-opacity duration-[var(--rv-dur-slow)] ease-[var(--rv-ease-primary)]'

  /* The hero content lifts and fades as the page leaves, which hands the
     screen over to the 3D rather than cutting to it. Written straight to the
     node from the shared scroll subscription — no state, no re-render. */
  useEffect(() => {
    const content = contentRef.current
    const wordmark = wordmarkRef.current
    if (!content || !wordmark) return

    return subscribeScroll((state) => {
      // Only the first viewport's worth of scroll affects the hero.
      const p = Math.min(1, state.y / (window.innerHeight || 1))
      // `shown` is folded in rather than only being the initial value: this
      // handler owns the node's opacity from the first scroll event onward, so
      // without it the wordmark would appear while the headline above it was
      // still hidden.
      const visible = shown ? 1 : 0
      content.style.transform = `translate3d(0, ${(p * -70).toFixed(2)}px, 0)`
      content.style.opacity = String(visible * Math.max(0, 1 - p * 1.5))
      // The wordmark drifts the other way — the parallax between them is what
      // makes the bottom of the hero read as a separate plane.
      wordmark.style.transform = `translate3d(0, ${(p * 40).toFixed(2)}px, 0)`
      wordmark.style.opacity = String(visible * Math.max(0, 1 - p * 1.9))
    })
  }, [shown])

  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden">
      {/* Legibility wash. No hard edge: one long, angled ramp. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(102deg, ${theme.palette.bg}f2 0%, ${theme.palette.bg}d9 18%, ${theme.palette.bg}8c 34%, ${theme.palette.bg}00 48%, transparent 62%)`,
        }}
      />

      <div ref={contentRef} className="shell relative z-[2] flex min-h-0 flex-1 flex-col justify-center pt-20 pb-4">
        <div className="max-w-[46rem]">
          <div
            className={FADE}
            style={{ opacity: shown ? 1 : 0, transitionDelay: '0.15s' }}
          >
            <Badge pulse={!reduced && tier !== 'static'}>{hero.badge}</Badge>
          </div>

          <h1
            className="mt-6"
            style={{
              /* Viewport-height aware. The theme's 5xl is right on a 27" display
                 and wrong on a laptop, and the whole hero has to fit one
                 screen, so the hero opts out of the shared scale. */
              fontSize: 'clamp(2.75rem, min(9vw, 15vh), 9.5rem)',
              // White → warm bone. Reads as one colour at a glance and gives
              // the type a lit edge without introducing a second hue.
              backgroundImage: `linear-gradient(104deg, ${theme.palette.text} 12%, ${theme.palette.secondary} 68%, ${theme.palette.textMuted} 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              // text-shadow does not survive transparent text; drop-shadow does.
              filter: 'drop-shadow(0 6px 34px rgba(0,0,0,0.55))',
            }}
          >
            {/*
              LineReveal, not SplitText: this is the only gradient-filled text
              on the site, and background-clip: text does not paint through
              dozens of animating descendants. Two masked lines is reliable and
              is the better editorial gesture anyway. See ui/LineReveal.tsx.
            */}
            <LineReveal as="span" lines={hero.headline} active={ready} delay={0.35} />
          </h1>

          <p
            className={`mt-6 max-w-[38rem] text-lg text-muted ${FADE}`}
            style={{ opacity: shown ? 1 : 0, transitionDelay: `${0.35 + hero.headline.length * 0.22 + 0.1}s` }}
          >
            {hero.supporting}
          </p>

          <div
            ref={ctaRef}
            className={`mt-8 flex flex-wrap items-center gap-4 ${FADE}`}
            style={{ opacity: shown ? 1 : 0, transitionDelay: `${0.35 + hero.headline.length * 0.22 + 0.2}s` }}
          >
            <Button href={hero.primaryCta.href} magnetic withArrow>
              {hero.primaryCta.label}
            </Button>
            <Button href={hero.secondaryCta.href} variant="quiet">
              {hero.secondaryCta.label}
            </Button>
          </div>
        </div>
      </div>

      {/* Oversized wordmark, bottom-anchored. It sits behind the content above
          and is the last thing to leave the screen. */}
      <div
        ref={wordmarkRef}
        aria-hidden="true"
        className="pointer-events-none relative z-[1] select-none"
        style={{
          opacity: shown ? 1 : 0,
          transition: `opacity ${theme.motion.duration.slow}s ${theme.motion.ease.primary} 0.5s`,
        }}
      >
        <div
          className="whitespace-nowrap text-center font-display leading-[0.82] tracking-[-0.03em]"
          style={{
            /* ~89vw at 16:9, but capped by viewport height so a short laptop
               screen doesn't push the wordmark and the strip below it off the
               bottom of its own hero. */
            fontSize: 'clamp(2.6rem, min(13.2vw, 20vh), 13.5rem)',
            backgroundImage: `linear-gradient(180deg, ${theme.palette.secondary} 0%, ${theme.palette.textMuted} 58%, ${theme.palette.bg} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            // The bottom of the wordmark dissolves into the page.
            maskImage: 'linear-gradient(180deg, black 46%, transparent 96%)',
            WebkitMaskImage: 'linear-gradient(180deg, black 46%, transparent 96%)',
          }}
        >
          {person.name.toUpperCase()}
        </div>
      </div>

      {/* Capability strip. Two marquees, opposite directions, per Section 10. */}
      <div className="relative z-[2] border-y border-line py-5">
        <Marquee
          items={hero.marqueeWords}
          direction="left"
          speed={44}
          itemClassName="text-sm"
        />
      </div>
    </section>
  )
}
