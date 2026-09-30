import { useCallback, useEffect, useState } from 'react'
import { api, type AnalysisResult, type ConsultationInput } from './api'
import { ConsultationForm } from './components/ConsultationForm'
import { ResultsPanel } from './components/ResultsPanel'
import { ReferenceBrowser } from './components/ReferenceBrowser'
import { LeftPanel } from './components/LeftPanel'
import { SAMPLE_CASES, type SampleCase } from './sampleCases'

type Tab = 'consult' | 'reference' | 'cases'

export default function App() {
  const [tab, setTab] = useState<Tab>('consult')
  const [patient, setPatient] = useState<ConsultationInput>({ age: '', sex: '' })
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<{ chapters: number; conditions: number; source: string } | null>(null)
  const [report, setReport] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  // Popup state — the analysis is shown in a modal, opened on Submit.
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    api.health().then(setHealth).catch(() => {})
  }, [])

  const runDiagnosis = useCallback(async (input: ConsultationInput) => {
    setModalOpen(true)
    setLoading(true)
    setError(null)
    setReport('')
    try {
      const res = await api.diagnose(input)
      setResult(res)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const generateReport = useCallback(async () => {
    setReportLoading(true)
    try {
      const res = await api.report(patient)
      setReport(res.report)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setReportLoading(false)
    }
  }, [patient])

  const loadCase = useCallback(
    (c: SampleCase) => {
      setPatient(c.input)
      setTab('consult')
      runDiagnosis(c.input)
    },
    [runDiagnosis]
  )

  const closeModal = useCallback(() => setModalOpen(false), [])

  return (
    <div>
      <TopBar health={health} />
      <div className="shell">
        {/* Left side — static patient panel (matches the CLINIDOCS reference) */}
        <LeftPanel patient={patient} />

        {/* Right side — the consultation workspace */}
        <main className="col-main">
          <div className="subtabs">
            <button className={tab === 'consult' ? 'active' : ''} onClick={() => setTab('consult')}>
              <i className="fa-solid fa-notes-medical" /> Consultation &amp; Notes
            </button>
            <button className={tab === 'reference' ? 'active' : ''} onClick={() => setTab('reference')}>
              <i className="fa-solid fa-book-medical" /> Symptom Sorter
            </button>
            <button className={tab === 'cases' ? 'active' : ''} onClick={() => setTab('cases')}>
              <i className="fa-solid fa-flask-vial" /> Sample Cases
            </button>
          </div>

          {tab === 'consult' && (
            <ConsultationForm
              value={patient}
              onChange={setPatient}
              onSubmit={runDiagnosis}
              loading={loading}
            />
          )}
          {tab === 'reference' && <ReferenceBrowser />}
          {tab === 'cases' && <CaseLibrary onLoad={loadCase} />}

          {error && (
            <div style={{ padding: '0 16px 12px', color: 'var(--red)', fontSize: 13 }}>
              <i className="fa-solid fa-triangle-exclamation" /> {error}
            </div>
          )}
        </main>
      </div>

      {/* Analysis popup — appears after Submit */}
      {modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Symptom sorter analysis" onClick={closeModal}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-bar">
              <h3>
                <i className="fa-solid fa-robot" /> Symptom Sorter Analysis
              </h3>
              <button type="button" className="modal-close" onClick={closeModal} aria-label="Close analysis">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-body scroll-thin">
              <ResultsPanel
                result={result}
                loading={loading}
                report={report}
                reportLoading={reportLoading}
                onGenerateReport={generateReport}
                onClose={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TopBar({ health }: { health: { chapters: number; conditions: number; source: string } | null }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo">CLINIC</span> DOCS
      </div>
      <nav className="topnav">
        <button className="active">Summary</button>
        <button>Consultation &amp; Notes</button>
        <button>Investigations</button>
      </nav>
      <div className="spacer" />
      <div className="search-patient">
        <i className="fa-solid fa-magnifying-glass" />
        <input placeholder="Search Patient" aria-label="Search patient" />
      </div>
      <div className="top-icons">
        <i className="fa-regular fa-user" title="Patients" />
        <i className="fa-solid fa-comment-dots" title="Messages" />
        <i className="fa-regular fa-bell" title="Notifications" />
        <i className="fa-solid fa-headset" title={health ? `${health.chapters} chapters loaded` : 'Support'} />
      </div>
      <div className="top-user">
        <div className="avatar">
          <i className="fa-solid fa-user-doctor" />
        </div>
        <div className="who">
          <b>Dr. Clinician</b>
          <span>Primary Care</span>
        </div>
      </div>
    </header>
  )
}

function CaseLibrary({ onLoad }: { onLoad: (c: SampleCase) => void }) {
  return (
    <div style={{ padding: 16, overflowY: 'auto' }}>
      <h3 style={{ marginTop: 0 }}>
        <i className="fa-solid fa-flask-vial" /> Validation sample cases
      </h3>
      <p className="hint">
        These cases mirror the reference expected outputs supplied with the project. Click a case to load the
        consultation record and run the engine.
      </p>
      <div style={{ display: 'grid', gap: 12 }}>
        {SAMPLE_CASES.map((c) => (
          <article key={c.id} className="dx-card">
            <div className="dx-head">
              <div className="dx-rank">
                <i className="fa-solid fa-patient" />
              </div>
              <div>
                <div className="dx-title">{c.title}</div>
                <div className="dx-sub">
                  {c.input.age}y {c.input.sex} · {c.input.duration}
                </div>
              </div>
              <div className="dx-metrics">
                <button className="btn-add" onClick={() => onLoad(c)}>
                  Load &amp; Analyse
                </button>
              </div>
            </div>
            <div className="dx-body">
              <div className="evidence">
                <div className="ev">
                  <i className="fa-solid fa-bullseye" />
                  <span>
                    <b>Expected:</b> {c.expectedDiagnosis}
                  </span>
                </div>
                <div className="ev">
                  <i className="fa-solid fa-list-ul" />
                  <span>
                    <b>Differentials:</b> {c.expectedDifferentials.join(', ')}
                  </span>
                </div>
                <div className="ev">
                  <i className="fa-solid fa-truck-medical" />
                  <span>
                    <b>Triage:</b> {c.expectedTriage}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
