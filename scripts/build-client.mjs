/**
 * Client build script.
 *
 * Bundles the React client (src/client) into public/static/app.js, which is
 * served as a static asset by Cloudflare Pages. Run before `vite build`.
 *
 *   node scripts/build-client.mjs
 */

import { build } from 'esbuild'
import { cp, mkdir } from 'node:fs/promises'

await mkdir('public/static', { recursive: true })

await build({
  entryPoints: ['src/client/main.tsx'],
  bundle: true,
  outfile: 'public/static/app.js',
  format: 'esm',
  target: ['es2020'],
  jsx: 'automatic',
  minify: true,
  sourcemap: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  logLevel: 'info',
})

// Copy stylesheet alongside the bundle
await cp('src/client/styles.css', 'public/static/styles.css')

console.log('✓ client bundle written to public/static/app.js')
