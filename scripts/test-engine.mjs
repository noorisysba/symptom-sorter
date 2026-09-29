/**
 * Engine validation harness.
 *
 * Runs the four reference sample cases through the diagnostic engine and
 * prints the top differential + triage, so results can be compared against the
 * expected outputs supplied with the project.
 *
 *   node scripts/test-engine.mjs
 */

import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'
import { mkdir, rm } from 'node:fs/promises'

const outdir = '.tmp-engine'
await mkdir(outdir, { recursive: true })

await build({
  entryPoints: ['scripts/engine-entry.ts'],
  bundle: true,
  outfile: `${outdir}/engine.mjs`,
  format: 'esm',
  platform: 'node',
  target: ['node20'],
  loader: { '.json': 'json' },
  logLevel: 'error',
})

const mod = await import(pathToFileURL(`${outdir}/engine.mjs`).href)
const { SAMPLE_CASES } = mod

let pass = 0
const rows = []

for (const c of SAMPLE_CASES) {
  const r = mod.analyze(c.input)
  const top = r.diagnoses.slice(0, 5)
  const topName = top[0]?.name ?? '—'
  const matchTop = topName.toLowerCase().includes(c.expectedDiagnosis.toLowerCase().split(' ')[0])
  const diffNames = top.slice(1).map((d) => d.name)

  // differential coverage: does any top-5 hit an expected differential?
  const hit = c.expectedDifferentials.some((e) =>
    top.some((d) => d.name.toLowerCase().includes(e.toLowerCase().split(' ')[0]))
  )
  if (matchTop) pass++

  rows.push({
    case: c.title,
    expected: c.expectedDiagnosis,
    got: topName,
    topMatch: matchTop ? '✓' : '✗',
    triage: r.triage.level,
    expectedTriage: c.expectedTriage,
    differentialHit: hit ? '✓' : '✗',
    chain: top.map((d) => `${d.name} (${d.confidence}%)`),
  })
}

console.log('\n=== ENGINE VALIDATION ===\n')
for (const r of rows) {
  console.log(`${r.case}`)
  console.log(`  Expected top : ${r.expected}`)
  console.log(`  Got top      : ${r.got}  [${r.topMatch}]`)
  console.log(`  Triage       : ${r.triage}  (expected: ${r.expectedTriage})`)
  console.log(`  Diff coverage: ${r.differentialHit}`)
  console.log(`  Chain        : ${r.chain.join(' > ')}`)
  console.log('')
}
console.log(`Top-diagnosis match: ${pass}/${SAMPLE_CASES.length}`)

await rm(outdir, { recursive: true, force: true })
