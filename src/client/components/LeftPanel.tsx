import type { ConsultationInput } from '../api'

export function LeftPanel({ patient }: { patient: ConsultationInput }) {
  const age = patient.age || '—'
  const sex = patient.sex ? patient.sex.charAt(0) : '—'
  return (
    <aside className="col-left scroll-thin">
      <div className="date-chip">
        <i className="fa-regular fa-calendar" />
        {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
        {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </div>

      <div className="pt-card">
        <div className="pt-avatar-wrap">
          <div
            className="pt-avatar"
            style={{
              background: 'linear-gradient(135deg,#94a3b8,#475569)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontSize: 30,
            }}
          >
            <i className="fa-solid fa-user" />
          </div>
        </div>
        <h2>Current Patient</h2>
        <div className="meta">
          {sex} · {age} {patient.sex ? 'yrs' : ''}
        </div>
        <div className="meta">
          {patient.duration ? `Duration: ${patient.duration}` : 'New consultation'}
        </div>
        <button type="button" className="btn-book">
          <i className="fa-regular fa-calendar-check" /> Book An Appointment
        </button>
        <div className="pt-loc">
          <i className="fa-solid fa-location-dot" /> Primary Care Clinic
          <br />
          General Practice
        </div>
      </div>

      <div className="side-tiles">
        <button className="side-tile" type="button">
          <i className="fa-solid fa-pills" /> Advanced Directive
        </button>
        <button className="side-tile" type="button">
          <i className="fa-solid fa-file-medical" /> MCDD/Death Certificate
        </button>
        <button className="side-tile" type="button">
          <i className="fa-solid fa-chart-simple" /> Screening
        </button>
        <button className="side-tile" type="button">
          <i className="fa-solid fa-briefcase-medical" /> Treatments
        </button>
      </div>

      <button className="side-wide" type="button">
        <i className="fa-solid fa-file-signature" /> Consent Forms
      </button>

      <div className="hospital-chip">
        <i className="fa-solid fa-hospital" /> Primary Care Clinic
      </div>
    </aside>
  )
}
