/* ───────────────────────────────────────────────────────────────────────────
   sections/Story

   The camera is crossing from the 'atelier' scene into 'inlay' while this is
   on screen, so the type is set wide and the paragraphs are revealed one at a
   time against a nearly empty right-hand column. The pull quote is the only
   large type in the section; everything else stays at body size so the quote
   actually lands.
   ─────────────────────────────────────────────────────────────────────────── */

import { story } from '../content/site'
import { SectionLabel } from '../components/ui/SectionLabel'
import { SplitText } from '../components/ui/SplitText'
import { Reveal } from '../components/ui/Reveal'
import { useInView } from '../hooks/useInView'

export function Story() {
  const { ref: headingRef, inView: headingIn } = useInView<HTMLDivElement>({ threshold: 0.3 })

  return (
    <section id="practice" className="section shell" aria-labelledby="story-heading">
      <SectionLabel index="01">{story.label}</SectionLabel>

      <div className="mt-16 grid gap-x-12 gap-y-16 lg:grid-cols-12">
        {/* Heading column */}
        <div ref={headingRef} className="lg:col-span-5">
          <h2 id="story-heading" className="text-2xl lg:text-3xl">
            <SplitText
              as="span"
              text={story.heading}
              by="word"
              active={headingIn}
            />
          </h2>
        </div>

        {/* Body column */}
        <div className="lg:col-span-6 lg:col-start-7">
          <div className="flex flex-col gap-7">
            {story.paragraphs.map((paragraph, index) => (
              <Reveal key={index} as="p" y={22}>
                <span className="block text-lg text-muted">{paragraph}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* Pull quote, set against a rule. Deliberately the only large type here. */}
      <Reveal className="mt-24 lg:mt-32">
        <figure className="shell max-w-none border-t border-line pt-12">
          <blockquote>
            <p className="max-w-[30ch] font-display text-2xl leading-[1.24] text-text lg:text-3xl">
              “{story.pullQuote}”
            </p>
          </blockquote>
          <figcaption className="label mt-8 text-faint">{story.pullCaption}</figcaption>
        </figure>
      </Reveal>
    </section>
  )
}
