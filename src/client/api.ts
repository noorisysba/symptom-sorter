/**
 * Thin API client for the clinical engine.
 */

export interface Vitals {
  temperature?: string
  pulse?: string
  respiratoryRate?: string
  bp?: string
  bpSystolic?: string
  bpDiastolic?: string
  spo2?: string
}

export interface ConsultationInput {
  age?: string
  sex?: string
  reasonForVisit?: string
  chiefProblems?: string
  duration?: string
  history?: string
  pastMedicalHistory?: string
  medications?: string
  allergies?: string
  socialHistory?: string
  examination?: string
  investigations?: string
  problemDescription?: string
  notes?: string
  problemStartDate?: string
  weight?: string
  investigationIndication?: string
  vitals?: Vitals
}

export interface Diagnosis {
  id: string
  name: string
  category: string
  score: number
  confidence: number
  dataConfidence: number
  band: string
  supporting: { label: string; evidence: string; weight: number }[]
  against: { label: string; evidence: string; weight: number }[]
  urgency: string
  rationale: string
  chapter?: {
    id: number
    title: string
    section: string
    overview: string
    common: string[]
    investigations: { likely: string; possible: string; small_print: string }
    tips: string[]
  }
}

export interface TriageResult {
  level: string
  label: string
  action: string
  reasons: string[]
  vitalsAbnormal: string[]
  redFlags: string[]
  score: number
}

export interface AnalysisResult {
  extraction: {
    features: { id: string; label: string; category: string; evidence: string }[]
    negated: string[]
    vitals: Record<string, number>
    redFlagTerms: string[]
    completeness: number
    missing: string[]
  }
  triage: TriageResult
  diagnoses: Diagnosis[]
  candidateSymptoms: { id: number; title: string; section: string; matchedFeatures: string[]; score: number }[]
  referenceChapters: { id: number; title: string; section: string }[]
  summary: string
  generatedAt: string
}

export interface Chapter {
  id: number
  title: string
  section: string
  overview: string
  common: string[]
  occasional: string[]
  rare: string[]
  rr: { diagnoses: string[]; rows: { feature: string; values: string[] }[] } | null
  inv: { likely: string; possible: string; small_print: string; notes: string[] }
  tips: string[]
  alarm: string[]
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`)
  return (await res.json()) as T
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`)
  return (await res.json()) as T
}

export const api = {
  diagnose: (input: ConsultationInput) => post<AnalysisResult>('/api/diagnose', input),
  report: (input: ConsultationInput) => post<{ report: string }>('/api/report', input),
  symptomCheck: (input: Partial<ConsultationInput> & { symptoms?: string }) =>
    post<{ summary: string; triage: TriageResult; topDiagnoses: Diagnosis[]; features: string[]; completeness: number }>(
      '/api/symptom-check',
      input
    ),
  chapters: (q?: string) => get<{ total: number; chapters: { id: number; title: string; section: string }[] }>(`/api/chapters${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  chapter: (id: number) => get<Chapter>(`/api/chapters/${id}`),
  health: () => get<{ chapters: number; conditions: number; source: string }>('/api/health'),
  patientHistory: (id?: string) =>
    get<{ status: string; message?: string; data: Partial<ConsultationInput> | null }>(
      `/api/patient-history${id ? `/${encodeURIComponent(id)}` : ''}`
    ),
}
