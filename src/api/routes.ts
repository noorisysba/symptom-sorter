/**
 * Clinical API — exposes the diagnostic engine over HTTP.
 *
 * Routes
 *   GET  /api/health                     service + KB status
 *   GET  /api/chapters                   list all reference chapters
 *   GET  /api/chapters/:id               single reference chapter
 *   GET  /api/chapters/search?q=         search chapters by title
 *   GET  /api/conditions                 list known conditions
 *   POST /api/diagnose                   run the engine on a consultation
 *   POST /api/symptom-check              lightweight symptom-only check
 *   POST /api/report                     human-readable text report
 */

import { Hono } from 'hono'
import { analyze } from '../engine/reasoner'
import { KB, KB_BY_ID, KB_SECTIONS } from '../engine/kb'
import { CONDITIONS } from '../engine/conditions'
import type { ConsultationInput } from '../engine/features'

export const api = new Hono()

/* ------------------------------------------------------------------ *
 * Health / metadata
 * ------------------------------------------------------------------ */

api.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'symptom-sorter-api',
    chapters: KB.length,
    conditions: CONDITIONS.length,
    sections: KB_SECTIONS.length,
    source: 'Hopcroft & Forte, Symptom Sorter, 6th ed. (CRC Press, 2020)',
    time: new Date().toISOString(),
  })
)

api.get('/sections', (c) => c.json({ sections: KB_SECTIONS }))

/* ------------------------------------------------------------------ *
 * Reference chapters (the book itself)
 * ------------------------------------------------------------------ */

api.get('/chapters', (c) => {
  const q = (c.req.query('q') || '').trim().toLowerCase()
  const section = (c.req.query('section') || '').trim().toLowerCase()
  let list = KB
  if (section) list = list.filter((ch) => ch.section.toLowerCase() === section)
  if (q)
    list = list.filter(
      (ch) =>
        ch.title.toLowerCase().includes(q) ||
        ch.overview.toLowerCase().includes(q) ||
        ch.common.join(' ').toLowerCase().includes(q)
    )
  return c.json({
    total: list.length,
    chapters: list.map((ch) => ({
      id: ch.id,
      title: ch.title,
      section: ch.section,
      topDifferentials: ch.common.slice(0, 4),
      hasRedFlags: ch.alarm.length > 0,
    })),
  })
})

api.get('/chapters/:id', (c) => {
  const id = Number(c.req.param('id'))
  const ch = KB_BY_ID[id]
  if (!ch) return c.json({ error: 'Chapter not found' }, 404)
  return c.json(ch)
})

/* ------------------------------------------------------------------ *
 * Conditions
 * ------------------------------------------------------------------ */

api.get('/conditions', (c) =>
  c.json({
    total: CONDITIONS.length,
    conditions: CONDITIONS.map((x) => ({
      id: x.id,
      name: x.name,
      category: x.category,
      urgency: x.urgency ?? 'routine',
    })),
  })
)

/* ------------------------------------------------------------------ *
 * Core: diagnose
 * ------------------------------------------------------------------ */

function normaliseInput(body: unknown): ConsultationInput {
  const b = (body ?? {}) as Record<string, unknown>
  const vitalsIn = (b.vitals ?? {}) as Record<string, unknown>
  return {
    age: (b.age as string) ?? '',
    sex: (b.sex as string) ?? '',
    reasonForVisit: (b.reasonForVisit as string) ?? '',
    chiefProblems: (b.chiefProblems as string) ?? '',
    duration: (b.duration as string) ?? '',
    history: (b.history as string) ?? '',
    pastMedicalHistory: (b.pastMedicalHistory as string) ?? '',
    medications: (b.medications as string) ?? '',
    allergies: (b.allergies as string) ?? '',
    socialHistory: (b.socialHistory as string) ?? '',
    examination: (b.examination as string) ?? '',
    investigations: (b.investigations as string) ?? '',
    problemDescription: (b.problemDescription as string) ?? '',
    notes: (b.notes as string) ?? '',
    vitals: {
      temperature: (vitalsIn.temperature as string) ?? '',
      pulse: (vitalsIn.pulse as string) ?? '',
      respiratoryRate: (vitalsIn.respiratoryRate as string) ?? '',
      bp: (vitalsIn.bp as string) ?? '',
      bpSystolic: (vitalsIn.bpSystolic as string) ?? '',
      bpDiastolic: (vitalsIn.bpDiastolic as string) ?? '',
      spo2: (vitalsIn.spo2 as string) ?? '',
    },
  }
}

api.post('/diagnose', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }
  const input = normaliseInput(body)
  const result = analyze(input)
  return c.json(result)
})

/* ------------------------------------------------------------------ *
 * Lightweight symptom-only check
 * ------------------------------------------------------------------ */

api.post('/symptom-check', async (c) => {
  let body: Record<string, unknown> = {}
  try {
    body = (await c.req.json()) as Record<string, unknown>
  } catch {
    /* allow empty */
  }
  const symptoms = (body.symptoms as string) || ''
  const input: ConsultationInput = {
    age: (body.age as string) ?? '',
    sex: (body.sex as string) ?? '',
    reasonForVisit: (body.reasonForVisit as string) ?? symptoms,
    chiefProblems: symptoms,
    duration: (body.duration as string) ?? '',
    history: (body.history as string) ?? symptoms,
    vitals: (body.vitals as ConsultationInput['vitals']) ?? {},
  }
  const result = analyze(input)
  return c.json({
    summary: result.summary,
    triage: result.triage,
    topDiagnoses: result.diagnoses.slice(0, 5),
    features: result.extraction.features.map((f) => f.label),
    completeness: result.extraction.completeness,
  })
})

/* ------------------------------------------------------------------ *
 * Human-readable report
 * ------------------------------------------------------------------ */

api.post('/report', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }
  const input = normaliseInput(body)
  const r = analyze(input)

  const lines: string[] = []
  lines.push('SYMPTOM SORTER — CLINICAL DECISION SUPPORT REPORT')
  lines.push('='.repeat(56))
  lines.push(`Generated: ${new Date(r.generatedAt).toLocaleString()}`)
  lines.push('')
  lines.push('PATIENT')
  lines.push(`  Age: ${input.age || '—'}`)
  lines.push(`  Sex: ${input.sex || '—'}`)
  lines.push('')
  lines.push('REASON FOR VISIT')
  lines.push(`  ${input.reasonForVisit || input.chiefProblems || '—'}`)
  lines.push('')

  if (Object.keys(r.extraction.vitals).length) {
    lines.push('VITALS')
    const v = r.extraction.vitals
    if (v.temperature !== undefined) lines.push(`  Temperature: ${v.temperature} °C`)
    if (v.pulse !== undefined) lines.push(`  Pulse: ${v.pulse} bpm`)
    if (v.respiratoryRate !== undefined) lines.push(`  Respiratory rate: ${v.respiratoryRate}/min`)
    if (v.bpSystolic !== undefined) lines.push(`  BP: ${v.bpSystolic}/${v.bpDiastolic ?? '—'} mmHg`)
    if (v.spo2 !== undefined) lines.push(`  SpO₂: ${v.spo2}%`)
    lines.push('')
  }

  lines.push('DETECTED CLINICAL FEATURES')
  const feats = r.extraction.features.filter((f) => f.category !== 'age')
  if (feats.length) feats.forEach((f) => lines.push(`  • ${f.label}`))
  else lines.push('  (none detected — record is sparse)')
  lines.push('')
  lines.push(`Data completeness: ${r.extraction.completeness}%`)
  if (r.extraction.missing.length) lines.push(`Missing: ${r.extraction.missing.join(', ')}`)
  lines.push('')

  lines.push('TRIAGE')
  lines.push(`  ${r.triage.label.toUpperCase()}`)
  lines.push(`  Action: ${r.triage.action}`)
  r.triage.reasons.forEach((x) => lines.push(`  – ${x}`))
  lines.push('')

  lines.push('LIKELY DIAGNOSIS / DIFFERENTIAL')
  r.diagnoses.slice(0, 6).forEach((d, i) => {
    lines.push(`  ${i + 1}. ${d.name}  (relative likelihood ${d.confidence}%, ${d.band})`)
    lines.push(`     ${d.rationale}`)
  })
  lines.push('')

  lines.push('SUGGESTED INVESTIGATIONS (per Symptom Sorter)')
  const seen = new Set<string>()
  for (const d of r.diagnoses.slice(0, 3)) {
    const ch = d.chapter
    if (!ch) continue
    const key = `likely:${ch.investigations.likely}`
    if (ch.investigations.likely && !seen.has(key)) {
      seen.add(key)
      lines.push(`  [${ch.title}] LIKELY: ${ch.investigations.likely}`)
      if (ch.investigations.possible) lines.push(`  [${ch.title}] POSSIBLE: ${ch.investigations.possible}`)
    }
  }
  lines.push('')

  lines.push('SAFETY-NETTING / RED FLAGS')
  const alarms = new Set<string>()
  for (const d of r.diagnoses.slice(0, 3)) {
    if (d.chapter) d.chapter.tips.forEach((t) => alarms.add(t))
  }
  if (alarms.size) [...alarms].slice(0, 8).forEach((x) => lines.push(`  ! ${x}`))
  else lines.push('  No specific alarm features identified.')
  lines.push('')
  lines.push('DISCLAIMER: Decision-support only. Output is derived from the')
  lines.push('Symptom Sorter (Hopcroft & Forte, 6th ed.) and does not replace')
  lines.push('clinical judgement or a full patient assessment.')

  return c.json({ report: lines.join('\n') })
})

export { KB, KB_BY_ID }
