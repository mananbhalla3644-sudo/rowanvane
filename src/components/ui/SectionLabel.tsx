/* ───────────────────────────────────────────────────────────────────────────
   ui/SectionLabel — the eyebrow every section opens with.

   Number, label, and a hairline that fills in from the left as the section
   enters. The rule is a sibling rather than a pseudo-element so its width can
   be driven by the same reveal state as everything else.
   ─────────────────────────────────────────────────────────────────────────── */

import { useInView } from '../../hooks/useInView'
import { theme } from '../../theme/theme.config'

interface SectionLabelProps {
  /** Section number, e.g. "01". Omit to drop the number. */
  index?: string
  children: React.ReactNode
  className?: string
  /** Tint the rule and the number gold once the section is on screen. */
  activeColor?: boolean
}

export function SectionLabel({ index, children, className = '', activeColor = false }: SectionLabelProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.6 })

  return (
    <div ref={ref} className={`flex items-center gap-6 ${className}`}>
      {index && (
        <span
          className="font-display text-xs tabular-nums text-faint transition-colors duration-[var(--rv-dur-slow)] ease-[var(--rv-ease-primary)]"
          style={inView && activeColor ? { color: theme.palette.primary } : undefined}
        >
          {index}
        </span>
      )}
      <span className="label text-muted">{children}</span>
      <span className="relative h-px flex-1 overflow-hidden bg-line">
        <span
          className="absolute inset-y-0 left-0 bg-primary/60 transition-transform duration-[var(--rv-dur-slow)] ease-[var(--rv-ease-primary)]"
          style={{ transform: `scaleX(${inView ? 1 : 0})`, transformOrigin: 'left' }}
        />
      </span>
    </div>
  )
}
