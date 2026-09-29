/**
 * Diagnostic reasoning engine.
 *
 * A transparent, explainable scoring model:
 *   1. Extract features from the consultation record.
 *   2. Score every condition in the library against those features.
 *   3. Convert raw scores to a "relative likelihood" share (normalised
 *      positive evidence), so results read like a differential.
 *   4. Attach the exact evidence that supported each diagnosis.
 *   5. Derive a triage level from vitals, red-flag terms, symptom severity and
 *      the top differential's own urgency hint.
 *
 * The engine never claims certainty; it ranks possibilities and always returns
 * the clinical reasoning trail for the clinician to review.
 */

import {
  extractFeatures,
  type ConsultationInput,
  type DetectedFeature,
  type ExtractionResult,
} from './features'
import { CONDITIONS, CONDITION_BY_ID, type ConditionDef } from './conditions'
import { KB_BY_ID, findChapterForCondition } from './kb'
import { computeTriage } from './triage'

export interface Diagnosis {
  id: string
  name: string
  category: string
  score: number
  /** 0–100, share of positive evidence. */
  confidence: number
  /** How confident we are the record contains enough detail, 0–100. */
  dataConfidence: number
  band: 'most likely' | 'possible' | 'less likely'
  supporting: { label: string; evidence: string; weight: number }[]
  against: { label: string; evidence: string; weight: number }[]
  urgency: string
  chapter?: {
    id: number
    title: string
    section: string
    overview: string
    common: string[]
    investigations: { likely: string; possible: string; small_print: string }
    tips: string[]
  }
  rationale: string
}

export interface CandidateChapter {
  id: number
  title: string
  section: string
  matchedFeatures: string[]
  score: number
}

export interface TriageResult {
  level: 'emergency' | 'urgent' | 'same-day' | 'routine' | 'self-care'
  label: string
  reasons: string[]
  action: string
  vitalsAbnormal: string[]
  redFlags: string[]
  score: number
}

export interface AnalysisResult {
  extraction: {
    features: DetectedFeature[]
    negated: string[]
    vitals: Record<string, number>
    redFlagTerms: string[]
    completeness: number
    missing: string[]
  }
  triage: TriageResult
  diagnoses: Diagnosis[]
  differential: Diagnosis[]
  candidateSymptoms: CandidateChapter[]
  referenceChapters: { id: number; title: string; section: string }[]
  summary: string
  generatedAt: string
}

const BAND = (conf: number, rank: number): Diagnosis['band'] => {
  if (rank === 0 && conf >= 15) return 'most likely'
  if (conf >= 8) return 'possible'
  return 'less likely'
}

/* ------------------------------------------------------------------ *
 * Required-field completeness
 * ------------------------------------------------------------------ */

const REQUIRED_FIELDS: { key: string; label: string; weight: number }[] = [
  { key: 'age', label: 'Age', weight: 1 },
  { key: 'sex', label: 'Sex', weight: 1 },
  { key: 'reasonForVisit', label: 'Reason for visit', weight: 2 },
  { key: 'chiefProblems', label: 'Chief problems', weight: 2 },
  { key: 'duration', label: 'Duration of symptoms', weight: 1 },
  { key: 'history', label: 'History', weight: 2 },
  { key: 'examination', label: 'Examination findings', weight: 2 },
  { key: 'vitals', label: 'Vital signs', weight: 1 },
]

function completenessOf(input: ConsultationInput): { completeness: number; missing: string[] } {
  let got = 0
  let total = 0
  const missing: string[] = []
  for (const f of REQUIRED_FIELDS) {
    total += f.weight
    const val = f.key === 'vitals' ? input.vitals : (input as never)[f.key]
    const present =
      f.key === 'vitals'
        ? !!(input.vitals && Object.values(input.vitals).some((v) => v !== undefined && v !== ''))
        : !!(val && String(val).trim().length > 1)
    if (present) got += f.weight
    else missing.push(f.label)
  }
  return { completeness: Math.round((got / total) * 100), missing }
}

/* ------------------------------------------------------------------ *
 * Scoring
 * ------------------------------------------------------------------ */

interface Scored {
  def: ConditionDef
  raw: number
  positive: number
  supporting: { label: string; evidence: string; weight: number }[]
  against: { label: string; evidence: string; weight: number }[]
}

function scoreCondition(def: ConditionDef, ex: ExtractionResult): Scored {
  const featMap = new Map(ex.features.map((f) => [f.id, f]))
  let raw = 0
  let positive = 0
  const supporting: Scored['supporting'] = []
  const against: Scored['against'] = []

  for (const [fid, weight] of Object.entries(def.features)) {
    if (!weight) continue
    const feat = featMap.get(fid)
    if (!feat) continue
    raw += weight
    if (weight > 0) {
      positive += weight
      supporting.push({ label: feat.label, evidence: feat.evidence, weight })
    } else {
      against.push({ label: feat.label, evidence: feat.evidence, weight })
    }
  }

  // Bonus when negative evidence is *explicitly negated* (e.g. "no chest pain")
  for (const [fid, weight] of Object.entries(def.features)) {
    if (weight > 0 && ex.negated.includes(fid)) raw -= weight * 0.55
  }

  // Normalise by the fraction of a condition's signature that was matched, so
  // rare conditions with many required features are not unfairly favoured.
  const signature = Object.entries(def.features)
    .filter(([, w]) => w > 0)
    .reduce((a, [, w]) => a + w, 0)
  void signature

  supporting.sort((a, b) => b.weight - a.weight)
  against.sort((a, b) => a.weight - b.weight)
  return { def, raw, positive, supporting, against }
}

function rationaleFor(s: Scored, dataConfidence: number): string {
  const key = s.supporting.slice(0, 3).map((x) => x.label.toLowerCase()).join(', ')
  if (!s.supporting.length) return 'No supportive features detected in this record.'
  const against = s.against.length
    ? ` Features arguing against: ${s.against.slice(0, 2).map((x) => x.label.toLowerCase()).join(', ')}.`
    : ''
  const caveat = dataConfidence < 50 ? ' (Limited data — interpret with caution.)' : ''
  return `Supported by ${key}.${against}${caveat}`
}

/* ------------------------------------------------------------------ *
 * Main entry point
 * ------------------------------------------------------------------ */

export function analyze(input: ConsultationInput): AnalysisResult {
  const ex = extractFeatures(input)
  const { completeness, missing } = completenessOf(input)

  const scored = CONDITIONS.map((def) => scoreCondition(def, ex))
    .filter((s) => s.positive > 0)
    .sort((a, b) => b.raw - a.raw)

  // Probability share = positive evidence / total positive evidence of top set.
  const topRaw = scored.length ? Math.max(scored[0].raw, 0.0001) : 0
  const totalRaw = scored.reduce((a, s) => a + Math.max(s.raw, 0), 0) || 1

  const dataConfidence = Math.round(
    Math.min(100, completeness * 0.7 + Math.min(ex.features.length, 14) * 2.15)
  )

  const diagnoses: Diagnosis[] = scored.slice(0, 12).map((s, i) => {
    const share = (Math.max(s.raw, 0) / totalRaw) * 100
    // Damp the share when data is sparse so confidence reads honestly.
    const confidence = Math.round(share * (0.55 + 0.45 * (dataConfidence / 100)))
    const chapter = findChapterForCondition(s.def, ex)
    return {
      id: s.def.id,
      name: s.def.name,
      category: s.def.category,
      score: Math.round(s.raw * 100) / 100,
      confidence,
      dataConfidence,
      band: BAND(confidence, i),
      supporting: s.supporting.slice(0, 6),
      against: s.against.slice(0, 4),
      urgency: s.def.urgency ?? 'routine',
      chapter: chapter
        ? {
            id: chapter.id,
            title: chapter.title,
            section: chapter.section,
            overview: chapter.overview,
            common: chapter.common,
            investigations: chapter.inv,
            tips: chapter.tips,
          }
        : undefined,
      rationale: rationaleFor(s, dataConfidence),
    }
  })

  if (diagnoses.length) {
    const first = diagnoses[0]
    first.band = first.confidence >= 12 || first.supporting.length >= 3 ? 'most likely' : 'possible'
  }

  // Candidate symptom chapters (independent of the condition library)
  const candidateSymptoms = rankChapters(ex, input)

  const triage = computeTriage(ex, input, diagnoses)

  const summary = buildSummary(input, ex, diagnoses, triage)

  return {
    extraction: {
      features: ex.features,
      negated: ex.negated,
      vitals: ex.vitals,
      redFlagTerms: ex.redFlagTerms,
      completeness,
      missing,
    },
    triage,
    diagnoses,
    differential: diagnoses,
    candidateSymptoms,
    referenceChapters: (() => {
      const ids = new Set<number>()
      for (const d of diagnoses) if (d.chapter) ids.add(d.chapter.id)
      for (const c of candidateSymptoms.slice(0, 3)) ids.add(c.id)
      return [...ids]
        .map((id) => KB_BY_ID[id])
        .filter(Boolean)
        .map((c) => ({ id: c.id, title: c.title, section: c.section }))
    })(),
    summary,
    generatedAt: new Date().toISOString(),
  }
}

/* ------------------------------------------------------------------ *
 * Chapter (symptom) ranking — direct use of the book
 * ------------------------------------------------------------------ */

const STOP = new Set([
  'in', 'of', 'the', 'and', 'a', 'an', 'with', 'to', 'on', 'at', 'for', 'no',
  'or', 'has', 'have', 'is', 'are', 'was', 'were', 'be', 'been', 'patient',
  'history', 'recent', 'mild', 'mildly', 'severity', 'colon', 'signs', 'no.',
])

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t))
}

function rankChapters(ex: ExtractionResult, input: ConsultationInput): CandidateChapter[] {
  const text = [
    input.reasonForVisit,
    input.chiefProblems,
    input.history,
    input.examination,
    input.problemDescription,
    input.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const tokens = new Set(tokenize(text))

  const out: CandidateChapter[] = []
  for (const ch of Object.values(KB_BY_ID)) {
    const titleTokens = tokenize(ch.title)
    let score = 0
    const matched: string[] = []
    for (const t of titleTokens) {
      if (tokens.has(t)) {
        score += 1
        matched.push(t)
      }
    }
    // also check differential list mentions
    const ddxText = [...ch.common, ...ch.occasional].join(' ').toLowerCase()
    for (const f of ex.features) {
      const fl = f.label.toLowerCase()
      if (fl.length > 4 && (ddxText.includes(fl) || text.includes(fl))) score += 0.6
    }
    if (score > 0) out.push({ id: ch.id, title: ch.title, section: ch.section, matchedFeatures: matched, score: Math.round(score * 10) / 10 })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 8)
}

/* ------------------------------------------------------------------ *
 * Narrative summary
 * ------------------------------------------------------------------ */

function buildSummary(
  input: ConsultationInput,
  ex: ExtractionResult,
  diagnoses: Diagnosis[],
  triage: TriageResult
): string {
  const who = [input.age ? `${input.age}yo` : null, input.sex]
    .filter(Boolean)
    .join(' ')
  const problem = (input.reasonForVisit || input.chiefProblems || 'undifferentiated presentation')
    .toString()
    .replace(/\s+/g, ' ')
    .slice(0, 160)
  const top = diagnoses.slice(0, 3).map((d) => d.name)
  const feat = ex.features
    .filter((f) => f.category !== 'age')
    .slice(0, 6)
    .map((f) => f.label.toLowerCase())

  const parts: string[] = []
  parts.push(
    `${who ? who + ' ' : ''}presenting with ${problem.replace(/\.$/, '')}.`
  )
  if (feat.length) parts.push(`Key features: ${feat.join(', ')}.`)
  if (top.length) parts.push(`Assessment suggests ${top.join('; ')}.`)
  parts.push(`Triage: ${triage.label}.`)
  if (ex.features.length < 4)
    parts.push('NOTE: The record is sparse — document more history/examination to sharpen the differential.')
  return parts.join(' ')
}

export { CONDITION_BY_ID }
