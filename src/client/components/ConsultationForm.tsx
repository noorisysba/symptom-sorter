import { useState } from 'react'
import type { ConsultationInput } from '../api'

interface Props {
  value: ConsultationInput
  onChange: (v: ConsultationInput) => void
  onSubmit: (v: ConsultationInput) => void
  loading: boolean
}

const CHIPS = [
  'Consultations', 'New Consultation', 'Medications', 'Problems', 'Allergies',
  'Investigations', 'Documents', 'Referrals', 'Immunisations', 'Sick Note',
]

export function ConsultationForm({ value, onChange, onSubmit, loading }: Props) {
  const [activeChip, setActiveChip] = useState('Consultations')
  const [showProblems, setShowProblems] = useState(true)
  const [showRx, setShowRx] = useState(true)
  const [showInv, setShowInv] = useState(true)
  const [prescriptionType, setPrescriptionType] = useState('Acute')
  const [consent, setConsent] = useState(true)

  const set = <K extends keyof ConsultationInput>(k: K, v: ConsultationInput[K]) =>
    onChange({ ...value, [k]: v })

  const setVital = (k: string, v: string) =>
    onChange({ ...value, vitals: { ...(value.vitals ?? {}), [k]: v } })

  const v = value.vitals ?? {}

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(value)
  }

  return (
    <form className="consult scroll-thin" onSubmit={submit} style={{ overflowY: 'auto' }}>
      <div className="consult-head">
        <h3>
          <i className="fa-solid fa-stethoscope" /> Consultations
        </h3>
        <i className="fa-solid fa-gear gear" title="Settings" />
      </div>

      <div className="chip-row">
        {CHIPS.map((c) => (
          <button
            type="button"
            key={c}
            className={`chip ${activeChip === c ? 'active' : ''} ${c === 'Allergies' ? 'alert' : ''}`}
            onClick={() => setActiveChip(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="consult-top">
        <span className="pill-date">
          <i className="fa-regular fa-calendar" /> {new Date().toLocaleDateString('en-GB')}{' '}
          {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <button type="submit" className="btn-start" disabled={loading}>
          {loading ? <span className="spinner" /> : <i className="fa-solid fa-play" />} Start Treatment
        </button>
        <span className="paid">
          Paid Amount: <b>₹ 0.00</b>
        </span>
      </div>

      {/* ---- Reason for consultation ---- */}
      <section className="section">
        <div className="section-head">
          Reason For Consultation
        </div>
        <div className="section-body">
          <div className="grid">
            <div className="fld g2">
              <label htmlFor="rvis">Reason for visit *</label>
              <input
                id="rvis"
                value={value.reasonForVisit ?? ''}
                onChange={(e) => set('reasonForVisit', e.target.value)}
                placeholder="e.g. Cough and mild fever"
              />
            </div>
            <div className="fld g1">
              <label htmlFor="age">Age</label>
              <input id="age" value={value.age ?? ''} onChange={(e) => set('age', e.target.value)} placeholder="29" />
            </div>
            <div className="fld g1">
              <label htmlFor="sex">Sex</label>
              <select id="sex" value={value.sex ?? ''} onChange={(e) => set('sex', e.target.value)}>
                <option value="">Select…</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>

            <div className="fld g4">
              <label htmlFor="chief">Chief problems (one per line or separated by ; )</label>
              <textarea
                id="chief"
                value={value.chiefProblems ?? ''}
                onChange={(e) => set('chiefProblems', e.target.value)}
                placeholder={'Cough\nClear/white sputum\nMild fever\nSore throat'}
              />
            </div>

            <div className="fld g2">
              <label htmlFor="dur">Duration</label>
              <input id="dur" value={value.duration ?? ''} onChange={(e) => set('duration', e.target.value)} placeholder="5 days / 6 hours" />
            </div>
            <div className="fld g2">
              <label htmlFor="soc">Social history</label>
              <input id="soc" value={value.socialHistory ?? ''} onChange={(e) => set('socialHistory', e.target.value)} placeholder="Never smoker; no recent hospitalisation" />
            </div>
          </div>
        </div>
      </section>

      {/* ---- History ---- */}
      <section className="section">
        <div className="section-head">History</div>
        <div className="section-body">
          <div className="grid">
            <div className="fld g4">
              <label htmlFor="hx">History of presenting complaint</label>
              <textarea id="hx" value={value.history ?? ''} onChange={(e) => set('history', e.target.value)} placeholder="Onset, progression, associated features, negatives…" />
            </div>
            <div className="fld g2">
              <label htmlFor="pmh">Past medical history</label>
              <textarea id="pmh" value={value.pastMedicalHistory ?? ''} onChange={(e) => set('pastMedicalHistory', e.target.value)} placeholder="No diabetes. No hypertension…" />
            </div>
            <div className="fld g2">
              <label htmlFor="meds">Medications</label>
              <textarea id="meds" value={value.medications ?? ''} onChange={(e) => set('medications', e.target.value)} placeholder="Paracetamol 500 mg PRN" />
            </div>
            <div className="fld g2">
              <label htmlFor="alg">Allergies</label>
              <input id="alg" value={value.allergies ?? ''} onChange={(e) => set('allergies', e.target.value)} placeholder="No known drug allergies" />
            </div>
            <div className="fld g2">
              <label htmlFor="inv2">Investigations</label>
              <input id="inv2" value={value.investigations ?? ''} onChange={(e) => set('investigations', e.target.value)} placeholder="WBC: 8,900/µL. CRP: 18 mg/L. CXR: no focal consolidation" />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Problems / examination ---- */}
      <section className="section s-prob">
        <div className="section-head">
          <i className="fa-solid fa-circle-plus" /> Add Problem(s)
          <span className="f" title="Reported by patient">ⓘ</span>
          <button type="button" className="add btn-add" onClick={() => setShowProblems((s) => !s)}>
            {showProblems ? '−' : '+'}
          </button>
        </div>
        {showProblems && (
          <div className="section-body">
            <div className="fld">
              <label htmlFor="prob">Problem(s) / Impression(s)</label>
              <select id="prob" onChange={(e) => set('problemDescription', e.target.value)} value={value.problemDescription ?? ''}>
                <option value="">Type To Search Problem</option>
                <option value="Acute bronchitis">Acute bronchitis</option>
                <option value="Influenza">Influenza</option>
                <option value="Asthma exacerbation">Asthma exacerbation</option>
                <option value="Pulmonary embolism">Pulmonary embolism</option>
                <option value="Community-acquired pneumonia">Community-acquired pneumonia</option>
              </select>
            </div>
            <div className="grid" style={{ marginTop: 8 }}>
              <div className="fld g2">
                <label>Problem Start Date</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="date" value={value.problemStartDate ?? ''} onChange={(e) => set('problemStartDate', e.target.value)} />
                  <span className="tiny-radio">TODAY</span>
                </div>
              </div>
              <div className="fld g2">
                <label>
                  Duration <span title="Approximate duration">ⓘ</span>
                </label>
                <input value={value.duration ?? ''} onChange={(e) => set('duration', e.target.value)} placeholder="e.g. 5 days" />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ---- Examination & vitals ---- */}
      <section className="section">
        <div className="section-head">Examination</div>
        <div className="section-body">
          <div className="grid">
            <div className="fld">
              <label htmlFor="rr">Respiratory Rate</label>
              <input id="rr" value={v.respiratoryRate ?? ''} onChange={(e) => setVital('respiratoryRate', e.target.value)} placeholder="18" />
            </div>
            <div className="fld">
              <label htmlFor="spo2">Oxygen Saturation</label>
              <input id="spo2" value={v.spo2 ?? ''} onChange={(e) => setVital('spo2', e.target.value)} placeholder="98" />
            </div>
            <div className="fld">
              <label htmlFor="hr">Heart Rate</label>
              <input id="hr" value={v.pulse ?? ''} onChange={(e) => setVital('pulse', e.target.value)} placeholder="88" />
            </div>
            <div className="fld">
              <label htmlFor="tmp">Temperature</label>
              <input id="tmp" value={v.temperature ?? ''} onChange={(e) => setVital('temperature', e.target.value)} placeholder="37.8" />
            </div>
            <div className="fld g2">
              <label htmlFor="bp">Blood Pressure Systolic/Diastolic</label>
              <input id="bp" value={v.bp ?? ''} onChange={(e) => setVital('bp', e.target.value)} placeholder="116/72" />
            </div>
            <div className="fld g2">
              <label htmlFor="wt">Weight (kg)</label>
              <input id="wt" value={value.weight ?? ''} onChange={(e) => set('weight', e.target.value)} placeholder="kg" />
            </div>
            <div className="fld g4">
              <label htmlFor="pex">Physical Examination</label>
              <textarea id="pex" value={value.examination ?? ''} onChange={(e) => set('examination', e.target.value)} placeholder="Enter Physical Examination Details" />
            </div>
            <div className="fld g4">
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> Consent for Physical Examination
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Prescription ---- */}
      <section className="section s-rx">
        <div className="section-head">
          <i className="fa-solid fa-minus" /> Prescription(s)
          <div className="add">
            <button type="button" className="btn-blue" onClick={(e) => e.preventDefault()}>
              Add New Medicine
            </button>
          </div>
        </div>
        {showRx && (
          <div className="section-body">
            <div className="fld">
              <label>Medication</label>
              <select defaultValue="">
                <option value="">Type To Search Medication</option>
                <option>Paracetamol 500 mg</option>
                <option>Salbutamol inhaler</option>
                <option>Amoxicillin 500 mg</option>
              </select>
            </div>
            <div className="grid" style={{ marginTop: 8 }}>
              <div className="fld"><label>Dosage</label><input placeholder="1 tablet" /></div>
              <div className="fld"><label>Product Form</label><select><option>Select Product Form</option><option>Tablet</option><option>Syrup</option><option>Inhaler</option></select></div>
              <div className="fld"><label>Frequency</label><select><option>Select Frequency</option><option>BD</option><option>TDS</option><option>QID</option><option>PRN</option></select></div>
              <div className="fld"><label>Qty</label><input placeholder="10" /></div>
              <div className="fld g2"><label>Duration</label><input placeholder="5 days" /></div>
              <div className="fld g2">
                <label>Prescription Type</label>
                <div className="inline-radio">
                  {['Acute', 'Repeat', 'Variable'].map((t) => (
                    <label key={t}>
                      <input type="radio" name="rx" checked={prescriptionType === t} onChange={() => setPrescriptionType(t)} /> {t}
                    </label>
                  ))}
                </div>
              </div>
              <div className="fld g4">
                <label>Instruction</label>
                <textarea placeholder="After food" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="plus-circle" onClick={() => setShowRx(true)}>
                <i className="fa-solid fa-plus" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ---- Investigations ---- */}
      <section className="section s-inv">
        <div className="section-head">
          <i className="fa-solid fa-plus" /> Investigation(s)
          <button type="button" className="add btn-add" onClick={() => setShowInv((s) => !s)}>
            {showInv ? '−' : '+'}
          </button>
        </div>
        {showInv && (
          <div className="section-body">
            <div className="fld">
              <label>Indication (Reason for test)</label>
              <textarea value={value.investigationIndication ?? ''} onChange={(e) => set('investigationIndication', e.target.value)} placeholder="Cytology" />
            </div>
          </div>
        )}
      </section>

      {/* ---- Plan ---- */}
      <section className="section s-plan">
        <div className="section-head">Plan / Comments</div>
        <div className="section-body">
          <div className="grid">
            <div className="fld g4">
              <label htmlFor="notes">Notes / plan</label>
              <textarea id="notes" value={value.notes ?? ''} onChange={(e) => set('notes', e.target.value)} placeholder="Safety-netting advice, follow-up…" />
            </div>
          </div>
        </div>
      </section>

      <div className="submit-row">
        <button className="btn-submit" type="submit" disabled={loading}>
          {loading ? 'Analysing…' : 'Submit'}
        </button>
        <button
          type="button"
          className="btn-clear"
          onClick={() => onChange({ age: '', sex: '' })}
        >
          Clear
        </button>
      </div>
    </form>
  )
}
