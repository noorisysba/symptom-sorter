/**
 * Triage logic.
 *
 * Escalates a consultation to one of five dispositions based on:
 *   • abnormal vital signs (with age-aware thresholds)
 *   • explicit red-flag phrases found in the record
 *   • the urgency hint of the leading differential(s)
 *   • a small number of high-risk symptom combinations
 *
 * The output is advisory — it is designed to surface "don't miss" concerns and
 * prompt the clinician to review, not to replace clinical judgement.
 */

import type { ConsultationInput, ExtractionResult } from './features'
import type { Diagnosis, TriageResult } from './reasoner'

const LEVEL_ORDER = ['self-care', 'routine', 'same-day', 'urgent', 'emergency'] as const
type Level = (typeof LEVEL_ORDER)[number]

const LABELS: Record<Level, string> = {
  emergency: 'Emergency — immediate action',
  urgent: 'Urgent — same day clinician assessment',
  'same-day': 'Same-day review recommended',
  routine: 'Routine clinician assessment',
  'self-care': 'Likely self-limiting — safety-net and advise',
}

const ACTIONS: Record<Level, string> = {
  emergency:
    'Arrange emergency assessment / call 999 or transfer to emergency department now. Do not delay.',
  urgent:
    'Arrange an urgent same-day clinician review (face-to-face or urgent care). Consider admission.',
  'same-day': 'Arrange clinician review today; safety-net with clear return advice.',
  routine: 'Manage in routine primary care; document safety-netting advice.',
  'self-care': 'Reassurance, symptomatic advice and clear safety-netting.',
}

function rank(l: Level): number {
  return LEVEL_ORDER.indexOf(l)
}

function vitalsFindings(ex: ExtractionResult, input: ConsultationInput): { findings: string[]; worst: Level } {
  const v = ex.vitals
  const age = Number(input.age)
  const isChild = !Number.isNaN(age) && age < 16
  const isInfant = !Number.isNaN(age) && age < 1
  const findings: string[] = []
  let worst: Level = 'self-care'

  const bump = (l: Level) => {
    if (rank(l) > rank(worst)) worst = l
  }

  if (v.temperature !== undefined) {
    if (v.temperature >= 40 || v.temperature <= 35) {
      findings.push(`Temperature ${v.temperature}°C — extreme`)
      bump('urgent')
    } else if (v.temperature >= 39) {
      findings.push(`Temperature ${v.temperature}°C — high fever`)
      bump(isChild ? 'urgent' : 'same-day')
    } else if (v.temperature >= 38) {
      findings.push(`Temperature ${v.temperature}°C — febrile`)
      bump('same-day')
    }
  }

  if (v.pulse !== undefined) {
    if (v.pulse >= 130 || v.pulse <= 45) {
      findings.push(`Pulse ${v.pulse} bpm — significantly abnormal`)
      bump('urgent')
    } else if (v.pulse > 100 || v.pulse < 55) {
      findings.push(`Pulse ${v.pulse} bpm — abnormal`)
      bump('same-day')
    }
  }

  if (v.respiratoryRate !== undefined) {
    if (v.respiratoryRate >= 30) {
      findings.push(`Respiratory rate ${v.respiratoryRate}/min — tachypnoeic`)
      bump('urgent')
    } else if (v.respiratoryRate >= 24) {
      findings.push(`Respiratory rate ${v.respiratoryRate}/min — raised`)
      bump('same-day')
    }
  }

  if (v.spo2 !== undefined) {
    if (v.spo2 < 92) {
      findings.push(`SpO₂ ${v.spo2}% — significant hypoxia`)
      bump('emergency')
    } else if (v.spo2 < 95) {
      findings.push(`SpO₂ ${v.spo2}% — mildly reduced`)
      bump('urgent')
    }
  }

  if (v.bpSystolic !== undefined) {
    if (v.bpSystolic < 90) {
      findings.push(`Systolic BP ${v.bpSystolic} mmHg — hypotension`)
      bump('emergency')
    } else if (v.bpSystolic < 100) {
      findings.push(`Systolic BP ${v.bpSystolic} mmHg — low`)
      bump('urgent')
    } else if (v.bpSystolic >= 180) {
      findings.push(`Systolic BP ${v.bpSystolic} mmHg — hypertensive urgency`)
      bump('same-day')
    }
  }

  if (isInfant && v.temperature !== undefined && v.temperature >= 38) {
    findings.push('Fever in an infant — lower threshold for assessment')
    bump('urgent')
  }

  return { findings, worst }
}

/** High-risk symptom combinations worth explicit escalation. */
function patternFindings(ex: ExtractionResult): { findings: string[]; worst: Level } {
  const has = (id: string) => ex.featureIds.includes(id)
  const findings: string[] = []
  let worst: Level = 'self-care'
  const bump = (l: Level) => {
    if (rank(l) > rank(worst)) worst = l
  }

  if (has('sob_sudden') && has('unilateral_leg_swelling')) {
    findings.push('Sudden breathlessness with unilateral leg swelling — suspect pulmonary embolism')
    bump('emergency')
  }
  if (has('pleuritic_chest_pain') && has('sob') && has('tachycardia')) {
    findings.push('Pleuritic chest pain, breathlessness and tachycardia — consider PE/pneumothorax')
    bump('urgent')
  }
  if (has('central_chest_pain') || has('troponin_high') || has('ecg_ischaemia')) {
    findings.push('Features of possible acute coronary syndrome')
    bump('emergency')
  }
  if (has('neck_stiffness') && has('photophobia')) {
    findings.push('Neck stiffness with photophobia — suspect meningitis')
    bump('emergency')
  }
  if (has('non_blanching_rash') && has('fever')) {
    findings.push('Fever with non-blanching rash — suspect meningococcal sepsis')
    bump('emergency')
  }
  if (has('focal_deficit')) {
    findings.push('Focal neurological deficit — possible stroke (time-critical)')
    bump('emergency')
  }
  if (has('thunderclap_headache')) {
    findings.push('Thunderclap headache — exclude subarachnoid haemorrhage')
    bump('emergency')
  }
  if (has('vomiting_blood') || has('hypotension') && has('exam_pallor')) {
    findings.push('Possible significant gastrointestinal bleeding')
    bump('emergency')
  }
  if (has('testicular_pain') && has('sudden')) {
    findings.push('Acute testicular pain — exclude torsion')
    bump('emergency')
  }
  if (has('difficulty_swallowing') && has('drooling')) {
    findings.push('Dysphagia with drooling — possible epiglottitis / upper airway compromise')
    bump('emergency')
  }
  if (has('hypotension') && has('confusion')) {
    findings.push('Hypotension with confusion — possible sepsis')
    bump('emergency')
  }
  if (has('diarrhoea') && has('dehydration') && ex.vitals.spo2 !== undefined && has('tachycardia')) {
    findings.push('Diarrhoea with dehydration and tachycardia')
    bump('same-day')
  }
  if (has('productive_cough') && has('haemoptysis')) {
    findings.push('Productive cough with haemoptysis')
    bump('urgent')
  }
  if (has('weight_loss') && has('night_sweats') && has('chronic_cough')) {
    findings.push('Constitutional symptoms with chronic cough — consider TB/malignancy')
    bump('urgent')
  }
  if (has('flank') || (has('flare_pain') && has('fever'))) {
    findings.push('Flank pain with fever — consider pyelonephritis')
    bump('urgent')
  }
  if (has('amenorrhoea') && has('pelvic_pain') && has('vaginal_bleeding')) {
    findings.push('Amenorrhoea with pelvic pain and bleeding — exclude ectopic pregnancy')
    bump('emergency')
  }
  return { findings, worst }
}

export function computeTriage(
  ex: ExtractionResult,
  input: ConsultationInput,
  diagnoses: Diagnosis[]
): TriageResult {
  const vf = vitalsFindings(ex, input)
  const pf = patternFindings(ex)

  let worst: Level = 'self-care'
  const bump = (l: Level) => {
    if (rank(l) > rank(worst)) worst = l
  }
  bump(vf.worst)
  bump(pf.worst)

  // Leading differential urgency
  const leading = diagnoses.slice(0, 4)
  for (const d of leading) {
    const map: Record<string, Level> = {
      emergency: 'emergency',
      urgent: 'urgent',
      'same-day': 'same-day',
      routine: 'routine',
    }
    const lvl = map[d.urgency] ?? 'routine'
    // Only let a non-leading diagnosis escalate one step
    if (rank(lvl) > rank(worst)) {
      const step = leading.indexOf(d)
      if (step === 0) bump(lvl)
      else if (step <= 2 && rank(lvl) > rank(worst)) bump(LEVEL_ORDER[Math.max(0, rank(lvl) - step)] as Level)
    }
  }

  // Explicit red-flag phrases
  const redFlags = [...new Set(ex.redFlagTerms)]
  if (redFlags.length) bump('urgent')

  // If essentially no data at all, default to routine rather than self-care
  if (ex.features.length === 0) worst = 'routine'

  const reasons: string[] = []
  if (pf.findings.length) reasons.push(...pf.findings)
  if (vf.findings.length) reasons.push(...vf.findings)
  if (redFlags.length) reasons.push(`Red-flag terms detected: ${redFlags.join(', ')}`)
  const topUrg = leading.find((d) => d.urgency === 'emergency' || d.urgency === 'urgent')
  if (topUrg) reasons.push(`${topUrg.name} carries ${topUrg.urgency} priority`)

  const scoreMap: Record<Level, number> = {
    emergency: 100,
    urgent: 75,
    'same-day': 50,
    routine: 25,
    'self-care': 10,
  }

  return {
    level: worst,
    label: LABELS[worst],
    action: ACTIONS[worst],
    reasons: reasons.length ? reasons : ['No high-risk features identified from the recorded data.'],
    vitalsAbnormal: vf.findings,
    redFlags,
    score: scoreMap[worst],
  }
}
