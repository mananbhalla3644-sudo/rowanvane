/* ───────────────────────────────────────────────────────────────────────────
   sections/Proof

   Stats, then testimonials, then a recognition list.

   The order matters: the counters are the fastest thing on the page to read,
   the quotes take a moment, and the award list is for people who scroll to the
   end anyway. Nothing here is above the fold competing with the work.

   ⚠ The numbers, quotes and awards in src/content/site.ts are illustrative —
     see the banner in that file and the README.
   ─────────────────────────────────────────────────────────────────────────── */

import { proof } from '../content/site'
import { bezier, theme } from '../theme/theme.config'
import { SectionLabel } from '../components/ui/SectionLabel'
import { SplitText } from '../components/ui/SplitText'
import { Reveal } from '../components/ui/Reveal'
import { StatCounter } from '../components/ui/StatCounter'
import { useInView } from '../hooks/useInView'

export function Proof() {
  const { ref, inView } = useInView<HTMLDListElement>({ threshold: 0.25 })

  return (
    <section id="recognition" className="section shell" aria-labelledby="proof-heading">
      <SectionLabel index="04">{proof.label}</SectionLabel>

      <div className="mt-16 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 id="proof-heading" className="text-2xl lg:text-3xl">
            <SplitText as="span" text={proof.heading} by="word" active={inView} />
          </h2>
        </div>
        <div className="flex items-end lg:col-span-4 lg:col-start-9">
          <p className="text-base text-muted">{proof.supporting}</p>
        </div>
      </div>

      {/* Stats */}
      <dl
        ref={ref}
        className="mt-20 grid grid-cols-2 gap-x-8 gap-y-14 border-y border-line py-14 lg:grid-cols-4"
      >
        {proof.stats.map((stat, index) => (
          <Reveal key={stat.label} y={26} delay={index * 0.08}>
            <div>
              <dt className="label text-faint">{stat.label}</dt>
              <dd className="mt-5 font-display text-4xl text-text lg:text-5xl">
                <StatCounter value={stat.value} suffix={stat.suffix} />
              </dd>
            </div>
          </Reveal>
        ))}
      </dl>

      {/* Testimonials */}
      <div className="mt-20 grid gap-12 lg:grid-cols-3 lg:gap-10">
        {proof.testimonials.map((testimonial, index) => (
          <Reveal key={testimonial.name} y={30} delay={index * 0.1}>
            <figure className="flex h-full flex-col justify-between border-t border-line pt-8">
              <blockquote>
                <p className="text-lg leading-relaxed text-text">“{testimonial.quote}”</p>
              </blockquote>
              <figcaption className="mt-8">
                <p className="text-sm text-text">{testimonial.name}</p>
                <p className="label mt-2 text-faint">{testimonial.role}</p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>

      {/* Recognition */}
      <div className="mt-24">
        <h3 className="label text-faint">Awards &amp; selections</h3>
        <ul className="mt-8">
          {proof.awards.map((award, index) => (
            <Reveal key={`${award.year}-${award.name}`} as="li" y={18} delay={index * 0.05}>
              <div
                className="group flex items-baseline gap-6 border-b border-line py-5 transition-colors duration-[var(--rv-dur-fast)] ease-[var(--rv-ease-primary)] hover:border-line-strong"
              >
                <span className="w-14 shrink-0 font-display text-sm tabular-nums text-faint">
                  {award.year}
                </span>
                <span className="flex-1 text-lg text-text">{award.name}</span>
                <span className="hidden text-right text-sm text-muted sm:block">{award.detail}</span>
                <span
                  aria-hidden="true"
                  className="translate-x-[-6px] text-primary opacity-0 transition-all duration-[var(--rv-dur-base)] ease-[var(--rv-ease-primary)] group-hover:translate-x-0 group-hover:opacity-100"
                  style={{ transitionTimingFunction: bezier(theme.motion.ease.primary) }}
                >
                  →
                </span>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
