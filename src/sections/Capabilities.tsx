/* ───────────────────────────────────────────────────────────────────────────
   sections/Capabilities — an asymmetric bento grid.

   Four capabilities, four different proportions, one grid. The layout is
   declared with explicit spans rather than a loop over identical cards,
   because the asymmetry *is* the design: a uniform four-card row would read as
   a feature table, and this section is meant to read as a page from a book.

   Surfaces are glassy — a low-opacity fill, a hairline border and a backdrop
   blur — so the 3D scene behind them shows through faintly. That only works
   because the canvas is fixed behind the document rather than being clipped to
   this section.
   ─────────────────────────────────────────────────────────────────────────── */

import { capabilities } from '../content/site'
import { theme } from '../theme/theme.config'
import { SectionLabel } from '../components/ui/SectionLabel'
import { SplitText } from '../components/ui/SplitText'
import { Reveal } from '../components/ui/Reveal'
import { useInView } from '../hooks/useInView'

const SPANS: Record<string, string> = {
  // 01 runs down the left for two rows; 02 fills the top right; 03 and 04 sit
  // under it. Four columns exactly filled, at every breakpoint.
  tall: 'lg:col-span-2 lg:row-span-2',
  wide: 'lg:col-span-2',
  normal: 'lg:col-span-1',
}

export function Capabilities() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 })

  return (
    <section id="capabilities" className="section shell" aria-labelledby="capabilities-heading">
      <SectionLabel index="02">{capabilities.label}</SectionLabel>

      <div className="mt-16 grid gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <h2 id="capabilities-heading" className="text-2xl lg:text-3xl">
            <SplitText as="span" text={capabilities.heading} by="word" active={inView} />
          </h2>
        </div>
        <div className="flex items-end lg:col-span-1">
          <Reveal as="p" y={18} className="text-base text-muted">
            {capabilities.supporting}
          </Reveal>
        </div>
      </div>

      <div ref={ref} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {capabilities.items.map((item, index) => (
          <Reveal
            key={item.id}
            y={34}
            delay={index * 0.08}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-[var(--rv-radius)] border border-line p-8 transition-colors duration-[var(--rv-dur-base)] ease-[var(--rv-ease-primary)] hover:border-line-strong ${SPANS[item.span]}`}
            style={{
              // Glass: a translucent fill over the fixed canvas behind.
              background: `linear-gradient(158deg, ${theme.palette.surface}cc 0%, ${theme.palette.bgElevated}a8 100%)`,
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              minHeight: item.span === 'tall' ? undefined : 260,
            }}
          >
            {/* A single specular sweep on hover. Transform only — no repaint. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent_38%,rgba(244,241,236,0.055)_50%,transparent_62%)] transition-transform duration-[var(--rv-dur-slow)] ease-[var(--rv-ease-primary)] group-hover:translate-x-full"
            />

            <div className="relative">
              <span className="font-display text-sm tabular-nums text-faint transition-colors duration-[var(--rv-dur-base)] ease-[var(--rv-ease-primary)] group-hover:text-primary">
                {item.index}
              </span>
              <h3 className="mt-8 text-xl lg:text-2xl">{item.title}</h3>
              <p className="mt-5 max-w-[46ch] text-base text-muted">{item.body}</p>
            </div>

            <p className="label relative mt-10 text-faint">{item.detail}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
