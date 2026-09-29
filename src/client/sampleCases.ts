import type { ConsultationInput } from './api'

export interface SampleCase {
  id: string
  title: string
  input: ConsultationInput
  expectedDiagnosis: string
  expectedDifferentials: string[]
  expectedTriage: string
}

const case1: ConsultationInput = {
  age: '29',
  sex: 'Female',
  reasonForVisit: 'Cough and mild fever.',
  chiefProblems: 'Cough; Clear/white sputum; Mild fever; Sore throat; Fatigue',
  duration: '5 days',
  history:
    'Previously healthy. Symptoms started with a sore throat and runny nose. Cough developed after 2 days and is now occasionally productive. No chest pain. No significant shortness of breath.',
  pastMedicalHistory: 'No diabetes. No hypertension. No asthma/COPD. No cardiac disease.',
  medications: 'Paracetamol 500 mg as needed.',
  allergies: 'No known drug allergies.',
  socialHistory: 'Never smoker. No recent hospitalization.',
  examination:
    'Normal air entry bilaterally. Scattered rhonchi that partially clear with coughing. No focal crackles. No wheezing.',
  investigations: 'WBC: 8,900/µL. Neutrophils: 64%. CRP: 18 mg/L. Chest X-ray: No focal consolidation.',
  vitals: { temperature: '37.8', pulse: '88', respiratoryRate: '18', bp: '116/72', spo2: '98' },
}

const case2: ConsultationInput = {
  age: '34',
  sex: 'Male',
  reasonForVisit: 'Sudden fever, body aches and dry cough.',
  chiefProblems: 'High fever; Dry cough; Headache; Muscle aches; Chills; Fatigue',
  duration: '2 days',
  history:
    'Symptoms began suddenly with fever and chills. Developed severe generalized body aches and headache on the same day. Dry cough started shortly afterward. No productive sputum. No pleuritic chest pain. No significant shortness of breath.',
  pastMedicalHistory: 'Previously healthy.',
  medications: 'Paracetamol 500 mg.',
  allergies: 'No known drug allergies.',
  socialHistory: 'Never smoker. No recent hospitalization.',
  examination: 'Mild pharyngeal redness. Lungs clear bilaterally. No crackles. No wheezing.',
  investigations: 'WBC: 6,800/µL. Neutrophils: 68%. CRP: 32 mg/L. Influenza test: Positive.',
  vitals: { temperature: '39.2', pulse: '108', respiratoryRate: '20', bp: '120/76', spo2: '97' },
}

const case3: ConsultationInput = {
  age: '26',
  sex: 'Female',
  reasonForVisit: 'Worsening shortness of breath and wheezing.',
  chiefProblems: 'Shortness of breath; Wheezing; Chest tightness; Dry cough',
  duration: '2 days',
  history:
    'Known history of asthma. Symptoms worsened after exposure to dust. Using reliever inhaler more frequently than usual. No fever. No sputum production. No chest pain.',
  pastMedicalHistory: 'Asthma since childhood. No diabetes. No cardiac disease.',
  medications: 'Salbutamol inhaler as needed.',
  allergies: 'No known drug allergies.',
  socialHistory: 'Never smoker.',
  examination:
    'Bilateral reduced air entry. Diffuse expiratory wheezing. No focal crackles. No increased vocal resonance.',
  investigations: 'WBC: 9,200/µL. CRP: 8 mg/L. Chest X-ray: No focal consolidation.',
  vitals: { temperature: '36.8', pulse: '102', respiratoryRate: '24', bp: '118/70', spo2: '95' },
}

const case4: ConsultationInput = {
  age: '48',
  sex: 'Female',
  reasonForVisit: 'Sudden shortness of breath and sharp chest pain.',
  chiefProblems: 'Sudden shortness of breath; Right-sided chest pain; Rapid heartbeat; Anxiety; Mild dizziness',
  duration: '6 hours',
  history:
    'Previously healthy. Sudden onset of shortness of breath while walking. Sharp right-sided chest pain is worse with deep breathing. No cough. No sputum. No fever. Recently completed a 10-hour international flight.',
  pastMedicalHistory: 'No asthma/COPD. No cardiac disease. No diabetes.',
  medications: 'None.',
  allergies: 'No known drug allergies.',
  socialHistory: 'Never smoker. Occasional alcohol.',
  examination:
    'Lungs largely clear. No focal crackles. No significant wheezing. Mild tenderness and swelling of the left calf.',
  investigations: 'WBC: 9,600/µL. CRP: 12 mg/L. ECG: Sinus tachycardia. Chest X-ray: No focal consolidation.',
  vitals: { temperature: '36.9', pulse: '118', respiratoryRate: '28', bp: '112/70', spo2: '92' },
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: 'acute-bronchitis',
    title: 'Case 1 — Cough & mild fever (29F)',
    input: case1,
    expectedDiagnosis: 'Acute bronchitis',
    expectedDifferentials: ['Viral URTI', 'Community-acquired pneumonia', 'Asthma'],
    expectedTriage: 'Routine clinician assessment',
  },
  {
    id: 'influenza',
    title: 'Case 2 — Sudden fever & body aches (34M)',
    input: case2,
    expectedDiagnosis: 'Influenza',
    expectedDifferentials: ['COVID-19', 'Viral URTI', 'Early pneumonia'],
    expectedTriage: 'Clinician assessment',
  },
  {
    id: 'asthma',
    title: 'Case 3 — Wheeze & breathlessness (26F)',
    input: case3,
    expectedDiagnosis: 'Acute asthma exacerbation',
    expectedDifferentials: ['Acute bronchitis', 'Pneumonia', 'Pulmonary embolism'],
    expectedTriage: 'Urgent clinician assessment',
  },
  {
    id: 'pe',
    title: 'Case 4 — Sudden dyspnoea & pleuritic pain (48F)',
    input: case4,
    expectedDiagnosis: 'Pulmonary embolism',
    expectedDifferentials: ['Pneumonia', 'Pneumothorax', 'Acute coronary syndrome'],
    expectedTriage: 'Emergency / urgent clinician assessment',
  },
]
