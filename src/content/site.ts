/* ───────────────────────────────────────────────────────────────────────────
   src/content/site.ts
   Every word of copy on the site lives here. Nothing below is referenced from
   JSX by string literal.

   ⚠ ILLUSTRATIVE CONTENT — READ BEFORE DEPLOYING
   ───────────────────────────────────────────────────────────────────────────
   Rowan Vane is a fictional practitioner invented for this build, and every
   client, project, testimonial, award and number attached to them is likewise
   fictional. None of it is a real person, a real engagement or a real
   statistic. It is written in the shape of a real portfolio so the design can
   be judged honestly, and it is labelled here and in the README so it is
   never mistaken for a claim.

   To ship this for real: replace `person`, `stats`, `testimonials`, `clients`
   and `work` with your own. No component changes are required — they read
   shapes, not copy.
   ─────────────────────────────────────────────────────────────────────────── */

import type { WorkPlate } from '../components/ui/WorkPlate'

export const person = {
  name: 'Rowan Vane',
  /** Shown under the wordmark and in the document title. */
  role: 'Creative Director & Motion Designer',
  location: 'Lisbon, Portugal — working anywhere',
  /** Section 1.1 tagline. Three candidates were written; this is the one the
   *  rest of the copy is built around. */
  tagline: 'The work that outlives the campaign.',
  email: 'studio@rowanvane.com',
  phone: '+351 900 000 000',
  socials: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'LinkedIn', href: 'https://linkedin.com' },
    { label: 'Vimeo', href: 'https://vimeo.com' },
  ],
} as const

export const nav = [
  { label: 'Practice', href: '#practice' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Work', href: '#work' },
  { label: 'Recognition', href: '#recognition' },
  { label: 'Contact', href: '#contact' },
] as const

export const hero = {
  /** Small pill above the headline. */
  badge: 'Taking commissions — Spring 2027',
  /**
   * Split across two lines so SplitText can stagger them independently.
   * "Loud results" is deliberately concrete; the sub-line carries the nuance.
   */
  headline: ['Quiet craft.', 'Loud results.'],
  supporting:
    'I build the brand worlds that carry a launch — identity systems, title sequences and films — for companies that get exactly one shot at a first impression.',
  primaryCta: { label: 'Book an appointment', href: '#contact' },
  secondaryCta: { label: 'See selected work', href: '#work' },
  /** Three-word strip at the bottom of the hero. */
  marqueeWords: ['Direction', 'Motion', 'Identity', 'Film', 'Type', 'Systems'],
} as const

export const story = {
  label: 'Practice',
  heading: 'I work in the gap between a brand’s idea and its first frame.',
  /** Revealed paragraph by paragraph as the camera crosses the first scenes. */
  paragraphs: [
    'Most of what gets made in a launch is decided long before anyone opens a timeline. The argument the work stands on. Whether the typeface argues or whispers. Whether the first three seconds earn the next thirty. I do that part first, on paper, before anything moves.',
    'Then I build the thing itself. A type system that holds at every size it will meet. A motion language strict enough that fifty assets look like one hand made them. A film that says the thing the brief was afraid to say.',
    'I work independently and bring in a small, trusted bench of animators, type designers and sound artists when a project needs more hands than mine. You get one point of contact and one point of accountability.',
  ],
  /** Pulled out of the third paragraph and set large. */
  pullQuote: 'You get one point of contact and one point of accountability.',
  /** Small caption beside the pull quote. */
  pullCaption: 'How the studio is built',
} as const

export const capabilities = {
  label: 'Capabilities',
  heading: 'Four things, done properly.',
  supporting:
    'I would rather turn down a job than stretch across five. These are the four I have spent fourteen years getting sharper at.',
  items: [
    {
      id: 'direction',
      index: '01',
      title: 'Brand Direction',
      body: 'Positioning, narrative and the one argument a campaign can actually stand on. Written down, argued through, agreed before a pixel moves.',
      detail: 'Strategy · Narrative · Messaging hierarchy',
      /** Bento proportions: 2 cols × 2 rows, 1 col × 2 rows, etc. */
      span: 'tall' as const,
    },
    {
      id: 'motion',
      index: '02',
      title: 'Motion Systems',
      body: 'Title sequences, product films, and the rules that keep fifty assets looking like they came from the same afternoon.',
      detail: 'Title design · Film · Motion guidelines',
      span: 'wide' as const,
    },
    {
      id: 'identity',
      index: '03',
      title: 'Identity Design',
      body: 'Marks, type and colour, built to survive being resized by a developer at midnight and printed on something ugly.',
      detail: 'Marks · Typographic systems · Colour',
      span: 'normal' as const,
    },
    {
      id: 'launch',
      index: '04',
      title: 'Launch Direction',
      body: 'The six weeks either side of an announcement — when most of the work actually happens, and almost nobody has a plan for it.',
      detail: 'Campaign architecture · Rollout · Art direction',
      span: 'normal' as const,
    },
  ],
} as const

export const work = {
  label: 'Selected Work',
  heading: 'Six projects that had to work first time.',
  supporting:
    'Pinned horizontally. Each one shipped, each one had a single launch window, and none of them got a second attempt.',
  items: [
    {
      id: 'aperture',
      index: '01',
      title: 'Aperture',
      client: 'Aperture Optics',
      discipline: 'Title sequence',
      year: '2026',
      summary:
        'A ninety-second title sequence for a documentary about lens-making, cut entirely from macro footage of glass being ground.',
      outcome: 'Took the festival’s opening slot and ran as the film’s own title card for its theatrical release.',
      plate: { from: '#2A2419', to: '#0A0A0B', motif: 'ring', accent: '#C2A46B' } satisfies WorkPlate,
    },
    {
      id: 'nocturne',
      index: '02',
      title: 'Nocturne',
      client: 'Nocturne Audio',
      discipline: 'Launch film',
      year: '2025',
      summary:
        'A launch film for a high-end headphone, shot in one take on a single turntable, sound designed to land before the picture does.',
      outcome: 'Sold out the first production run in nine days and set the brand’s tone for everything after it.',
      plate: { from: '#141A22', to: '#0A0A0B', motif: 'wave', accent: '#7C8A99' } satisfies WorkPlate,
    },
    {
      id: 'halide',
      index: '03',
      title: 'Halide',
      client: 'Halide Press',
      discipline: 'Brand system',
      year: '2025',
      summary:
        'A full identity and typographic system for an independent publisher, designed around a single variable axis for book weight.',
      outcome: 'Doubled the press’s direct-to-reader list in its first year and removed a third of its production cost.',
      plate: { from: '#1C1C20', to: '#0A0A0B', motif: 'bars', accent: '#EDE9E1' } satisfies WorkPlate,
    },
    {
      id: 'verso',
      index: '04',
      title: 'Verso',
      client: 'Verso Instruments',
      discipline: 'Product film',
      year: '2024',
      summary:
        'Four films for a range of studio monitors, shot without a set — a single hard light, a grey card, and patience.',
      outcome: 'Became the reference footage the whole product category judged itself against for two years.',
      plate: { from: '#221C14', to: '#0A0A0B', motif: 'blocks', accent: '#C2A46B' } satisfies WorkPlate,
    },
    {
      id: 'solstice',
      index: '05',
      title: 'Solstice',
      client: 'Solstice',
      discipline: 'Identity',
      year: '2024',
      summary:
        'An identity for a skincare house built on the idea that restraint reads as confidence. No gradients, no glass, no exceptions.',
      outcome: 'Carried the brand from a single product to a full range with no new design language required.',
      plate: { from: '#1A1A1E', to: '#0A0A0B', motif: 'arc', accent: '#EDE9E1' } satisfies WorkPlate,
    },
    {
      id: 'meridian',
      index: '06',
      title: 'Meridian',
      client: 'Meridian Rail',
      discipline: 'Campaign',
      year: '2023',
      summary:
        'A campaign for a rail operator built from timetables, filmed on the routes themselves, scored with the cadence of departure boards.',
      outcome: 'Won regional press coverage and lifted off-peak load by 14% across the network in its first quarter.',
      plate: { from: '#161C1A', to: '#0A0A0B', motif: 'grid', accent: '#7C8A99' } satisfies WorkPlate,
    },
  ],
} as const

export const proof = {
  label: 'Recognition',
  heading: 'A few things other people said.',
  supporting:
    'Every project here had one client, one deadline and one chance. These are their words about how it went.',
  stats: [
    { value: 14, suffix: '', label: 'Years independent' },
    { value: 60, suffix: '+', label: 'Launches directed' },
    { value: 9, suffix: '', label: 'Awards & selections' },
    { value: 4, suffix: '', label: 'Continents worked in' },
  ],
  testimonials: [
    {
      quote:
        'Rowan spent the first two weeks refusing to make anything, which was the best thing that could have happened to us. What arrived in week three was the only version of the idea worth having.',
      name: 'Ines Karam',
      role: 'Founder, Aperture Optics',
    },
    {
      quote:
        'We had been told the film would take a crew of twenty. Rowan did it with three people and a hard light, and it looks better than anything the bigger pitch proposed.',
      name: 'Tomas Lindqvist',
      role: 'Head of Brand, Nocturne Audio',
    },
    {
      quote:
        'The part I did not expect was the documentation. We got a motion system we could hand to any agency in the world, and it never once needed defending.',
      name: 'Dara Okonjo',
      role: 'Managing Director, Halide Press',
    },
  ],
  awards: [
    { year: '2026', name: 'D&AD Wood Pencil', detail: 'Aperture — Titles & Credit' },
    { year: '2025', name: 'Ciclope Craft', detail: 'Nocturne — Direction' },
    { year: '2025', name: 'Type Directors Club', detail: 'Halide — Typographic Systems' },
    { year: '2024', name: 'AICP Next', detail: 'Verso — Direction' },
  ],
} as const

export const clients = {
  label: 'Selected Clients',
  /** Fictional company names, rendered as text marks — no fabricated logos. */
  names: [
    'Aperture Optics', 'Nocturne Audio', 'Halide Press', 'Verso Instruments',
    'Solstice', 'Meridian Rail', 'Cassia & Rowe', 'The Foundry Nine',
    'Lumen Athletics', 'Perrin Hotels', 'Atlas Scientific', 'Bureau Ostend',
  ],
} as const

export const contact = {
  label: 'Contact',
  heading: 'Tell me what you’re launching.',
  supporting:
    'I take on a small number of projects each year so each one gets proper attention. Tell me the shape of yours and I’ll come back within two working days with a straight answer about whether I’m the right studio for it.',
  /** The one action this site exists to produce. */
  ctaLabel: 'Send enquiry',
  successTitle: 'Thank you — it has arrived.',
  successBody:
    'Your enquiry is in. You will hear from Rowan within two working days, including if the answer is no.',
  projectTypes: [
    'Brand direction',
    'Motion system',
    'Identity design',
    'Launch film',
    'Something else',
  ] as const,
  timelines: ['As soon as possible', 'Within a month', 'Next quarter', 'Just exploring'] as const,
} as const

export const footer = {
  statement: 'Available for commissions from Spring 2027.',
  columns: [
    {
      heading: 'Studio',
      links: [
        { label: 'Practice', href: '#practice' },
        { label: 'Capabilities', href: '#capabilities' },
        { label: 'Selected Work', href: '#work' },
        { label: 'Recognition', href: '#recognition' },
      ],
    },
    {
      heading: 'Elsewhere',
      links: [
        { label: 'Instagram', href: 'https://instagram.com' },
        { label: 'LinkedIn', href: 'https://linkedin.com' },
        { label: 'Vimeo', href: 'https://vimeo.com' },
        { label: person.email, href: `mailto:${person.email}` },
      ],
    },
  ],
  colophon:
    'Set in Fraunces and Inter. Built with React Three Fiber. No trackers, no cookies.',
} as const
