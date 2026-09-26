/* ───────────────────────────────────────────────────────────────────────────
   ui/Badge — the availability pill.

   The pulsing dot is CSS-only and is the one continuous animation in the
   component set. It stops under reduced motion via the global media query in
   index.css, and it never carries information on its own — the text beside it
   says the same thing.
   ─────────────────────────────────────────────────────────────────────────── */

interface BadgeProps {
  children: React.ReactNode
  className?: string
  /** Animate the dot. Off for the STATIC tier. */
  pulse?: boolean
}

export function Badge({ children, className = '', pulse = true }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-3 rounded-full border border-line px-4 py-2 ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {pulse && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 motion-safe:animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite]" />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
      </span>
      <span className="label text-muted">{children}</span>
    </span>
  )
}
