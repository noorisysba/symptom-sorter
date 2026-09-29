# Symptom Sorter — Clinical Decision Support

A primary-care clinical decision-support tool that turns a consultation record (free-text
history, examination, vitals and investigations) into an **explainable differential
diagnosis with triage advice**, grounded in *Symptom Sorter* (Hopcroft & Forte, 6th ed., CRC Press 2020).

- **Frontend**: React 18 (bundled with esbuild) — a replica of the Clinidocs consultation UI
- **Backend**: Hono running on Cloudflare Pages/Workers (edge)
- **Engine knowledge base**: 137 symptom chapters extracted from the 6th edition of *Symptom Sorter*, plus an editable 71-condition probabilistic library

---

## URLs

| | |
|---|---|
| Sandbox preview | service on port 3000 (`GetServiceUrl`) |
| Health check | `GET /api/health` |
| Production | _not deployed yet_ (see Deployment) |

---

## What it does

1. **Feature extraction** — scans the consultation text plus structured vitals and produces a
   normalised set of clinical features, with **negation handling** (e.g. "no chest pain" is
   recorded as *explicitly denied* and reduces the score of conditions that would otherwise
   be raised).
2. **Diagnostic scoring** — every condition in the library is scored over the detected
   features (positive and negative weights). Scores are normalised into a *relative
   likelihood* share so the output reads as a ranked differential.
3. **Triage** — five dispositions (`emergency → urgent → same-day → routine → self-care`)
   derived from age-aware vital-sign thresholds, red-flag phrases, high-risk symptom
   combinations and the urgency of the leading differential.
4. **Reference grounding** — each diagnosis is mapped to the closest chapter of *Symptom
   Sorter*, showing the GP overview, tiered differential, likely investigations and top tips.

Every diagnosis carries the **exact snippet** of source text that triggered each feature, so
the clinician can audit the reasoning.

---

## Data architecture

```
src/data/kb.json         137 chapters extracted from Symptom Sorter 6th ed. (~500 KB)
src/engine/features.ts   feature dictionary + extraction & negation logic
src/engine/conditions.ts 71-condition probabilistic library (editable weights)
src/engine/reasoner.ts   scoring, differential ranking, narrative summary
src/engine/triage.ts     disposition logic, red flags, vital thresholds
src/engine/kb.ts         chapter mapping / search
src/api/routes.ts        HTTP API (Hono)
```

**Storage**: stateless — no database required. The knowledge base is a compiled JSON asset
bundled with the Worker. (If persistence for consultation records is needed later, add
Cloudflare **D1**.)

---

## API reference

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | status, chapter/condition counts, source |
| GET | `/api/chapters?q=&section=` | list/search the 137 reference chapters |
| GET | `/api/chapters/:id` | full chapter (overview, differential, ready reckoner, investigations, tips, red flags) |
| GET | `/api/conditions` | the condition library |
| POST | `/api/diagnose` | **main endpoint** — full analysis |
| POST | `/api/symptom-check` | lightweight symptom-string check |
| POST | `/api/report` | human-readable text report |

### `POST /api/diagnose` — request

```jsonc
{
  "age": "48", "sex": "Female",
  "reasonForVisit": "Sudden shortness of breath and sharp chest pain.",
  "chiefProblems": "Sudden shortness of breath; Right-sided chest pain; Rapid heartbeat",
  "duration": "6 hours",
  "history": "...recently completed a 10-hour international flight...",
  "pastMedicalHistory": "No asthma/COPD.",
  "medications": "None.", "allergies": "No known drug allergies.",
  "socialHistory": "Never smoker.",
  "examination": "Lungs largely clear... tenderness and swelling of the left calf.",
  "investigations": "ECG: Sinus tachycardia. Chest X-ray: No focal consolidation.",
  "vitals": { "temperature": "36.9", "pulse": "118", "respiratoryRate": "28", "bp": "112/70", "spo2": "92" }
}
```

### `POST /api/diagnose` — response (abridged)

```jsonc
{
  "triage": { "level": "emergency", "label": "Emergency — immediate action", "reasons": ["..."] },
  "extraction": { "features": [...], "negated": [...], "completeness": 100, "redFlagTerms": [...] },
  "diagnoses": [
    { "name": "Pulmonary embolism", "confidence": 25, "band": "most likely",
      "supporting": [{ "label": "Unilateral leg swelling", "evidence": "…left calf…" }],
      "chapter": { "title": "Acute Shortness Of Breath", "investigations": { "likely": "..." } } }
  ],
  "summary": "..."
}
```

---

## Validation against supplied sample cases

The four reference cases included with the project all return the **expected top diagnosis**
and an appropriate triage level (`npm run test:engine`):

| Case | Expected top | Engine top | Triage |
|---|---|---|---|
| 1 — Cough & mild fever (29F) | Acute bronchitis | ✓ Acute bronchitis | routine |
| 2 — Sudden fever & body aches (34M) | Influenza | ✓ Influenza | urgent |
| 3 — Wheeze & breathlessness (26F) | Acute asthma exacerbation | ✓ Asthma exacerbation | urgent |
| 4 — Sudden dyspnoea & pleuritic pain (48F) | Pulmonary embolism | ✓ Pulmonary embolism | emergency |

**4/4 top-diagnosis match.** Load them from the **Sample Cases** tab in the UI.

---

## User guide

1. Open the app — the three-column Clinidocs-style layout appears.
2. Fill the consultation form (at minimum: reason for visit, chief problems, history,
   examination, vitals). **Submit**.
3. The right panel shows: triage banner → detected features → ranked differential with
   evidence → matching *Symptom Sorter* chapters.
4. **Text Report** generates a printable clinical note.
5. **Symptom Sorter** tab browses all 137 reference chapters (searchable).
6. **Sample Cases** tab loads the four validation cases.

---

## Local development

```bash
npm install
npm run build:client     # bundle React → public/static/app.js
npm run build            # client + vite worker build → dist/_worker.js
pm2 start ecosystem.config.cjs   # wrangler pages dev dist on :3000
curl http://localhost:3000/api/health
npm run test:engine      # run the 4 sample cases through the engine
```

## Deployment

- **Platform**: Cloudflare Pages (Hono + Vite build, `dist/_worker.js`)
- **Status**: ❌ not yet deployed — awaiting the user's choice of deploy path
- **Tech stack**: Hono + TypeScript + React 18 + esbuild

---

### Disclaimer

Decision-support **only**. Output is derived from *Symptom Sorter* (Hopcroft & Forte, 6th ed.)
and does not replace clinical judgement or a full patient assessment.
