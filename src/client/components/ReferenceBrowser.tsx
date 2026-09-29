import { useEffect, useMemo, useState } from 'react'
import { api, type Chapter } from '../api'

interface ListItem {
  id: number
  title: string
  section: string
}

export function ReferenceBrowser() {
  const [all, setAll] = useState<ListItem[]>([])
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.chapters().then((r) => setAll(r.chapters))
  }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return all
    const s = q.toLowerCase()
    return all.filter((c) => c.title.toLowerCase().includes(s) || c.section.toLowerCase().includes(s))
  }, [all, q])

  const open = async (id: number) => {
    setLoading(true)
    try {
      const ch = await api.chapter(id)
      setSelected(ch)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ref-layout">
      <aside className="ref-side scroll-thin">
        <div className="search">
          <input
            placeholder="Search 137 symptom chapters…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search chapters"
          />
          <div className="hint" style={{ marginTop: 6 }}>
            {filtered.length} of {all.length} chapters
          </div>
        </div>
        {filtered.map((c) => (
          <div
            key={c.id}
            className={`ref-item ${selected?.id === c.id ? 'active' : ''}`}
            onClick={() => open(c.id)}
          >
            <div className="t">{c.title}</div>
            <div className="s">{c.section}</div>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty">No chapters match.</div>}
      </aside>

      <main className="ref-main scroll-thin">
        {loading && <div className="empty"><span className="spinner" /></div>}
        {!selected && !loading && (
          <div className="empty">
            <i className="fa-solid fa-book-open" style={{ fontSize: 40, color: '#cbd5e1' }} />
            <h3 style={{ color: 'var(--ink-2)' }}>Symptom Sorter reference</h3>
            <p>Select a symptom from the list to view its GP overview, tiered differential, ready reckoner and top tips.</p>
          </div>
        )}
        {selected && !loading && (
          <article>
            <div className="sec-tag">{selected.section}</div>
            <h1>{selected.title}</h1>

            {selected.overview && (
              <>
                <h3 style={{ fontSize: 14, marginBottom: 4 }}>The GP overview</h3>
                <p className="ov">{selected.overview}</p>
              </>
            )}

            {(selected.common.length || selected.occasional.length || selected.rare.length) && (
              <>
                <h3 style={{ fontSize: 14 }}>Differential diagnosis</h3>
                <div className="ddx-cols">
                  <div className="ddx-col common">
                    <h4>Common</h4>
                    <ul>{selected.common.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                  <div className="ddx-col occasional">
                    <h4>Occasional</h4>
                    <ul>{selected.occasional.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                  <div className="ddx-col rare">
                    <h4>Rare</h4>
                    <ul>{selected.rare.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                </div>
              </>
            )}

            {selected.rr && selected.rr.diagnoses.length > 1 && (
              <>
                <h3 style={{ fontSize: 14 }}>Ready reckoner</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="rr">
                    <thead>
                      <tr>
                        <th>Feature</th>
                        {selected.rr.diagnoses.map((d) => <th key={d}>{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.rr.rows.map((r, i) => (
                        <tr key={i}>
                          <td><b>{r.feature}</b></td>
                          {r.values.map((v, j) => <td key={j}>{v}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <h3 style={{ fontSize: 14 }}>Possible investigations</h3>
            <div className="inv-row"><b>Likely:</b> {selected.inv.likely || '—'}</div>
            <div className="inv-row"><b>Possible:</b> {selected.inv.possible || '—'}</div>
            <div className="inv-row"><b>Small print:</b> {selected.inv.small_print || '—'}</div>
            {selected.inv.notes.length > 0 && (
              <ul className="tips-list" style={{ marginTop: 8 }}>
                {selected.inv.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            )}

            {selected.alarm.length > 0 && (
              <>
                <h3 style={{ fontSize: 14, marginTop: 18 }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--red)' }} /> Red flags / don't miss
                </h3>
                <ul className="alarm-list">
                  {selected.alarm.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </>
            )}

            {selected.tips.length > 0 && (
              <>
                <h3 style={{ fontSize: 14, marginTop: 18 }}>Top tips</h3>
                <ul className="tips-list">
                  {selected.tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </>
            )}
          </article>
        )}
      </main>
    </div>
  )
}
