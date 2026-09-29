import type { AnalysisResult, Diagnosis } from '../api'

interface Props {
  result: AnalysisResult | null
  loading: boolean
  report: string
  reportLoading: boolean
  onGenerateReport: () => void
}

export function ResultsPanel({ result, loading, report, reportLoading, onGenerateReport }: Props) {
  if (loading && !result) {
    return (
      <div style={{ padding: 24, width: '100%' }}>
        <div className="empty">
          <span className="spinner" />
          <div style={{ marginTop: 10 }}>Analysing consultation…</div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div style={{ padding: 24, width: '100%' }}>
        <div className="empty">
          <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 34, color: '#cbd5e1' }} />
          <h3 style={{ color: 'var(--ink-2)' }}>AI clinical decision support</h3>
          <p>
            Complete the consultation on the left and press <b>Submit</b> — or load a sample case.
            <br />
            The engine will produce an explainable differential, triage advice and reference guidance
            drawn from <i>Symptom Sorter</i>.
          </p>
        </div>
      </div>
    )
  }

  const triageClass = result.triage.level.replace(/\s+/g, '-')

  return (
    <div className="consult" style={{ width: '100%' }}>
      <div className="consult-head">
        <h3>
          <i className="fa-solid fa-robot" /> AI Symptom Sorter
        </h3>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn-submit" style={{ padding: '7px 14px' }} onClick={onGenerateReport} disabled={reportLoading}>
            {reportLoading ? '…' : 'Text Report'}
          </button>
        </div>
      </div>

      <div className={`triage ${triageClass}`}>
        <h4>
          <i className="fa-solid fa-truck-medical" /> Triage: {result.triage.label}
        </h4>
        <div className="action">{result.triage.action}</div>
        <ul>
          {result.triage.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="result-grid">
        {/* ---- Summary ---- */}
        <section className="section">
          <div className="section-head">
            <i className="fa-solid fa-clipboard-list" /> Assessment summary
          </div>
          <div className="section-body">
            <div className="rationale">{result.summary}</div>
            <div className="completeness">
              Data completeness: <b>{result.extraction.completeness}%</b>
              <div className="bar">
                <span style={{ width: `${result.extraction.completeness}%` }} />
              </div>
              {result.extraction.missing.length > 0 && (
                <div className="hint" style={{ marginTop: 6 }}>
                  Missing: {result.extraction.missing.join(', ')}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ---- Features ---- */}
        <section className="section">
          <div className="section-head">
            <i className="fa-solid fa-tags" /> Detected clinical features
            <span className="badge-count" style={{ marginLeft: 'auto' }}>
              {result.extraction.features.filter((f) => f.category !== 'age').length}
            </span>
          </div>
          <div className="section-body">
            <div className="feature-cloud">
              {result.extraction.features
                .filter((f) => f.category !== 'age')
                .map((f) => (
                  <span key={f.id} className="fc" title={f.evidence}>
                    {f.label}
                  </span>
                ))}
              {result.extraction.negated.slice(0, 8).map((n) => (
                <span key={n} className="fc neg" title="Explicitly denied">
                  {n.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Differential ---- */}
        <section className="section">
          <div className="section-head">
            <i className="fa-solid fa-ranking-star" /> Likely diagnosis &amp; differential
          </div>
          <div className="section-body" style={{ display: 'grid', gap: 10 }}>
            {result.diagnoses.length === 0 && (
              <div className="empty">No condition matched the recorded features. Document more detail.</div>
            )}
            {result.diagnoses.map((d, i) => (
              <DiagnosisCard key={d.id} d={d} rank={i} />
            ))}
          </div>
        </section>

        {/* ---- Candidate symptom chapters ---- */}
        {result.candidateSymptoms.length > 0 && (
          <section className="section">
            <div className="section-head">
              <i className="fa-solid fa-book-medical" /> Matching Symptom Sorter chapters
            </div>
            <div className="section-body">
              <div className="feature-cloud">
                {result.candidateSymptoms.map((c) => (
                  <a
                    key={c.id}
                    className="fc"
                    style={{ cursor: 'pointer', textDecoration: 'none', color: 'var(--blue)' }}
                    href={`#chapter-${c.id}`}
                    onClick={(e) => e.preventDefault()}
                    title={`${c.section} · matched: ${c.matchedFeatures.join(', ')}`}
                  >
                    {c.title}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {showReport && (
          <section className="section">
            <div className="section-head">
              <i className="fa-solid fa-file-lines" /> Generated clinical report
            </div>
            <div className="section-body">
              <pre className="report-pre">{report}</pre>
            </div>
          </section>
        )}

        <p className="hint" style={{ textAlign: 'center', padding: '0 10px' }}>
          Decision-support only — derived from Hopcroft &amp; Forte, <i>Symptom Sorter</i> 6th ed. Does not replace
          clinical judgement or full assessment.
        </p>
      </div>
    </div>
  )
}

function DiagnosisCard({ d, rank }: { d: Diagnosis; rank: number }) {
  const bandClass = d.band === 'most likely' ? 'most' : d.band === 'possible' ? 'possible' : 'less'
  return (
    <article className={`dx-card ${rank === 0 ? 'top' : ''}`}>
      <div className="dx-head">
        <div className="dx-rank">{rank + 1}</div>
        <div>
          <div className="dx-title">{d.name}</div>
          <div className="dx-sub">
            {d.category} · urgency: {d.urgency}
          </div>
        </div>
        <div className="dx-metrics">
          <span className={`band ${bandClass}`}>{d.band}</span>
          <div className="dx-sub" style={{ marginTop: 3 }}>
            {d.confidence}% relative likelihood
          </div>
        </div>
      </div>
      <div className="conf-bar">
        <span style={{ width: `${Math.min(100, d.confidence * 2)}%` }} />
      </div>
      <div className="dx-body">
        <div className="evidence">
          {d.supporting.map((s, i) => (
            <div className="ev" key={i}>
              <i className="fa-solid fa-circle-check" />
              <span>
                {s.label} <span className="snip">— “{s.evidence}”</span>
              </span>
            </div>
          ))}
          {d.against.map((a, i) => (
            <div className="ev neg" key={`a${i}`}>
              <i className="fa-solid fa-circle-xmark" />
              <span>
                Against: {a.label} <span className="snip">— “{a.evidence}”</span>
              </span>
            </div>
          ))}
        </div>

        <div className="rationale">{d.rationale}</div>

        {d.chapter && (
          <div className="chapter-ref">
            <h5>
              <i className="fa-solid fa-book-medical" style={{ color: 'var(--blue)' }} /> Symptom Sorter ·{' '}
              {d.chapter.title}
            </h5>
            {d.chapter.overview && <div className="overview">{d.chapter.overview.slice(0, 320)}{d.chapter.overview.length > 320 ? '…' : ''}</div>}
            {d.chapter.common.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <span className="hint">Common differentials: </span>
                {d.chapter.common.slice(0, 6).map((c) => (
                  <span className="tag" key={c}>
                    {c}
                  </span>
                ))}
              </div>
            )}
            {d.chapter.investigations.likely && (
              <div className="inv-row">
                <b>Likely investigations:</b> {d.chapter.investigations.likely}
              </div>
            )}
            {d.chapter.investigations.possible && (
              <div className="inv-row">
                <b>Possible:</b> {d.chapter.investigations.possible}
              </div>
            )}
            {d.chapter.tips.slice(0, 2).map((t, i) => (
              <div className="tip" key={i}>
                <i className="fa-solid fa-lightbulb" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
