/* ───────────────────────────────────────────────────────────────────────────
   ui/Button — the only interactive primitive on the site.

   Every variant has an explicit hover state and a :focus-visible state that
   survives the custom cursor being active (Section 12). The magnetic pull is
   applied through the wrapper, not the element, so the transform never fights
   the CSS transition on the label.
   ─────────────────────────────────────────────────────────────────────────── */

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useMagnetic } from '../../hooks/useMagnetic'
import { usePerformanceTier } from '../../hooks/usePerformanceTier'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export type ButtonVariant = 'primary' | 'outline' | 'quiet'

interface CommonProps {
  children: ReactNode
  variant?: ButtonVariant
  /** Arrow glyph after the label. Primary and outline only. */
  withArrow?: boolean
  /** Apply the theme's magnetic pull. */
  magnetic?: boolean
  className?: string
}

type AnchorProps = CommonProps & {
  href: string
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick' | 'className' | 'children'>

type NativeButtonProps = CommonProps & {
  href?: undefined
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

export type ButtonProps = AnchorProps | NativeButtonProps

/** Height, padding and the type size, shared by all three variants. */
const BASE =
  'group relative inline-flex items-center justify-center gap-3 ' +
  'font-label text-label leading-none whitespace-nowrap ' +
  'disabled:pointer-events-none disabled:opacity-40'

const VARIANTS: Record<ButtonVariant, string> = {
  // Gold fill. The wipe is a secondary layer that slides up from the bottom,
  // so the label inverts rather than the whole element repainting.
  primary:
    'bg-primary text-bg px-8 py-4 ' +
    'transition-colors duration-[var(--rv-dur-fast)] ease-[var(--rv-ease-primary)] ' +
    'hover:bg-glow',
  outline:
    'border border-line-strong text-text px-8 py-4 ' +
    'transition-colors duration-[var(--rv-dur-fast)] ease-[var(--rv-ease-primary)] ' +
    'hover:border-primary hover:text-primary',
  // Text-only. The underline wipes in from the left, matching .link-wipe.
  quiet: 'text-text px-0 py-2 gap-2',
}

export function Button(props: ButtonProps) {
  // `children`, `variant`, `withArrow`, `magnetic` and `className` are ours,
  // not the DOM's — pull them out so nothing invalid reaches the element.
  const { children, variant = 'primary', withArrow = false, magnetic = false, className = '', ...rest } = props
  const reduced = useReducedMotion()
  const { tier } = usePerformanceTier()
  // Magnets are a pointer-only affordance and pointless without motion.
  const magnetRef = useMagnetic<HTMLSpanElement>({ disabled: reduced || tier === 'static' })

  const classes = `${BASE} ${VARIANTS[variant]} ${className}`.trim()

  const inner = (
    <>
      {variant === 'primary' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-glow transition-transform duration-[var(--rv-dur-fast)] ease-[var(--rv-ease-primary)] group-hover:scale-y-100"
        />
      )}
      {variant === 'outline' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-primary/10 transition-transform duration-[var(--rv-dur-base)] ease-[var(--rv-ease-primary)] group-hover:scale-y-100"
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-3">
        {children}
        {withArrow && (
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-[var(--rv-dur-fast)] ease-[var(--rv-ease-primary)] group-hover:translate-x-1.5"
          >
            →
          </span>
        )}
      </span>
    </>
  )

  // Magnetic wrapper: an inline-block span so the transform has a box to move
  // inside and cannot shift surrounding layout.
  if (magnetic) {
    return (
      <span ref={magnetRef} className="inline-block will-change-transform">
        {typeof (rest as AnchorProps).href === 'string' ? (
          <a {...(rest as AnchorProps)} className={classes} data-cursor="hover">
            {inner}
          </a>
        ) : (
          <button {...(rest as NativeButtonProps)} type={(rest as NativeButtonProps).type ?? 'button'} className={classes} data-cursor="hover">
            {inner}
          </button>
        )}
      </span>
    )
  }

  if (typeof (rest as AnchorProps).href === 'string') {
    return (
      <a {...(rest as AnchorProps)} className={classes} data-cursor="hover">
        {inner}
      </a>
    )
  }

  return (
    <button {...(rest as NativeButtonProps)} type={(rest as NativeButtonProps).type ?? 'button'} className={classes} data-cursor="hover">
      {inner}
    </button>
  )
}
