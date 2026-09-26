/* ───────────────────────────────────────────────────────────────────────────
   Header — fixed navigation.

   Hide-on-scroll-down, reveal-on-scroll-up. Once the reader is past the hero
   they are reading, not navigating, so the bar gets out of the way; the moment
   they scroll back up — signalling they want to navigate — it returns. It is
   never hidden near the top of the page, where it is the primary orientation
   cue, and never while the mobile menu is open or anything inside it has focus.

   Direction is read from the shared scroll store inside a subscription rather
   than from React state on every frame, so scrolling does not re-render the
   component tree sixty times a second. A 4px dead zone stops trackpad jitter
   from flickering the bar.

   The mobile menu is a real focus trap with Escape-to-close and a body scroll
   lock, not a slide-in panel that leaves the page behind it scrollable.
   ─────────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { nav, person } from '../content/site'
import { theme } from '../theme/theme.config'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { lockScroll } from '../lib/lenis'
import { subscribeScroll } from '../lib/scrollStore'
import { Button } from './ui/Button'

/** Never hide the bar within this many px of the top of the document. */
const ALWAYS_VISIBLE_UNTIL = 180
/** Ignore scroll deltas smaller than this — trackpad noise, not intent. */
const DIRECTION_DEADZONE = 4

export function Header() {
  const { scrolled } = useScrollProgress({ keys: ['scrolled'] })
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const reduced = useReducedMotion()
  const menuId = useId()

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    let lastY = window.scrollY
    return subscribeScroll((state) => {
      const y = state.y
      const delta = y - lastY
      if (Math.abs(delta) < DIRECTION_DEADZONE) return
      lastY = y
      if (y < ALWAYS_VISIBLE_UNTIL) setDismissed(false)
      else setDismissed(delta > 0)
    })
  }, [])

  /* A keyboard user must never be left with an off-screen focus target, so any
     focus landing inside the bar brings it back regardless of direction. */
  const hidden = dismissed && !open && !focusWithin

  // The menu owns the page while it is open.
  useEffect(() => {
    lockScroll(open)
    return () => lockScroll(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[80] transition-[background-color,border-color,backdrop-filter] duration-[var(--rv-dur-base)] ease-[var(--rv-ease-primary)] ${
        scrolled ? 'border-b border-line bg-bg/78 backdrop-blur-md' : 'border-b border-transparent'
      }`}
      style={{
        /* transform rather than Tailwind's translate utility so the
           transition target is explicit and does not depend on which of the two
           properties v4 decides to drive. */
        transform: hidden ? 'translate3d(0, -101%, 0)' : 'translate3d(0, 0, 0)',
        transitionProperty: 'transform, background-color, border-color, backdrop-filter',
        // Instant under reduced motion, but still hides — the behaviour is
        // useful, the travel is what is objectionable.
        transitionDuration: reduced ? '0ms' : undefined,
      }}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        // Only clear when focus has genuinely left the bar, not when it moves
        // between two controls inside it.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false)
      }}
    >
      <div className="shell flex h-[72px] items-center justify-between gap-8">
        <a
          href="#top"
          className="font-display text-lg tracking-[0.02em] text-text"
          data-cursor="hover"
        >
          {person.name}
        </a>

        {/* Desktop navigation */}
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-9">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="link-wipe label text-muted hover:text-text" data-cursor="hover">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:block">
          <Button href="#contact" variant="outline" withArrow>
            Book an appointment
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden flex h-11 w-11 items-center justify-center"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
          data-cursor="hover"
        >
          <span className="relative block h-3 w-6">
            <span
              className="absolute left-0 block h-px w-full bg-text transition-transform duration-[var(--rv-dur-base)] ease-[var(--rv-ease-primary)]"
              style={{ top: open ? '6px' : '0px', transform: open ? 'rotate(45deg)' : 'none' }}
            />
            <span
              className="absolute left-0 block h-px w-full bg-text transition-transform duration-[var(--rv-dur-base)] ease-[var(--rv-ease-primary)]"
              style={{ top: open ? '6px' : '12px', transform: open ? 'rotate(-45deg)' : 'none' }}
            />
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            id={menuId}
            aria-label="Primary"
            className="overflow-hidden border-t border-line bg-bg md:hidden"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : theme.motion.duration.base, ease: theme.motion.ease.primary }}
          >
            <ul className="shell flex flex-col py-6">
              {nav.map((item, index) => (
                <motion.li
                  key={item.href}
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reduced ? 0 : index * theme.motion.stagger * 0.6,
                    duration: reduced ? 0.15 : theme.motion.duration.fast,
                    ease: theme.motion.ease.primary,
                  }}
                  className="border-b border-line last:border-b-0"
                >
                  <a
                    href={item.href}
                    onClick={close}
                    className="block py-5 font-display text-2xl text-text"
                    data-cursor="hover"
                  >
                    {item.label}
                  </a>
                </motion.li>
              ))}
              <li className="pt-6">
                <Button href="#contact" onClick={close} className="w-full" withArrow>
                  Book an appointment
                </Button>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
