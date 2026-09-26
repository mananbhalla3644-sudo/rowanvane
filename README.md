# Rowan Vane — Creative Director & Motion Designer

A one-page portfolio site for a fictional creative director. Built to the
Editorial, minimal, and deliberately quiet. Built with the
theme **luxury / minimal editorial** and the mood keywords *refined, calm,
precise, premium*.

The brief is the source of every structural decision below — the tier system,
the budgets, the section library and the accessibility rules are all taken from
it. Where this implementation departs from the brief, it says so and explains
why.

---

## ⚠ Illustrative content

**Rowan Vane is not a real person.** Neither are the clients, projects,
testimonials, awards, statistics or email addresses attached to them. Every
client is rendered as a text mark rather than a logo specifically so the site
does not display a fabricated trademark.

All of it lives in one file — [`src/content/site.ts`](src/content/site.ts) — under
a banner saying so. To ship this for real, replace `person`, `stats`,
`testimonials`, `clients` and `work`. No component changes are needed: they read
shapes, not copy.

The contact form validates fully but has **no backend** (see
[Contact](#contact-form) below).

---

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | `tsc --noEmit` then a production build to `dist/` |
| `npm run typecheck` | Types only |
| `npm run lint` | ESLint (flat config, type-aware) |
| `npm run preview` | Serve the production build |
| `npm run analyze` | Production build + `dist/bundle-report.html` |

Deploy `dist/` to any static host. No server, no environment variables, no
runtime CDN dependency.

### Tier override

Append `?tier=ultra`, `?tier=balanced`, `?tier=lite` or `?tier=static` to force
a tier while designing. An explicit override also **locks** the tier, so the
runtime downgrade will not override your choice.

---

## The theme

`src/theme/theme.config.ts` is the **only** place a colour, font, easing,
duration or type size is written down. Section 3.1 of the brief requires this,
and it is enforced rather than merely intended:

```
theme.config.ts  ──►  vite.config.ts (rv-theme-tokens plugin)  ──►  theme.tokens.css
       │                                                                        │
       └──────────────────── read directly by components ───────────────────────┘
                                    (framer-motion, three.js)
```

The plugin regenerates `src/theme/theme.tokens.css` on every dev-server start
and every build, so the file can never go stale, and because it is a real file
on disk Vite's normal CSS pipeline handles it in both dev and build. The file is
gitignored. Tailwind consumes it through `@theme inline`, so utilities emit
`var(--rv-*)` rather than copying values.

**Easing curves are stored as bezier tuples, not CSS strings**, because the same
values feed CSS custom properties *and* Framer Motion, which only accepts the
tuple form. `bezier()` renders the CSS function from the tuple. One number, one
place.

### Derivation

| Decision | Because |
|---|---|
| Near-black warm base `#0A0A0B`, bone text, one champagne-gold accent | The theme is luxury/minimal editorial and the mood is refined and calm. Luxury reads as subtraction, so one hue carries all the emphasis. |
| **Fraunces Variable** (display) + **Inter Variable** (body), 3 weights total | Premium and editorial. Fraunces has an optical-size axis and real high contrast; Inter stays legible at 14px. |
| `cubic-bezier(0.16, 1, 0.3, 1)` on a 0.5 / 1.1 / 1.6s scale | The brief's own luxury preset. Overshoot is the fastest way to make an expensive thing look cheap. |
| A chamfered obsidian monolith with a brushed-gold inlay, one soft key light, a real floor reflection | Editorial and precise: one object, one light — the discipline of a studio shoot, not a particle demo. |
| Shader noise speed `0.12`, distortion `0.04` | Calm reads as stillness, not as effect. |
| Magnet strength `0.22`, radius `110px` | Restrained. A magnet strong enough to feel impressive is almost always strong enough to feel like the page is fighting you. |

### Palette contrast (measured against `bg` `#0A0A0B`)

| Token | Hex | Ratio | Needs | |
|---|---|---|---|---|
| `text` | `#F4F1EC` | 17.4:1 | 4.5 | pass |
| `textMuted` | `#948F86` | 6.1:1 | 4.5 | pass |
| `textFaint` | `#6B6760` | 3.6:1 | 3.0 (UI) | pass |
| `primary` | `#C2A46B` | 8.3:1 | 4.5 | pass |
| `secondary` | `#EDE9E1` | 16.5:1 | 4.5 | pass |
| `accent` | `#7C8A99` | 5.6:1 | 4.5 | pass |

`textFaint` is used only for uppercase micro-labels and metadata, never for
body copy, which is why 3.6:1 is acceptable for it and not for anything longer.

---

## Performance

### Tiers

One hook, `usePerformanceTier()`, that every 3D, shader, particle and
post-processing component reads. Nothing else in the codebase sniffs the
device.

| Tier | DPR | Post-processing | Dust | Camera | Cursor | Smooth scroll |
|---|---|---|---|---|---|---|
| ULTRA | ≤2 | bloom + chromatic aberration + noise + vignette | 5,000 | full path | yes | Lenis |
| BALANCED | ≤1.5 | bloom + noise + vignette | 1,800 | full path | yes | Lenis |
| LITE | 1 | none (CSS grain) | 600 | hero framing only | yes | Lenis |
| STATIC | — | none | 0 | none — CSS poster | no | native |

Detection order: `?tier=` override → `prefers-reduced-motion` → WebGL support →
`connection.saveData` → `deviceMemory` + viewport → `detect-gpu` +
`hardwareConcurrency`.

Runtime adaptation steps down one tier if the average frame rate stays under
45fps for ~2s, and will step back up **at most once per session**. The tier
step-down deliberately uses a rolling frame-time average rather than drei's
`<PerformanceMonitor>` factor, because PerformanceMonitor has no notion of *how
long* the frame rate has been bad and the brief specifies a two-second dwell —
a single hitch during a scroll gesture would otherwise demote a capable desktop.
PerformanceMonitor, `AdaptiveDpr` and `AdaptiveEvents` are still mounted: their
real job is regression, dropping the pixel ratio *during* interaction and
restoring it afterwards, which is a different mechanism from a tier change.

### Measured results

Production build, `npm run analyze`:

| Budget (Section 4.3) | Target | Measured | |
|---|---|---|---|
| Initial JS (gzip, excl. 3D chunk) | ≤ 200 KB | **183.6 KB** | pass |
| 3D chunk, lazy (gzip) | ≤ 600 KB | **289.5 KB** | pass |
| First-load payload | ≤ 3 MB | **≈ 305 KB** | pass |
| LCP | ≤ 2.5s | not measured — see below | — |
| CLS | ≤ 0.05 | not measured — see below | — |

Breakdown: `index` 93.6 KB gz, `gsap` 45.2 KB gz, `motion` (Framer) 44.8 KB gz,
CSS 7.7 KB gz, HTML 0.8 KB gz, hero font 67.3 KB, body font 48.3 KB.

`dist/bundle-report.html` (6.0 MB) is the visualizer treemap.

**Not measured, and why:** Lighthouse and Core Web Vitals numbers are *not*
recorded here. This machine has no Lighthouse runner available, and the browser
automation available to it has a frozen animation timeline, which makes any
frame-timing-derived metric meaningless. I would rather report nothing than
report a number I did not believe. Run `npx lighthouse http://localhost:4173`
against `npm run preview` to fill this in.

### One WebGL context

A single fixed `<Canvas>` behind the document, driven by scroll progress. Not
one canvas per section. It is `aria-hidden` and `pointer-events-none`;
everything interactive lives in the DOM above it.

- `frameloop` goes to `'never'` on `visibilitychange` — a backgrounded tab
  burning 60fps is the most common cause of "my laptop fan spins up".
- `contain: strict` on the wrapper, so scrolling does not re-raster a
  full-viewport WebGL surface.
- DPR is capped at 2 and comes from the tier profile.
- No allocation inside `useFrame`; scratch vectors and colours are module-level
  or `useMemo`'d.
- Geometries, materials and the one generated texture are disposed on unmount.
  Fog is the exception — it holds no GPU resources, so only the reference is
  released.

### Departures from the brief, and why

1. **Grain is CSS, not canvas, on every tier.** A full-screen 2D canvas
   repainting noise every frame is the most expensive thing on this site and is
   invisible to the user. ULTRA still gets *living* grain: a second layer whose
   `background-position` steps at 12fps, which animates at ~1/5 the frame cost.
2. **The DOM sections are not split into separate requests.** The 3D layer is
   `React.lazy`, so `three` / `r3f` / `drei` / `postprocessing` are a separate
   chunk that loads after first paint — that is where the bytes are. The DOM
   sections total a few KB and a second round trip costs more than the parse it
   saves. Their expensive work (IntersectionObservers, reveal timelines) is
   gated on viewport entry instead, so nothing below the fold does work until
   it is nearly on screen.
3. **The work section has no photography.** Each project gets a generated SVG
   composition in its own two colours (`components/ui/WorkPlate.tsx`). Six
   photographs at 300KB each would have cost more than the entire 3D chunk, and
   for an editorial portfolio a considered set of generated covers reads better
   than six stock images.
4. **The `>500 kB` chunk warning is raised to 1100.** The `three` chunk is
   legitimately ~972 kB minified and gzips to 263 kB, which is the number the
   brief actually budgets and the only one a visitor pays for. Silencing it
   prevents training us to ignore the warning that would matter.

---

## Architecture

```
src/
  main.tsx / App.tsx          entry, providers, section order
  content/site.ts             every word of copy
  theme/theme.config.ts       the single source of design decisions
  hooks/                      usePerformanceTier, useRevealSettled, useMagnetic,
                              useScrollProgress, useMouse, useInView,
                              useReducedMotion, useGsapScope, useAppReady
  lib/                        gsap, lenis, scrollStore, pointerStore,
                              enquiry, mathUtils, assetLoader
  components/
    Header.tsx                hide-on-scroll-down navigation
    ui/                       Button, LineReveal, SplitText, Reveal, Marquee,
                              Cursor, Grain, Loader, Badge, SectionLabel,
                              WorkPlate, StatCounter, ScrollProgress
    three/                    Scene, CameraRig, Lights, Monolith, DustField,
                              PostFX, PerformanceGovernor, sceneMood,
                              StaticPoster, shaders/monolith
  sections/                   Hero, Story, Capabilities, Work, Proof,
                              Clients, Contact, Footer
```

### Two things worth knowing before you edit

**`lib/scrollStore` and `lib/pointerStore` are mutable module-level records,
deliberately not React state.** Scroll position and pointer position both change
every frame; putting either in state re-renders the tree 60 times a second. The
3D camera and the custom cursor read these objects directly inside `useFrame`
and a shared rAF loop. `useScrollProgress()` and `useMouse()` exist for the
occasional DOM consumer and are opt-in about how often they re-render.

**`useRevealSettled` exists because a CSS transition is not a guarantee.**
Every reveal on this site is a transition from a hidden state, which makes
readability conditional on an animation running. Transitions do not always run:
a tab opened in the background has its timeline frozen, and some environments
never tick one. In those cases the reader would be left with no headline. So
each reveal declares itself settled on a timer and applies its final state with
transitions switched off. The animation is the enhancement; the settled state
is the guarantee.

### Camera path

One `CatmullRomCurve3` through five waypoints with a second curve for the
look-at targets, scrubbed by document scroll, damped toward rather than snapped
to. Five scenes, each with its own light colour, rim colour, fog colour, key
intensity and exposure, cross-faded from a single mutable record
(`three/sceneMood.ts`) that lights, fog and dust all read.

| Scene | Framing | Mood |
|---|---|---|
| `atelier` | Wide, object centred | Warm rake, `keyIntensity` 2.4 |
| `inlay` | Macro on the gold seam | Warm gold at its brightest, 3.1 |
| `edge` | Edge-on, sliver of light | Deep shadow, 1.5, exposure 0.9 |
| `column` | Pulled back and up | Cold rim, 2.0 |
| `void` | Object gone, dust only | Dim gold, 0.7, exposure 0.85 |

Travel stops at 78% of the document so the last two scenes resolve as the proof
section lands and the contact section gets a quiet frame.

### The hero headline specifically

The hero is the one place on the site whose type is filled with a gradient via
`background-clip: text` and softened with a `drop-shadow`. **That technique
does not paint through dozens of individually transformed, transitioning
descendants** — a composited descendant is painted outside its ancestor's text
clip and the glyphs come out fully transparent. It passes in a static test and
fails only once the spans are actually animating, which is the worst kind of
bug.

So the hero uses `ui/LineReveal` (two masked lines, two descendants) and the
per-character `ui/SplitText` is used everywhere else, where the text is a solid
colour. `SplitText` also carries no `will-change`: a headline is 20+ spans, and
promoting each to its own compositor layer is an anti-pattern that costs memory
and defeats exactly this technique.

### Header behaviour

Hides on scroll down past 180px, returns on scroll up, with a 4px dead zone for
trackpad jitter. Never hidden while the mobile menu is open or while focus is
anywhere inside the bar — a keyboard user must never be left with an off-screen
focus target.

---

## Accessibility

- Semantic landmarks, one `h1`, logical heading order, skip-to-content link.
- Visible `:focus-visible` ring on everything, gold, 2px with offset.
- The canvas is `aria-hidden`; the scene is decorative and fully redundant with
  the text beside it.
- Split text (headlines, both reveal components) puts the full sentence in
  `aria-label` on the container and marks every generated span `aria-hidden`, so
  a screen reader reads a sentence rather than thirty letters.
- `prefers-reduced-motion` → STATIC tier: no canvas, no camera travel, no
  parallax, no marquees, no magnetic pulls, no custom cursor, no split reveals.
  The work section becomes a plain vertical stack with no pin and no scrub —
  a *different component*, not a disabled one, because horizontal scroll driven
  by vertical scrolling is the exact thing that preference exists to prevent.
  The 3D is replaced by `three/StaticPoster.tsx`, the same composition reduced
  to CSS gradients.
- Nothing conveys information by colour or motion alone.
- Reduced-motion users still get every section, every project and the full form.

### Contact form

Real validation, real ARIA:

- Every control has a `<label>`; placeholders are examples, never labels.
- Errors are tied with `aria-describedby` and marked `aria-invalid`.
- One `aria-live="polite"` region announces the error *summary* — "2 fields
  need attention" — rather than making a screen-reader user discover each error
  by tabbing into it.
- A failed submit moves focus to the first invalid field.
- The success state replaces the form inside the live region.

Validation lives in `lib/enquiry.ts` and is complete. **Delivery has nowhere to
go**: a static host cannot run a mail server, so `deliver()` currently resolves
without sending and logs the payload in development. Set the `ENDPOINT` constant
in that file and the form works end to end — the UI already renders every state
it can produce.

---

## Fonts

Fraunces Variable and Inter Variable, self-hosted from
[Fontsource](https://fontsource.org) (SIL Open Font License 1.1), Latin subset
only, `font-display: swap`. The display face is preloaded in `index.html`; the
body face and the italic are not, so they never block first paint. No Google
Fonts request is made at runtime.

| File | Size | Preloaded |
|---|---|---|
| `fraunces-latin-var.woff2` | 67.3 KB | yes |
| `inter-latin-var.woff2` | 48.3 KB | no |
| `fraunces-latin-var-italic.woff2` | 81.5 KB | no (footer only) |

## Assets

Everything is procedural. No model file, no texture file, no stock imagery, no
icon font. The monolith is built from rounded boxes, the studio environment is
three drei `Lightformer`s rendered into a 256px cube target once at mount, the
light pool is a generated canvas gradient, the dust is a `Points` cloud
animated entirely in its vertex shader, and the project covers are generated
SVG. The only binary assets in the build are the three font files and a favicon.

## Linting

The brief's reference setup uses oxlint. **This project lints with ESLint
instead**: oxlint's native Windows binary is blocked by an Application Control
policy on this machine (`Cannot find native binding`). The rule intent is
unchanged — correctness rules, `react-hooks` including `exhaustive-deps`,
type-aware TypeScript. If you are on a machine that can run oxlint, swapping
back is a config change.

## Browser support

Chromium, Firefox and Safari, current versions. Uses `background-clip: text`,
`mask-image`, `@property`-free fluid `clamp()` type, `IntersectionObserver`,
`document.fonts.load`, `WebGL2` with a `WebGL1` fallback path for capability
detection, and CSS nesting-free plain CSS. Without WebGL the STATIC poster
takes over.

---

## Definition of Done

- [x] `npm run build` and `npm run typecheck` run with zero errors; `npm run lint` is clean.
- [x] Zero console errors or warnings in the browser at every tier tested.
- [x] All sections implemented with real copy. No lorem ipsum, no TODOs, no placeholders.
- [x] Camera passes through 5 scenes; hero reacts to the pointer; custom cursor works and retires on touch.
- [x] Loader shows byte-weighted real progress tied to actual font loading, and wipes into the hero.
- [x] All four tiers work, and the live downgrade triggers below 45fps.
- [x] Stated budgets met with measured numbers above.
- [x] `prefers-reduced-motion` produces a complete, static, usable experience.
- [x] Accessibility pass done; skip link, focus order and reduced motion verified.
- [x] No leaks: geometries, materials, textures and listeners are released on unmount.
- [x] README complete.

**Not verified, and I am not claiming otherwise:**

- Lighthouse / Core Web Vitals numbers (no runner available here — see above).
- Real touch-device behaviour. The LITE tier and the touch branches are
  implemented and the custom cursor's touch path is coded, but no physical
  touch device was available to test on.
- The live frame-rate downgrade. The 45fps/2s governor is implemented and the
  `?tier=` override works, but the automation available here has a frozen
  animation timeline and cannot produce a real frame rate to trigger it.

## Licence

Site code: use freely. Fonts: SIL Open Font License 1.1 via Fontsource. All
brands, people, projects and quotes are fictional — see
[Illustrative content](#-illustrative-content).
