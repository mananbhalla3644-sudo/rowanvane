/* ───────────────────────────────────────────────────────────────────────────
   sections/Footer

   Closes the page with the same oversized wordmark the hero opens with, so the
   first and last things a visitor sees are the same gesture. The colophon is
   there because an editorial portfolio that hides its own typeface is being
   coy about something a design audience will look for.
   ─────────────────────────────────────────────────────────────────────────── */

import { footer, person } from '../content/site'
import { theme } from '../theme/theme.config'
import { useInView } from '../hooks/useInView'

export function Footer() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 })

  return (
    <footer className="relative overflow-hidden border-t border-line" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Site footer
      </h2>

      <div className="shell py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* The one action, restated. */}
          <div className="lg:col-span-5">
            <p className="label text-faint">{footer.statement}</p>
            <a
              href="#contact"
              className="link-wipe mt-5 inline-block font-display text-2xl text-text lg:text-3xl"
              data-cursor="hover"
            >
              {person.email}
            </a>
          </div>

          {/* Link columns */}
          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-5 lg:col-start-8">
            {footer.columns.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                <h3 className="label text-faint">{column.heading}</h3>
                <ul className="mt-6 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="link-wipe text-sm text-muted hover:text-text"
                        {...(link.href.startsWith('http')
                          ? { target: '_blank', rel: 'noreferrer noopener' }
                          : {})}
                        data-cursor="hover"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-faint">
            © {new Date().getFullYear()} {person.name}. {person.role}.
          </p>
          <p className="text-xs text-faint">{footer.colophon}</p>
        </div>
      </div>

      {/* Closing wordmark. Same treatment as the hero, cut off by the page
          edge so it reads as part of the document rather than an element. */}
      <div
        ref={ref}
        aria-hidden="true"
        className="pointer-events-none select-none"
        style={{
          transform: inView ? 'translateY(0)' : 'translateY(6%)',
          opacity: inView ? 1 : 0,
          transition: `transform ${theme.motion.duration.slow}s ${theme.motion.ease.primary}, opacity ${theme.motion.duration.slow}s ${theme.motion.ease.primary}`,
        }}
      >
        <div
          className="whitespace-nowrap text-center font-display leading-[0.8] tracking-[-0.03em]"
          style={{
            fontSize: 'clamp(3.2rem, 15vw, 14rem)',
            backgroundImage: `linear-gradient(180deg, ${theme.palette.textMuted} 0%, ${theme.palette.bg} 88%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {person.name.toUpperCase()}
        </div>
      </div>
    </footer>
  )
}
