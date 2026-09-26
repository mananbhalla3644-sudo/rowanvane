/* ───────────────────────────────────────────────────────────────────────────
   sections/Work — pinned horizontal scroll.

   Section 10, item 4. The section pins, then the track is scrubbed sideways
   with scroll. Nothing is scroll-jacked: the page still scrolls vertically,
   the pin just holds this one panel while it plays, and releasing the scroll
   hands control straight back.

   Reduced motion is a genuinely different component, not a disabled one. A
   horizontal scroll driven by vertical scrolling is the exact thing
   prefers-reduced-motion exists to prevent, so under that preference the
   projects become a plain vertical stack with no pin and no scrub.

   Each project expands in place to reveal its outcome. There are no case
   study pages to link to, and a portfolio full of links that go nowhere is
   worse than one that says what it is.
   ─────────────────────────────────────────────────────────────────────────── */

import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { work } from '../content/site'
import { theme } from '../theme/theme.config'
import { SectionLabel } from '../components/ui/SectionLabel'
import { SplitText } from '../components/ui/SplitText'
import { WorkPlate } from '../components/ui/WorkPlate'
import { Button } from '../components/ui/Button'
import { useGsapScope } from '../hooks/useGsapScope'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useInView } from '../hooks/useInView'
import { useMagnetic } from '../hooks/useMagnetic'
import { gsap } from '../lib/gsap'

type Project = (typeof work.items)[number]

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [open, setOpen] = useState(false)
  const panelId = `work-outcome-${project.id}`
  const reduced = useReducedMotion()
  const magneticRef = useMagnetic<HTMLButtonElement>({ disabled: reduced })

  return (
    <article className="group relative flex w-[84vw] shrink-0 flex-col sm:w-[64vw] lg:w-[40vw] xl:w-[34vw]">
      <WorkPlate plate={project.plate} seed={index * 17 + 3} title={project.title} />

      <div className="mt-7 flex items-baseline justify-between gap-6 border-b border-line pb-5">
        <div>
          <span className="label text-faint">{project.index}</span>
          <h3 className="mt-3 text-2xl">{project.title}</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-text">{project.client}</p>
          <p className="label mt-2 text-faint">
            {project.discipline} · {project.year}
          </p>
        </div>
      </div>

      <p className="mt-6 max-w-[52ch] text-base text-muted">{project.summary}</p>

      <button
        ref={magneticRef}
        type="button"
        className="mt-6 flex w-full items-center justify-between gap-4 border-t border-line pt-5 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        data-cursor="hover"
      >
        <span className="label text-muted transition-colors duration-[var(--rv-dur-fast)] ease-[var(--rv-ease-primary)] group-hover:text-text">
          {open ? 'Hide outcome' : 'The outcome'}
        </span>
        <span
          aria-hidden="true"
          className="font-display text-lg text-primary transition-transform duration-[var(--rv-dur-base)] ease-[var(--rv-ease-primary)]"
          style={{ transform: open ? 'rotate(45deg)' : 'none' }}
        >
          +
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="outcome"
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{
              duration: reduced ? 0.15 : theme.motion.duration.base,
              ease: theme.motion.ease.primary,
            }}
            className="overflow-hidden"
          >
            <p className="pt-5 text-base text-text">{project.outcome}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}

function ProjectStack() {
  return (
    <div className="mt-16 flex flex-col gap-20">
      {work.items.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} />
      ))}
    </div>
  )
}

export function Work() {
  const reduced = useReducedMotion()
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 })
  const trackRef = useRef<HTMLDivElement>(null)

  /**
   * The pin. Distance is measured from the track's real scrollWidth rather
   * than from a guess, and invalidateOnRefresh makes it re-measure on resize —
   * without that, a window resize leaves the last card stranded off-screen.
   */
  const setup = useCallback(
    (scopeRef: React.RefObject<HTMLDivElement | null>) => {
      const track = trackRef.current
      if (!track) return

      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: scopeRef.current,
          start: 'top top',
          // The pin lasts exactly as long as the travel needs, plus a viewport
          // of run-out, so releasing the scroll always lands somewhere usable.
          end: () => `+=${Math.max(1, distance() + window.innerHeight * 0.6)}`,
          pin: true,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      return () => {
        tween.kill()
      }
    },
    [],
  )

  const scope = useGsapScope(setup, [reduced])

  return (
    <section id="work" className="section" aria-labelledby="work-heading">
      <div className="shell">
        <SectionLabel index="03">{work.label}</SectionLabel>
        <div className="mt-16 grid gap-8 lg:grid-cols-12">
          <div ref={ref} className="lg:col-span-7">
            <h2 id="work-heading" className="text-2xl lg:text-3xl">
              <SplitText as="span" text={work.heading} by="word" active={inView} />
            </h2>
          </div>
          <div className="flex items-end lg:col-span-4 lg:col-start-9">
            <p className="text-base text-muted">{work.supporting}</p>
          </div>
        </div>
      </div>

      {reduced ? (
        <div className="shell">
          <ProjectStack />
        </div>
      ) : (
        <div ref={scope} className="relative mt-20 overflow-hidden">
          <div ref={trackRef} className="flex gap-8 px-[var(--rv-gutter)] will-change-transform">
            {work.items.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
            {/* Trailing card: the ask, so the scrub ends on something rather
                than running out of projects. */}
            <div className="flex w-[84vw] shrink-0 flex-col justify-center sm:w-[64vw] lg:w-[40vw] xl:w-[34vw]">
              <p className="label text-faint">Next</p>
              <h3 className="mt-6 max-w-[16ch] text-3xl">Three of these are under NDA.</h3>
              <p className="mt-6 max-w-[44ch] text-base text-muted">
                The rest of the work is available on request, with the reasoning
                behind it — which is usually the part people actually want to see.
              </p>
              <div className="mt-10">
                <Button href="#contact" variant="outline" withArrow>
                  Ask about the work
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
