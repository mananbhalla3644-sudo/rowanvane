import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { transformSync } from 'esbuild'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, type Plugin } from 'vite'

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url))

/**
 * Minimal shape of what renderTokens() needs. Declared locally rather than
 * imported so this plugin stays runnable inside Vite's own config loader.
 */
type ThemeShape = {
  palette: Record<string, string>
  typography: {
    display: { family: string; weight: string; tracking: string; leading: string }
    body: { family: string; weight: string; tracking: string; leading: string }
    weights: Record<string, string>
    label: { family: string; weight: string; tracking: string; size: string }
    scale: Record<string, string>
  }
  motion: { ease: Record<string, readonly number[]>; duration: Record<string, number>; stagger: number }
  layout: { maxWidth: number; gutter: string; sectionGap: string; radius: number }
  cursor: { size: number; dotSize: number; color: string; damping: number; hoverScale: number }
}

/**
 * Flattens the theme into `--rv-*` custom properties.
 * The TypeScript file stays the only place a value is written; the CSS is
 * derived at build time, so there is no runtime flash of unstyled colour.
 */
function renderTokens(t: ThemeShape): string {
  const vars: string[] = []
  const push = (k: string, v: string | number) => vars.push(`  --rv-${k}: ${v};`)

  for (const [k, v] of Object.entries(t.palette)) push(`color-${kebab(k)}`, v)
  push('font-display', t.typography.display.family)
  push('font-body', t.typography.body.family)
  push('font-label', t.typography.label.family)
  push('weight-display', t.typography.weights.display)
  push('weight-body', t.typography.weights.body)
  push('weight-body-strong', t.typography.weights.bodyStrong)
  push('tracking-display', t.typography.display.tracking)
  push('leading-display', t.typography.display.leading)
  push('leading-body', t.typography.body.leading)
  push('tracking-label', t.typography.label.tracking)
  push('size-label', t.typography.label.size)
  for (const [k, v] of Object.entries(t.typography.scale)) push(`size-${k}`, v)
  // Easing curves are stored as bezier tuples; CSS needs the function form.
  for (const [k, v] of Object.entries(t.motion.ease)) push(`ease-${kebab(k)}`, `cubic-bezier(${v.join(', ')})`)
  for (const [k, v] of Object.entries(t.motion.duration)) push(`dur-${kebab(k)}`, `${v}s`)
  push('stagger', `${t.motion.stagger}s`)
  push('max-width', `${t.layout.maxWidth}px`)
  push('gutter', t.layout.gutter)
  push('section-gap', t.layout.sectionGap)
  push('radius', `${t.layout.radius}px`)
  push('cursor-size', `${t.cursor.size}px`)
  push('cursor-dot-size', `${t.cursor.dotSize}px`)
  push('cursor-color', t.cursor.color)
  push('cursor-hover-scale', String(t.cursor.hoverScale))

  return [
    '/* GENERATED FILE — DO NOT EDIT.',
    ' * Source: src/theme/theme.config.ts',
    ' * Regenerated on every dev-server start and every build by the',
    ' * `rv-theme-tokens` plugin in vite.config.ts. Edit the TS file instead.',
    ' */',
    ':root {',
    ...vars,
    '}',
    '',
  ].join('\n')
}

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/**
 * Regenerates src/theme/theme.tokens.css from src/theme/theme.config.ts.
 * Because the file is a real path on disk, Vite's own CSS pipeline handles it
 * normally in dev and build — no virtual modules, no FOUC, no staleness.
 */
function themeTokens(): Plugin {
  const source = here('./src/theme/theme.config.ts')
  const out = here('./src/theme/theme.tokens.css')
  let lastWritten: string | null = null

  const generate = () => {
    const raw = readFileSync(source, 'utf8')
    // theme.config.ts is pure data by design — it must not import anything, so
    // evaluating the transpiled CJS with no require() is safe and synchronous.
    const { code } = transformSync(raw, { loader: 'ts', format: 'cjs', target: 'es2020' })
    const mod: { exports: { theme: ThemeShape } } = { exports: { theme: {} as ThemeShape } }
    new Function('module', 'exports', 'require', code)(mod, mod.exports, () => {
      throw new Error('theme.config.ts must not import anything — tokens are inlined at build time.')
    })
    const css = renderTokens(mod.exports.theme)
    // Only touch the file when it changed, so Vite's watcher stays quiet.
    if (css !== lastWritten) {
      writeFileSync(out, css, 'utf8')
      lastWritten = css
    }
  }

  return {
    name: 'rv-theme-tokens',
    buildStart: generate,
    configureServer: generate,
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    themeTokens(),
    react(),
    tailwindcss(),
    // Only in `npm run analyze`, so the report never ships.
    ...(mode === 'analyze'
      ? [visualizer({ filename: 'dist/bundle-report.html', gzipSize: true, brotliSize: true })]
      : []),
  ],
  build: {
    target: 'es2022',
    // The three chunk is legitimately ~970 kB minified. It gzips to ~263 kB,
    // which is the number Section 4.3 actually budgets (≤600 kB gzip) and the
    // only one a visitor pays for. Raising the raw limit to just above its
    // real size stops a warning that would otherwise train us to ignore the
    // one that matters.
    chunkSizeWarningLimit: 1100,
    // The 3D layer must be a separate chunk that loads after first paint, so
    // three / r3f / drei can never land in the initial bundle.
    rollupOptions: {
      output: {
        manualChunks(id) {
          const p = id.replace(/\\/g, '/')
          if (!p.includes('/node_modules/')) return
          if (p.includes('/three/') || p.includes('/postprocessing/') || p.includes('/maath/')) return 'three'
          if (p.includes('/gsap/')) return 'gsap'
          if (p.includes('/framer-motion/') || p.includes('/motion-dom/') || p.includes('/motion-utils/')) return 'motion'
        },
      },
    },
  },
}))
