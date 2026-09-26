/* ───────────────────────────────────────────────────────────────────────────
   lib/enquiry — validation and delivery for the contact form.

   This is the documented integration point. The validation half is real and
   complete; the delivery half has nowhere to go yet, because a static host
   cannot run a mail server. `deliver()` currently resolves without sending
   and logs the payload in development, so the form is fully exercisable
   end-to-end before a backend exists.

   To wire a real endpoint, replace the body of `deliver` with a POST and set
   the endpoint below. Nothing else in the app changes: the form already
   handles the loading and error states it will need.
   ─────────────────────────────────────────────────────────────────────────── */

export interface Enquiry {
  name: string
  email: string
  company: string
  projectType: string
  timeline: string
  message: string
}

export type Errors = Partial<Record<keyof Enquiry | 'form', string>>

/** Field order, used to focus the first invalid control on a failed submit. */
const ORDER: (keyof Enquiry)[] = ['name', 'email', 'company', 'projectType', 'timeline', 'message']

export { ORDER as FIELD_ORDER }

/**
 * A discriminated union so the call site narrows correctly: in the `ok: true`
 * branch `deliver` is guaranteed, and in the `ok: false` branch `errors` always
 * has at least one entry.
 */
export type ValidationResult =
  | { ok: true; errors: Errors; deliver: (values: Enquiry) => Promise<void>; order: (keyof Enquiry)[] }
  | { ok: false; errors: Errors; deliver?: never; order: (keyof Enquiry)[] }

/* Intentionally not a single regex. It rejects the obvious mistakes without
   rejecting valid addresses, which a stricter pattern reliably does. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const MIN_MESSAGE = 24

export function validateEnquiry(values: Enquiry): Errors {
  const errors: Errors = {}

  if (values.name.trim().length < 2) {
    errors.name = 'Please tell me who you are.'
  }

  if (values.email.trim().length === 0) {
    errors.email = 'I need an email address to reply to.'
  } else if (!EMAIL.test(values.email.trim())) {
    errors.email = 'That address does not look complete — check for a typo.'
  }

  if (values.projectType.trim().length === 0) {
    errors.projectType = 'Pick the closest match; we can refine it later.'
  }

  const message = values.message.trim()
  if (message.length === 0) {
    errors.message = 'A sentence or two is enough to start.'
  } else if (message.length < MIN_MESSAGE) {
    errors.message = `A little more detail helps — around ${MIN_MESSAGE} characters at least.`
  }

  return errors
}

export async function submitEnquiry(values: Enquiry): Promise<ValidationResult> {
  const errors = validateEnquiry(values)
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, order: ORDER }
  }

  const trimmed: Enquiry = {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    company: values.company.trim(),
    projectType: values.projectType,
    timeline: values.timeline,
    message: values.message.trim(),
  }

  // `deliver` closes over the trimmed payload, so callers cannot accidentally
  // post the untrimmed values they happened to be holding.
  return { ok: true, errors, order: ORDER, deliver: () => deliver(trimmed) }
}

/* ── Delivery ─────────────────────────────────────────────────────────────
 * Set this to a form endpoint (Formspree, Basin, a Worker, your own route)
 * and uncomment the POST. The UI already renders the success and failure
 * states this can produce.
 */
const ENDPOINT = ''

async function deliver(values: Enquiry): Promise<void> {
  if (ENDPOINT) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(values),
    })
    if (!response.ok) {
      throw new Error(`Enquiry endpoint returned ${response.status}`)
    }
    return
  }

  // No endpoint configured: the form has still been fully validated, so
  // development and design review can exercise every state honestly.
  if (import.meta.env.DEV) {
    console.info('[enquiry] validated, no endpoint configured — payload was:', values)
  }
}
