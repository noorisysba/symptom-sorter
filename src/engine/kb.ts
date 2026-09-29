/**
 * Knowledge base access layer.
 *
 * The KB is generated from Hopcroft & Forte, *Symptom Sorter*, 6th edition
 * (CRC Press, 2020) and stored as `src/data/kb.json`. It contains 137 symptom
 * chapters, each with a GP overview, a tiered differential (common /
 * occasional / rare), a ready reckoner, suggested investigations, top tips and
 * extracted alarm ("red flag") statements.
 *
 * This module only *reads* the KB and maps scored conditions onto the closest
 * source chapter, so the clinician can always jump to the underlying reference.
 */

import rawKb from '../data/kb.json'
import type { ConditionDef } from './conditions'
import type { ExtractionResult } from './features'

export interface ReadyReckoner {
  diagnoses: string[]
  rows: { feature: string; values: string[] }[]
}

export interface Chapter {
  id: number
  title: string
  section: string
  overview: string
  common: string[]
  occasional: string[]
  rare: string[]
  rr: ReadyReckoner | null
  inv: { likely: string; possible: string; small_print: string; notes: string[] }
  tips: string[]
  alarm: string[]
}

export const KB: Chapter[] = rawKb as Chapter[]

export const KB_BY_ID: Record<number, Chapter> = Object.fromEntries(
  KB.map((c) => [c.id, c])
)

export const KB_SECTIONS: string[] = [
  ...new Set(KB.map((c) => c.section).filter((s) => s && s !== 'General')),
].sort()

/* ------------------------------------------------------------------ *
 * Condition → chapter mapping
 * ------------------------------------------------------------------ */

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[().,/–—-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Score how well a chapter title matches a condition name. */
function titleMatch(condName: string, chapterTitle: string): number {
  const a = norm(condName)
  const b = norm(chapterTitle)
  if (!a || !b) return 0
  const aTokens = new Set(a.split(' ').filter((t) => t.length > 3))
  const bTokens = new Set(b.split(' ').filter((t) => t.length > 3))
  let overlap = 0
  for (const t of aTokens) if (bTokens.has(t)) overlap++
  if (b.includes(a) || a.includes(b)) overlap += 3
  return overlap
}

/** Does a chapter's differential list mention this condition's key term? */
function ddxMention(condName: string, ch: Chapter): number {
  const key = norm(condName)
  const first = key.split(' ')[0]
  if (!first || first.length < 4) return 0
  const lists = [...ch.common, ...ch.occasional, ...ch.rare].map(norm)
  let best = 0
  for (const entry of lists) {
    if (entry.includes(first)) best = Math.max(best, 2)
    if (entry.includes(key)) best = Math.max(best, 3)
  }
  return best
}

/**
 * Choose the best reference chapter for a condition, using declared chapter
 * ids first, then title similarity, then differential-list mentions. The
 * consultation's own features are used as a final tie-breaker so, e.g., a
 * cough presentation maps to "Cough in adults" rather than "Cough in children".
 */
export function findChapterForCondition(
  cond: ConditionDef,
  ex?: ExtractionResult
): Chapter | undefined {
  // 1. Explicit chapter list
  if (cond.chapters && cond.chapters.length) {
    const candidates = cond.chapters.map((id) => KB_BY_ID[id]).filter(Boolean)
    if (candidates.length === 1) return candidates[0]
    if (candidates.length > 1) {
      // prefer a chapter whose title matches, else first
      let best = candidates[0]
      let bestScore = -1
      for (const c of candidates) {
        const s = titleMatch(cond.name, c.title)
        if (s > bestScore) {
          bestScore = s
          best = c
        }
      }
      return best
    }
  }

  // 2. Title similarity across the whole KB
  let best: Chapter | undefined
  let bestScore = 0
  for (const ch of KB) {
    const s = titleMatch(cond.name, ch.title) * 2 + ddxMention(cond.name, ch)
    if (s > bestScore) {
      bestScore = s
      best = ch
    }
  }
  if (best && bestScore >= 4) return best

  // 3. Feature-word fallback (e.g. "cough" feature → cough chapter)
  if (ex) {
    const words = ex.features
      .map((f) => norm(f.label))
      .flatMap((l) => l.split(' '))
      .filter((w) => w.length > 4)
    let b2: Chapter | undefined
    let s2 = 0
    for (const ch of KB) {
      const t = norm(ch.title)
      for (const w of words) if (t.includes(w)) s2 = Math.max(s2, ch.common.length > 0 ? 3 : 2)
      if (s2 >= 3 && !b2) b2 = ch
    }
    if (b2) return b2
  }
  return bestScore >= 2 ? best : best
}
