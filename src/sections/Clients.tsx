/* ───────────────────────────────────────────────────────────────────────────
   sections/Clients

   Two marquees in opposite directions with staggered spacing (Section 10,
   item 6). The two rows are offset by half an item so the seam between them
   never lines up into a visible column.

   These are rendered as text marks, not logos. Drawing a logo for a company
   that does not exist would be inventing a trademark; a typographic mark is
   both honest and more in keeping with an editorial site.
   ─────────────────────────────────────────────────────────────────────────── */

import { clients } from '../content/site'
import { Marquee } from '../components/ui/Marquee'
import { theme } from '../theme/theme.config'

export function Clients() {
  // Split the list between the two rows so each direction gets its own set,
  // and offset the second by half a step for the stagger.
  const half = Math.ceil(clients.names.length / 2)
  const first = clients.names.slice(0, half)
  const second = clients.names.slice(half)

  return (
    <section aria-labelledby="clients-heading" className="border-y border-line py-20">
      <h2 id="clients-heading" className="shell label mb-14 text-faint">
        {clients.label}
      </h2>

      <div className="flex flex-col gap-5">
        <Marquee
          items={first}
          direction="left"
          speed={52}
          itemClassName="font-display text-xl lg:text-2xl"
          separator="·"
        />
        {/* Negative margin on the first item's leading pad, so the second row's
            rhythm starts half an item out of phase with the first. */}
        <div style={{ marginLeft: `-${theme.cursor.size * 2}px` }}>
          <Marquee
            items={second}
            direction="right"
            speed={64}
            itemClassName="font-display text-xl text-faint lg:text-2xl"
            separator="·"
          />
        </div>
      </div>
    </section>
  )
}
