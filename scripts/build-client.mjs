/**
 * Client build script.
 *
 * Bundles the React client (src/client) into public/static/app.js, which is
 * served as a static asset by Cloudflare Pages. Run before `vite build`.
 *
 *   node scripts/build-client.mjs
 */

import { build } from 'esbuild'
import { cp, mkdir, writeFile } from 'node:fs/promises'

const githubPages = process.argv.includes('--github-pages')
const output = githubPages ? 'dist/github-pages' : 'public'
const assets = `${output}/static`

await mkdir(assets, { recursive: true })

await build({
  entryPoints: ['src/client/main.tsx'],
  bundle: true,
  outfile: `${assets}/app.js`,
  format: 'esm',
  target: ['es2020'],
  jsx: 'automatic',
  minify: true,
  sourcemap: false,
  define: {
    'process.env.NODE_ENV': '"production"',
    GITHUB_PAGES: String(githubPages),
  },
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  logLevel: 'info',
})

// Copy stylesheet alongside the bundle
await cp('src/client/styles.css', `${assets}/styles.css`)

if (githubPages) {
  const { outputFiles } = await build({
    entryPoints: ['src/shell.ts'],
    format: 'esm',
    write: false,
  })
  const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(outputFiles[0].contents).toString('base64')
  const { renderIndex } = await import(moduleUrl)
  await writeFile(`${output}/index.html`, renderIndex('./static/'))
  await writeFile(`${output}/.nojekyll`, '')
}
