/* ───────────────────────────────────────────────────────────────────────────
   sections/Contact

   This is the one action the whole site exists to produce, so the form gets
   real work: real validation, real inline errors, real ARIA.

   Accessibility specifics (Section 12):
     · every control has a <label>, never a placeholder-as-label
     · errors are tied with aria-describedby and marked aria-invalid
     · a single aria-live="polite" region announces the error summary, so a
       screen reader user hears "3 fields need attention" once rather than
       discovering each error by tabbing into it
     · focus moves to the first invalid field on a failed submit
     · the success message replaces the form in the live region

   ⚠ There is no backend. handleSubmit validates, then hands the payload to
     submitEnquiry() in lib/enquiry.ts, which is the documented integration
     point. See the README.
   ─────────────────────────────────────────────────────────────────────────── */

import { useId, useRef, useState, type FormEvent } from 'react'
import { contact, footer, person } from '../content/site'
import { theme } from '../theme/theme.config'
import { SectionLabel } from '../components/ui/SectionLabel'
import { SplitText } from '../components/ui/SplitText'
import { Reveal } from '../components/ui/Reveal'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useInView } from '../hooks/useInView'
import { submitEnquiry, type Enquiry, type Errors } from '../lib/enquiry'

const EMPTY: Enquiry = {
  name: '',
  email: '',
  company: '',
  projectType: '',
  timeline: '',
  message: '',
}

export function Contact() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 })
  const uid = useId()
  const [values, setValues] = useState<Enquiry>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof Enquiry, boolean>>>({})
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const id = (field: keyof Enquiry) => `${uid}-${field}`
  const errorFor = (field: keyof Enquiry) => (touched[field] ? errors[field] : undefined)
  const errorCount = Object.values(errors).length

  const update = (field: keyof Enquiry) => (value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }))
    // Clear the error as soon as the field becomes valid, so the message does
    // not sit there contradicting what the user just typed.
    if (errors[field]) {
      setErrors((previous) => {
        if (!previous[field]) return previous
        const next = { ...previous }
        delete next[field]
        return next
      })
    }
  }

  const blur = (field: keyof Enquiry) => () => {
    setTouched((previous) => ({ ...previous, [field]: true }))
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched({ name: true, email: true, projectType: true, message: true })

    const result = await submitEnquiry(values)
    if (!result.ok) {
      setErrors(result.errors)
      // Move focus to the first field that needs attention, so keyboard and
      // screen-reader users are not left at the top of a form they just failed.
      const firstInvalid = result.order.find((field) => result.errors[field])
      if (firstInvalid) {
        formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(firstInvalid))}`)?.focus()
      }
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      await result.deliver(values)
      setSent(true)
    } catch {
      setErrors({ form: 'Something went wrong sending that. Email me directly and I will pick it up.' })
    } finally {
      setSubmitting(false)
    }
  }

  const fieldClass = (field: keyof Enquiry) =>
    `w-full border-b bg-transparent py-4 text-lg text-text transition-colors duration-[var(--rv-dur-fast)] ease-[var(--rv-ease-primary)] outline-none placeholder:text-faint focus:border-primary ${
      errorFor(field) ? 'border-red-400/70' : 'border-line hover:border-line-strong'
    }`

  return (
    <section id="contact" className="section shell" aria-labelledby="contact-heading">
      <SectionLabel index="05">{contact.label}</SectionLabel>

      <div className="mt-16 grid gap-x-12 gap-y-16 lg:grid-cols-12">
        {/* Left: the pitch */}
        <div className="lg:col-span-5">
          <h2 id="contact-heading" className="text-2xl lg:text-3xl">
            <SplitText as="span" text={contact.heading} by="word" active={inView} />
          </h2>
          <Reveal as="p" y={20} className="mt-8 max-w-[42ch] text-base text-muted">
            {contact.supporting}
          </Reveal>

          <Reveal y={20} delay={0.1} className="mt-10 flex flex-col gap-4">
            <a href={`mailto:${person.email}`} className="link-wipe text-lg text-text" data-cursor="hover">
              {person.email}
            </a>
            <a href={`tel:${person.phone.replace(/\s/g, '')}`} className="link-wipe text-lg text-muted" data-cursor="hover">
              {person.phone}
            </a>
            <p className="label mt-2 text-faint">{person.location}</p>
          </Reveal>

          <Reveal y={20} delay={0.18} className="mt-10">
            {/* The same sentence as the hero badge and the footer — read from
                one place so the three can never disagree. */}
            <Badge pulse={false}>{footer.statement}</Badge>
          </Reveal>
        </div>

        {/* Right: the form */}
        <div ref={ref} className="lg:col-span-6 lg:col-start-7">
          {sent ? (
            <div
              className="border border-line p-10"
              style={{ background: `linear-gradient(158deg, ${theme.palette.surface} 0%, transparent 100%)` }}
            >
              <h3 className="text-2xl">{contact.successTitle}</h3>
              <p className="mt-5 max-w-[44ch] text-base text-muted">{contact.successBody}</p>
              <div className="mt-8">
                <Button
                  variant="quiet"
                  onClick={() => {
                    setSent(false)
                    setValues(EMPTY)
                    setTouched({})
                  }}
                >
                  Send another
                </Button>
              </div>
            </div>
          ) : (
            <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-9">
              {/* Error summary. One announcement, not six. */}
              <div aria-live="polite" className="empty:hidden">
                {errorCount > 0 && (
                  <p
                    className="border-l-2 border-red-400/70 pl-4 text-sm text-red-300"
                    role="alert"
                  >
                    {errorCount === 1
                      ? 'One field needs attention before this can be sent.'
                      : `${errorCount} fields need attention before this can be sent.`}
                  </p>
                )}
              </div>

              {errors.form && (
                <p role="alert" className="border-l-2 border-red-400/70 pl-4 text-sm text-red-300">
                  {errors.form}
                </p>
              )}

              <Field
                id={id('name')}
                label="Your name"
                error={errorFor('name')}
                hint={undefined}
              >
                <input
                  id={id('name')}
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={values.name}
                  onChange={(e) => update('name')(e.target.value)}
                  onBlur={blur('name')}
                  aria-invalid={errorFor('name') ? true : undefined}
                  aria-describedby={errorFor('name') ? id('name') + '-error' : undefined}
                  className={fieldClass('name')}
                  placeholder="Jordan Hale"
                />
              </Field>

              <Field
                id={id('email')}
                label="Email"
                error={errorFor('email')}
                hint={undefined}
              >
                <input
                  id={id('email')}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={values.email}
                  onChange={(e) => update('email')(e.target.value)}
                  onBlur={blur('email')}
                  aria-invalid={errorFor('email') ? true : undefined}
                  aria-describedby={errorFor('email') ? id('email') + '-error' : undefined}
                  className={fieldClass('email')}
                  placeholder="you@company.com"
                />
              </Field>

              <div className="grid gap-9 sm:grid-cols-2">
                <Field id={id('company')} label="Company" error={undefined} hint={undefined} optional>
                  <input
                    id={id('company')}
                    name="company"
                    type="text"
                    autoComplete="organization"
                    value={values.company}
                    onChange={(e) => update('company')(e.target.value)}
                    className={fieldClass('company')}
                    placeholder="Optional"
                  />
                </Field>

                <Field id={id('timeline')} label="Timeline" error={undefined} hint={undefined} optional>
                  <select
                    id={id('timeline')}
                    name="timeline"
                    value={values.timeline}
                    onChange={(e) => update('timeline')(e.target.value)}
                    className={`${fieldClass('timeline')} cursor-pointer`}
                  >
                    <option value="">No rush</option>
                    {contact.timelines.map((option) => (
                      <option key={option} value={option} className="bg-bg text-text">
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field
                id={id('projectType')}
                label="What do you need"
                error={errorFor('projectType')}
                hint={undefined}
              >
                <select
                  id={id('projectType')}
                  name="projectType"
                  required
                  value={values.projectType}
                  onChange={(e) => update('projectType')(e.target.value)}
                  onBlur={blur('projectType')}
                  aria-invalid={errorFor('projectType') ? true : undefined}
                  aria-describedby={errorFor('projectType') ? id('projectType') + '-error' : undefined}
                  className={`${fieldClass('projectType')} cursor-pointer`}
                >
                  <option value="">Choose one</option>
                  {contact.projectTypes.map((option) => (
                    <option key={option} value={option} className="bg-bg text-text">
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id={id('message')}
                label="About the project"
                error={errorFor('message')}
                hint={undefined}
              >
                <textarea
                  id={id('message')}
                  name="message"
                  required
                  rows={4}
                  value={values.message}
                  onChange={(e) => update('message')(e.target.value)}
                  onBlur={blur('message')}
                  aria-invalid={errorFor('message') ? true : undefined}
                  aria-describedby={errorFor('message') ? id('message') + '-error' : undefined}
                  className={`${fieldClass('message')} resize-y`}
                  placeholder="What are you launching, and when does it have to be live?"
                />
              </Field>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <Button type="submit" magnetic withArrow>
                  {submitting ? 'Sending…' : contact.ctaLabel}
                </Button>
                <p className="max-w-[34ch] text-xs text-faint">
                  No newsletter, no CRM sequence. A reply from Rowan, within two
                  working days.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

/* Label + control + error, in the order a screen reader reads them. */
function Field({
  id,
  label,
  error,
  hint,
  optional = false,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="label mb-1 text-faint">
        {label}
        {optional && <span className="ml-2 normal-case tracking-normal opacity-60">optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-3 text-xs text-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-3 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}
