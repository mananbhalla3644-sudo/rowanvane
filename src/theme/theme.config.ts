// src/theme/theme.config.ts
// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF DESIGN DECISIONS.
//
// Nothing anywhere else in this codebase may hard-code a colour, a font, an
// easing, a duration or a type size. `src/theme/theme.tokens.css` is generated
// from this file by the `rv-theme-tokens` Vite plugin (see vite.config.ts), so
// the values below are the only place they are written down.
//
// DERIVATION (Section 3.3) — theme "luxury / minimal editorial",
// mood keywords: refined, calm, precise, premium.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A cubic-bezier control-point tuple. The CSS form is derived from it in
 * vite.config.ts, so a curve is declared once and consumed by both CSS custom
 * properties and Framer Motion, which only accepts the tuple form.
 */
export type Bezier = readonly [number, number, number, number]

/** Renders a bezier tuple as the CSS `cubic-bezier()` function. */
export const bezier = (curve: Bezier): string => `cubic-bezier(${curve.join(', ')})`

export const theme = {
  meta: {
    name: 'Rowan Vane',
    version: '1.0.0',
    /** Mode A — immersive build. Theme: luxury / minimal editorial. */
    mode: 'A' as const,
  },

  // ── Palette ───────────────────────────────────────────────────────────────
  // "Because the theme is luxury/minimal editorial and the mood is refined and
  //  calm, I chose a near-black warm base with bone text and a single champagne
  //  gold accent — luxury reads as subtraction, so one hue carries all emphasis."
  //
  // WCAG contrast vs bg #0A0A0B (all measured, all pass):
  //   text      #F4F1EC → 17.4:1   (needs 4.5)  PASS
  //   textMuted #948F86 →  6.1:1   (needs 4.5)  PASS
  //   textFaint #6B6760 →  3.6:1   (needs 3.0 for UI/large)  PASS
  //   primary   #C2A46B →  8.3:1   (needs 4.5)  PASS
  //   secondary #EDE9E1 → 16.5:1   (needs 4.5)  PASS
  //   accent    #7C8A99 →  5.6:1   (needs 4.5)  PASS
  //   glow      #D9BC85 → 10.2:1   (needs 3.0)  PASS
  palette: {
    /** Page background. Warm near-black, never pure #000 — pure black kills depth. */
    bg: '#0A0A0B',
    /** Slightly lifted background for alternate bands. */
    bgElevated: '#101012',
    /** Card / panel surface. */
    surface: '#131316',
    /** Alternate surface for nesting and contrast. */
    surfaceAlt: '#1C1C20',
    /** Hairline rules and card borders. */
    line: 'rgba(244, 241, 236, 0.10)',
    /** Hovered / active hairlines. */
    lineStrong: 'rgba(244, 241, 236, 0.22)',
    /** Champagne gold — the single accent, used for emphasis and CTAs. */
    primary: '#C2A46B',
    /** Bone — used for the inverted (light) section. */
    secondary: '#EDE9E1',
    /** Slate — the cool counterpoint, used sparingly for metadata. */
    accent: '#7C8A99',
    /** Primary text. */
    text: '#F4F1EC',
    /** Secondary text. */
    textMuted: '#948F86',
    /** Tertiary text and disabled states. Never used for body copy. */
    textFaint: '#6B6760',
    /** Bloom / glow colour. */
    glow: '#D9BC85',
  },

  // ── Typography ────────────────────────────────────────────────────────────
  // "Because the mood is premium and editorial I paired Fraunces — a
  //  high-contrast optical-size serif — with Inter, which stays legible at
  //  14px. Two families, three weights total: display 300, body 400, body 500."
  //
  // Self-hosted from Fontsource (SIL OFL 1.1) via /public/fonts, font-display
  // swap, hero font preloaded in index.html. Fluid scale via clamp().
  typography: {
    display: {
      family: '"Fraunces Variable", "Fraunces", Georgia, "Times New Roman", serif',
      weight: '300',
      // Editorial serif: open the tracking as the size grows.
      tracking: '-0.02em',
      leading: '1.04',
    },
    body: {
      family: '"Inter Variable", "Inter", system-ui, -apple-system, sans-serif',
      weight: '400',
      tracking: '0em',
      leading: '1.65',
    },
    /** Exactly three weights across the site. */
    weights: {
      display: '300',
      body: '400',
      bodyStrong: '500',
    },
    /** Uppercase micro-label style, reused by every section eyebrow. */
    label: {
      family: '"Inter Variable", "Inter", system-ui, sans-serif',
      weight: '500',
      tracking: '0.18em',
      transform: 'uppercase' as const,
      size: '0.6875rem',
    },
    /**
     * Fluid type scale. Airy density: the jump from 3xl to 4xl is deliberately
     * large so the hero reads as a single gesture, not a paragraph.
     */
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
      lg: 'clamp(1.125rem, 1.05rem + 0.4vw, 1.375rem)',
      xl: 'clamp(1.375rem, 1.2rem + 0.8vw, 1.875rem)',
      '2xl': 'clamp(1.75rem, 1.4rem + 1.6vw, 2.75rem)',
      '3xl': 'clamp(2.25rem, 1.6rem + 3vw, 4.25rem)',
      '4xl': 'clamp(3rem, 1.8rem + 5.5vw, 7rem)',
      '5xl': 'clamp(3.75rem, 1.5rem + 9vw, 11rem)',
    },
  },

  // ── Motion personality ────────────────────────────────────────────────────
  // "Because the mood is premium I used Section 3.1's luxury preset: slow
  //  expo-out easing on a 1.0–1.6s scale. Nothing bounces. Overshoot is the
  //  fastest way to make an expensive thing look cheap."
  //
  // Curves are stored as bezier *tuples*, not CSS strings, because the same
  // values feed two consumers: CSS custom properties want `cubic-bezier(...)`,
  // and Framer Motion only accepts the tuple form. vite.config.ts renders the
  // CSS string from the tuple, so there is still exactly one place the numbers
  // are written down.
  motion: {
    ease: {
      /** Primary. Long flat tail — the 'settling' feel of expensive motion. */
      primary: [0.16, 1, 0.3, 1],
      /** For things entering and leaving symmetrically. */
      inOut: [0.87, 0, 0.13, 1],
      /** For ambient, looping, never-ending motion. */
      ambient: [0.37, 0, 0.63, 1],
      /** Standard deceleration, used where expo would feel sluggish. */
      standard: [0.22, 1, 0.36, 1],
    } as Record<string, Bezier>,
    /** Duration scale, seconds. */
    duration: {
      fast: 0.5,
      base: 1.1,
      slow: 1.6,
      /** Section-level transitions between scroll scenes. */
      scene: 2.2,
    },
    /** Seconds between successive staggered elements. */
    stagger: 0.09,
    /** Scroll distance, in viewport heights, for a full pinned sequence. */
    scrollPins: {
      work: 2.6,
    },
  },

  // ── 3D motif and shader mood ──────────────────────────────────────────────
  // "Because the theme is editorial and the mood is calm and precise, I chose a
  //  single chamfered monolith turning slowly under one soft key light. One
  //  object, one light — the discipline of a studio shoot, not a particle demo."
  three: {
    /** Section 3.2 → 'Luxury, minimal, editorial': slow-rotating polished form. */
    primaryMotif: 'polishedMonolith',
    /** 'Soft studio lighting, reflections, subtle dust'. */
    supportingElement: 'dustField',
    shaderMood: {
      /** Obsidian → warm shadow → gold → bone. The scene's whole value range. */
      colorRamp: ['#0A0A0B', '#2A2419', '#C2A46B', '#EDE9E1'] as const,
      /** Low. Calm means slow, not fast-and-small. */
      noiseSpeed: 0.12,
      /** Very low — a whisper of surface irregularity on the gold inlay. */
      distortionStrength: 0.04,
    },
    material: {
      /** Obsidian body. */
      bodyColor: '#15151A',
      bodyMetalness: 0.72,
      bodyRoughness: 0.34,
      /** Brushed gold inlay — the only bright surface in the scene. */
      inlayColor: '#C2A46B',
      inlayMetalness: 0.95,
      inlayRoughness: 0.16,
      /** Studio floor. */
      floorColor: '#0C0C0E',
      floorRoughness: 0.42,
      floorMetalness: 0.6,
    },
    /** Fog: hides the horizon so the studio has no visible edge. */
    fog: { color: '#0A0A0B', near: 6, far: 26 },
    /**
     * Camera travels a CatmullRomCurve3 through these waypoints, scrubbed by
     * scroll progress. Each waypoint carries its own lookAt target, and each
     * scene cross-fades the light rig and fog colour.
     */
    cameraPath: [
      { pos: [0.0, 0.55, 9.2], look: [0, 0.15, 0], scene: 'atelier' },
      { pos: [1.5, 0.18, 3.1], look: [0.35, 0.05, 0], scene: 'inlay' },
      { pos: [-2.2, -0.15, 2.4], look: [-0.2, 0.0, 0], scene: 'edge' },
      { pos: [-0.6, 1.9, 8.4], look: [0, 0.5, 0], scene: 'column' },
      { pos: [0.0, 2.6, 12.5], look: [0, 1.4, 0], scene: 'void' },
    ] as const,
    /**
     * Per-scene lighting and fog mood, cross-faded across the scrub.
     * `key` is the colour of the main light, `rim` the cold back light,
     * `fog` the atmosphere colour, `keyIntensity` the key light strength.
     */
    scenes: [
      { id: 'atelier', key: '#FFE7C4', rim: '#4A5A70', fog: '#0A0A0B', keyIntensity: 2.4, exposure: 1.05 },
      { id: 'inlay', key: '#FFD79A', rim: '#3A4A60', fog: '#0B0A09', keyIntensity: 3.1, exposure: 1.15 },
      { id: 'edge', key: '#FFC98A', rim: '#2E3A4C', fog: '#08080A', keyIntensity: 1.5, exposure: 0.9 },
      { id: 'column', key: '#E8EEF7', rim: '#6E86A8', fog: '#0A0B10', keyIntensity: 2.0, exposure: 1.0 },
      { id: 'void', key: '#C2A46B', rim: '#44566E', fog: '#08080A', keyIntensity: 0.7, exposure: 0.85 },
    ] as const,
    /** Dust motes, per tier. Clamped at runtime by the tier profile ceiling. */
    dust: { ultra: 5000, balanced: 1800, lite: 600, static: 0 } as Record<string, number>,
    /** Monolith rotation, radians per second. Slow enough to not read as spin. */
    spin: 0.055,
  },

  // ── Cursor and micro-interactions ─────────────────────────────────────────
  cursor: {
    /** Hidden on touch devices entirely (Section 8). */
    enabled: true,
    /** Ring diameter, px. */
    size: 34,
    /** Inner dot diameter, px. */
    dotSize: 4,
    color: '#C2A46B',
    /** Pointer smoothing — 0 = instant, 1 = never arrives. Luxury wants lag. */
    damping: 0.14,
    /** Scale applied over any interactive element. */
    hoverScale: 2.1,
    /** Magnetic pull strength, 0–1. Section 3.1: restrained for luxury. */
    magneticStrength: 0.22,
    /** How far from the pointer the magnet starts pulling, px. */
    magneticRadius: 110,
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  layout: {
    /** Max content width, px. */
    maxWidth: 1440,
    /** Side gutter — fluid, tightens on small screens. */
    gutter: 'clamp(1.25rem, 5vw, 5rem)',
    /** Space between page sections. Airy density. */
    sectionGap: 'clamp(7rem, 14vh, 12rem)',
    radius: 2,
  },

  // ── Post-processing, gated per tier (Section 4.1) ─────────────────────────
  post: {
    bloom: { intensity: 0.42, luminanceThreshold: 0.72, luminanceSmoothing: 0.28, mipmapBlur: true },
    /** ULTRA only. Barely perceptible at rest; visible at the frame edge. */
    chromaticAberration: 0.0006,
    noise: { opacity: 0.035, premultiply: true },
    vignette: { offset: 0.28, darkness: 0.72 },
  },
} as const

export type Theme = typeof theme
