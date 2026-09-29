/**
 * Clinical feature extraction.
 *
 * Turns an unstructured consultation record (free text + structured vitals /
 * examination / investigation fields) into a normalised set of clinical
 * "features" that the diagnostic engine can reason over.
 *
 * Extraction is deliberately transparent: every positive feature keeps the
 * exact snippet of source text that triggered it, so the UI can show the
 * clinician *why* a diagnosis was suggested.
 */

export interface Vitals {
  temperature?: string | number
  pulse?: string | number
  respiratoryRate?: string | number
  bp?: string | number
  bpSystolic?: string | number
  bpDiastolic?: string | number
  spo2?: string | number
}

export interface ConsultationInput {
  age?: string | number
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
  vitals?: Vitals
}

export type FeatureCategory =
  | 'constitutional'
  | 'ent'
  | 'respiratory'
  | 'cardiac'
  | 'gi'
  | 'urinary'
  | 'neuro'
  | 'msk'
  | 'derm'
  | 'repro'
  | 'exposure'
  | 'exam'
  | 'investigation'
  | 'vital'
  | 'age'

export interface FeatureDef {
  id: string
  label: string
  category: FeatureCategory
  /** Substrings tested case-insensitively against the consultation text. */
  patterns: string[]
}

export interface DetectedFeature {
  id: string
  label: string
  category: FeatureCategory
  evidence: string
}

export interface ExtractionResult {
  features: DetectedFeature[]
  featureIds: string[]
  negated: string[]
  vitals: Record<string, number>
  redFlagTerms: string[]
}

/* ------------------------------------------------------------------ *
 * Feature dictionary
 * ------------------------------------------------------------------ */

const F = (
  id: string,
  label: string,
  category: FeatureCategory,
  patterns: string[]
): FeatureDef => ({ id, label, category, patterns })

export const FEATURES: FeatureDef[] = [
  /* ---- constitutional ---- */
  F('fever', 'Fever', 'constitutional', ['fever', 'pyrexia', 'febrile', 'temperature high']),
  F('high_fever', 'High fever', 'constitutional', ['high fever', 'high-grade fever', '39°', '40°', '39.', '40.']),
  F('chills', 'Chills / rigors', 'constitutional', ['chills', 'rigors', 'shivering', 'shivery']),
  F('night_sweats', 'Night sweats', 'constitutional', ['night sweat']),
  F('fatigue', 'Fatigue / lethargy', 'constitutional', ['fatigue', 'tired', 'lethargy', 'lethargic', 'exhaust', 'malaise', 'unwellness', 'low energy']),
  F('malaise', 'Malaise', 'constitutional', ['malaise', 'generally unwell', 'feeling unwell', 'systemically unwell']),
  F('weight_loss', 'Weight loss', 'constitutional', ['weight loss', 'losing weight', 'lost weight']),
  F('weight_gain', 'Weight gain', 'constitutional', ['weight gain', 'gained weight']),
  F('loss_of_appetite', 'Loss of appetite', 'constitutional', ['loss of appetite', 'anorexia', 'not eating', 'poor appetite', 'off food']),
  F('dehydration', 'Dehydration', 'constitutional', ['dehydrat', 'dry mouth', 'reduced skin turgor', 'sunken eyes']),

  /* ---- ENT / upper airway ---- */
  F('sore_throat', 'Sore throat', 'ent', ['sore throat', 'throat pain', 'pharyngitis', 'painful throat']),
  F('runny_nose', 'Runny / discharging nose', 'ent', ['runny nose', 'rhinorrhoea', 'nasal discharge', 'runny nose', 'nose running']),
  F('nasal_congestion', 'Nasal congestion', 'ent', ['blocked nose', 'nasal congestion', 'stuffy nose', 'congested nose', 'nasal blockage']),
  F('sneezing', 'Sneezing', 'ent', ['sneez']),
  F('earache', 'Earache', 'ent', ['earache', 'ear pain', 'otalgia', 'ear discharge', 'ear infection']),
  F('facial_pain', 'Facial pain / pressure', 'ent', ['facial pain', 'facial pressure', 'sinus pain', 'sinusitis']),
  F('hoarseness', 'Hoarseness / voice change', 'ent', ['hoarse', 'voice change', 'husky voice', 'dysphonia']),
  F('difficulty_swallowing', 'Difficulty swallowing', 'ent', ['difficulty swallowing', 'dysphagia', 'odynophagia', 'painful swallow', 'trouble swallowing']),
  F('drooling', 'Drooling', 'ent', ['drool']),
  F('stridor', 'Stridor', 'ent', ['stridor', 'noisy breathing', 'inspiratory noise']),
  F('neck_swelling', 'Neck swelling', 'ent', ['neck swelling', 'neck lump', 'swollen neck']),
  F('lymphadenopathy', 'Lymphadenopathy', 'ent', ['lymphadenopathy', 'swollen glands', 'swollen lymph', 'enlarged lymph', 'swollen neck nodes', 'tender neck nodes']),
  F('coryza', 'Coryza / cold symptoms', 'ent', ['coryza', 'common cold', 'cold symptoms', 'upper respiratory infection', 'urti']),
  F('anosmia', 'Loss of smell / taste', 'ent', ['loss of smell', 'anosmia', 'loss of taste', 'ageusia']),

  /* ---- respiratory ---- */
  F('cough', 'Cough', 'respiratory', ['cough']),
  F('dry_cough', 'Dry cough', 'respiratory', ['dry cough', 'non-productive cough', 'nonproductive cough', 'unproductive cough']),
  F('productive_cough', 'Productive cough', 'respiratory', ['productive cough', 'productive', 'sputum', 'phlegm', 'expectorat']),
  F('sputum_clear', 'Clear / white sputum', 'respiratory', ['clear sputum', 'white sputum', 'clear/white sputum', 'mucoid sputum']),
  F('sputum_purulent', 'Purulent / coloured sputum', 'respiratory', ['purulent', 'green sputum', 'yellow sputum', 'rusty sputum', 'discoloured sputum']),
  F('haemoptysis', 'Coughing up blood', 'respiratory', ['haemoptysis', 'coughing up blood', 'blood in sputum', 'blood-streaked sputum', 'haemoptysis']),
  F('sob', 'Shortness of breath', 'respiratory', ['shortness of breath', 'breathless', 'dyspnoea', 'dyspnea', 'short of breath', 'difficulty breathing', 'labored breathing', 'laboured breathing']),
  F('sob_sudden', 'Sudden-onset breathlessness', 'respiratory', ['sudden onset of shortness', 'sudden shortness', 'sudden breathless', 'abrupt onset of short', 'sudden onset of breathless']),
  F('sob_exertional', 'Exertional breathlessness', 'respiratory', ['exertional', 'on exertion', 'when walking', 'on walking', 'climbing stairs']),
  F('sob_rest', 'Breathlessness at rest', 'respiratory', ['at rest', 'resting breathless', 'breathless at rest']),
  F('wheeze', 'Wheeze', 'respiratory', ['wheez', 'rhonchi', 'whistling chest']),
  F('chest_tightness', 'Chest tightness', 'respiratory', ['chest tightness', 'tight chest', 'chest tight']),
  F('chest_pain', 'Chest pain', 'respiratory', ['chest pain', 'chest discomfort', 'pain in the chest']),
  F('pleuritic_chest_pain', 'Pleuritic chest pain', 'respiratory', ['pleuritic', 'worse with deep breathing', 'worse on deep breathing', 'worse with inspiration', 'pain on inspiration', 'sharp chest pain']),
  F('central_chest_pain', 'Central / crushing chest pain', 'respiratory', ['central chest pain', 'crushing', 'heavy chest pain', 'chest pain radiating', 'radiating to left arm', 'radiat']),
  F('orthopnoea', 'Orthopnoea', 'respiratory', ['orthopnoea', 'orthopnea', 'breathless lying flat', 'cannot lie flat']),
  F('pnd', 'Paroxysmal nocturnal dyspnoea', 'respiratory', ['paroxysmal nocturnal', 'wakes at night breathless', 'waking up breathless', 'nocturnal dyspnoea']),
  F('nocturnal_cough', 'Nocturnal cough', 'respiratory', ['night cough', 'nocturnal cough', 'cough at night', 'cough worse at night']),
  F('paroxysmal_cough', 'Paroxysmal cough', 'respiratory', ['paroxysmal cough', 'fits of coughing', 'bouts of coughing', 'whoop', 'post-tussive', 'coughing fits']),
  F('cough_barking', 'Barking cough', 'respiratory', ['barking cough', 'seal-like cough', 'brassy cough']),
  F('chronic_cough', 'Chronic / persistent cough', 'respiratory', ['persistent cough', 'chronic cough', 'cough for weeks', 'cough > 3 weeks', 'cough more than 3 weeks']),
  F('exercise_induced', 'Exercise-induced symptoms', 'respiratory', ['exercise-induced', 'on exercise', 'after exercise', 'breathless on exercise', 'wheeze on exercise']),

  /* ---- cardiac ---- */
  F('palpitations', 'Palpitations', 'cardiac', ['palpitation', 'racing heart', 'heart racing', 'rapid heartbeat', 'fast heartbeat']),
  F('syncope', 'Blackout / syncope', 'cardiac', ['syncope', 'fainted', 'blackout', 'loss of consciousness', 'passed out', 'collapse']),
  F('ankle_swelling', 'Ankle / leg swelling', 'cardiac', ['ankle swelling', 'swollen ankles', 'pedal oedema', 'pedal edema', 'leg swelling', 'peripheral oedema', 'peripheral edema']),
  F('cardiac_hx', 'Known cardiac disease', 'cardiac', ['cardiac disease', 'heart disease', 'ischaemic heart', 'ischemic heart', 'coronary', 'heart failure', 'atrial fibrillation']),
  F('leg_pain', 'Leg pain', 'cardiac', ['leg pain', 'calf pain', 'pain in the leg']),
  F('unilateral_leg_swelling', 'Unilateral leg swelling', 'cardiac', ['swelling of the left calf', 'swelling of the right calf', 'left calf', 'right calf', 'unilateral leg swelling', 'unilateral calf']),

  /* ---- GI ---- */
  F('abdominal_pain', 'Abdominal pain', 'gi', ['abdominal pain', 'tummy pain', 'stomach pain', 'belly pain', 'abdo pain']),
  F('epigastric_pain', 'Epigastric pain', 'gi', ['epigastric', 'upper abdominal pain', 'indigestion', 'dyspepsia']),
  F('ruq_pain', 'Right upper quadrant pain', 'gi', ['right upper quadrant', 'ruq pain', 'right hypochondrial']),
  F('rlq_pain', 'Right iliac fossa pain', 'gi', ['right iliac fossa', 'rif pain', 'rlq', 'right lower abdomen']),
  F('llq_pain', 'Left lower quadrant pain', 'gi', ['left lower quadrant', 'llq', 'left iliac fossa']),
  F('flare_pain', 'Flank / loin pain', 'gi', ['loin pain', 'flank pain', 'renal angle']),
  F('nausea', 'Nausea', 'gi', ['nausea', 'feel sick', 'feeling sick', 'queasy']),
  F('vomiting', 'Vomiting', 'gi', ['vomit', 'throwing up', 'emesis']),
  F('vomiting_blood', 'Vomiting blood', 'gi', ['vomiting blood', 'haematemesis', 'hematemesis', 'coffee ground', 'blood in vomit']),
  F('diarrhoea', 'Diarrhoea', 'gi', ['diarrhoea', 'diarrhea', 'loose stool', 'loose motion', 'watery stool']),
  F('constipation', 'Constipation', 'gi', ['constipation', 'constipated', 'infrequent stool']),
  F('rectal_bleeding', 'Rectal bleeding', 'gi', ['rectal bleeding', 'blood in stool', 'melaena', 'melena', 'haematochezia', 'blood per rectum', 'pr bleeding']),
  F('reflux', 'Reflux / heartburn', 'gi', ['reflux', 'heartburn', 'acid regurgitation', 'gord', 'gerd']),
  F('jaundice', 'Jaundice', 'gi', ['jaundice', 'yellow skin', 'yellow eyes', 'icterus']),
  F('bloating', 'Bloating', 'gi', ['bloating', 'bloated', 'abdominal distension']),
  F('bowel_habit_change', 'Change in bowel habit', 'gi', ['change in bowel habit', 'bowel habit change']),

  /* ---- urinary ---- */
  F('dysuria', 'Dysuria', 'urinary', ['dysuria', 'painful urination', 'burning on urination', 'burning when passing urine', 'stinging on urination']),
  F('urinary_frequency', 'Urinary frequency', 'urinary', ['frequency', 'frequent urination', 'passing urine often', 'urinating often']),
  F('urinary_urgency', 'Urinary urgency', 'urinary', ['urgency', 'urgent need to urinate']),
  F('haematuria', 'Blood in urine', 'urinary', ['haematuria', 'hematuria', 'blood in urine', 'blood in the urine']),
  F('nocturia', 'Nocturia', 'urinary', ['nocturia', 'waking to urinate', 'passing urine at night']),
  F('urinary_retention', 'Urinary retention', 'urinary', ['retention', 'cannot pass urine', 'unable to urinate']),
  F('polyuria_polydipsia', 'Polyuria / polydipsia', 'urinary', ['polyuria', 'polydipsia', 'excessive thirst', 'passing large volumes', 'drinking a lot']),

  /* ---- neuro ---- */
  F('headache', 'Headache', 'neuro', ['headache', 'head pain', 'cephalalgia']),
  F('thunderclap_headache', 'Thunderclap headache', 'neuro', ['thunderclap', 'worst headache of my life', 'worst headache of her life', 'sudden severe headache', 'sudden onset severe headache']),
  F('dizziness', 'Dizziness', 'neuro', ['dizziness', 'dizzy', 'light-headed', 'lightheaded', 'giddiness']),
  F('vertigo', 'Vertigo', 'neuro', ['vertigo', 'spinning sensation', 'room spinning', 'rotational dizziness']),
  F('confusion', 'Confusion', 'neuro', ['confusion', 'confused', 'disorientat', 'altered mental state']),
  F('focal_deficit', 'Focal neurological deficit', 'neuro', ['focal deficit', 'facial droop', 'hemiparesis', 'hemiplegia', 'slurred speech', 'dysarthria', 'aphasia', 'weakness on one side', 'one-sided weakness', 'arm weakness', 'leg weakness']),
  F('seizure', 'Seizure', 'neuro', ['seizure', 'convulsion', 'fit ']),
  F('photophobia', 'Photophobia', 'neuro', ['photophobia', 'light hurts', 'sensitivity to light', 'light sensitivity']),
  F('neck_stiffness', 'Neck stiffness', 'neuro', ['neck stiffness', 'stiff neck', 'neck rigidity', 'nuchal rigidity']),
  F('visual_disturbance', 'Visual disturbance', 'neuro', ['visual disturbance', 'blurred vision', 'vision loss', 'double vision', 'diplopia', 'flashes', 'floaters']),
  F('numbness', 'Numbness / paraesthesia', 'neuro', ['numb', 'paraesthesia', 'paresthesia', 'pins and needles', 'tingling']),
  F('tremor', 'Tremor', 'neuro', ['tremor', 'shaking hands', 'trembling hand']),
  F('anxiety_feeling', 'Tense / anxious', 'neuro', ['anxious', 'anxiety', 'panic', 'feeling tense', 'stress', 'worried']),

  /* ---- MSK ---- */
  F('joint_pain', 'Joint pain', 'msk', ['joint pain', 'arthralgia', 'painful joints']),
  F('joint_swelling', 'Joint swelling', 'msk', ['joint swelling', 'swollen joint', 'swollen knee', 'joint effusion']),
  F('body_aches', 'Muscle aches / myalgia', 'msk', ['muscle ache', 'myalgia', 'body ache', 'generalized body ache', 'generalised body ache', 'aching all over', 'aching muscles', 'aching legs']),
  F('back_pain', 'Back pain', 'msk', ['back pain', 'backache', 'lower back']),
  F('trauma', 'Recent trauma / injury', 'msk', ['trauma', 'injury', 'twisted', 'fell', 'fall', 'accident']),
  F('muscle_tenderness', 'Muscle tenderness', 'msk', ['muscle tenderness', 'muscular tenderness', 'tender muscle']),
  F('morning_stiffness', 'Morning stiffness', 'msk', ['morning stiffness', 'stiff in the morning']),

  /* ---- derm ---- */
  F('rash', 'Rash', 'derm', ['rash', 'erythema', 'eruption', 'skin lesion']),
  F('itching', 'Itching', 'derm', ['itch', 'prurit']),
  F('urticaria', 'Urticaria / hives', 'derm', ['urticaria', 'hives', 'wheals']),
  F('non_blanching_rash', 'Non-blanching rash', 'derm', ['non-blanching', 'non blanching', 'petechial', 'purpuric rash', 'purpura']),
  F('cellulitis_like', 'Red, hot, swollen skin', 'derm', ['red, hot', 'hot and swollen', 'redness and swelling', 'cellulitis']),

  /* ---- reproductive ---- */
  F('vaginal_discharge', 'Vaginal discharge', 'repro', ['vaginal discharge', 'discharge per vaginam']),
  F('pelvic_pain', 'Pelvic pain', 'repro', ['pelvic pain', 'lower abdominal pain', 'suprapubic pain']),
  F('amenorrhoea', 'Amenorrhoea', 'repro', ['amenorrhoea', 'amenorrhea', 'absent periods', 'missed period', 'no period']),
  F('menstrual_change', 'Menstrual change', 'repro', ['menorrhagia', 'heavy periods', 'irregular periods']),
  F('pregnancy_possible', 'Possible pregnancy', 'repro', ['pregnan', 'expecting']),
  F('testicular_pain', 'Testicular pain', 'repro', ['testicular pain', 'testicle pain', 'scrotal pain']),
  F('scrotal_swelling', 'Scrotal swelling', 'repro', ['scrotal swelling', 'swollen testicle', 'testicular swelling']),
  F('vaginal_bleeding', 'Vaginal bleeding', 'repro', ['vaginal bleeding', 'pv bleeding']),

  /* ---- exposure / risk ---- */
  F('smoker', 'Current smoker', 'exposure', ['smoker', 'smoking', 'cigarettes', 'tobacco']),
  F('former_smoker', 'Former smoker', 'exposure', ['ex-smoker', 'ex smoker', 'former smoker', 'quit smoking', 'stopped smoking']),
  F('never_smoker', 'Never smoker', 'exposure', ['never smoked', 'never smoker', 'non-smoker', 'nonsmoker', 'never smoker']),
  F('asthma_hx', 'History of asthma', 'exposure', ['asthma']),
  F('copd_hx', 'History of COPD', 'exposure', ['copd', 'chronic obstructive']),
  F('diabetes_hx', 'Diabetes', 'exposure', ['diabetes', 'diabetic', 't2dm']),
  F('immunocompromised', 'Immunosuppression', 'exposure', ['immunosuppress', 'immunocompromis', 'chemotherapy', 'on steroids', 'hiv']),
  F('recent_travel', 'Recent travel', 'exposure', ['travel', 'abroad', 'returned from', 'trip to']),
  F('immobility', 'Prolonged immobility / flight', 'exposure', ['long flight', 'long-haul', 'long haul', 'immobil', 'bed rest', 'recent surgery', 'recent flight', 'hours of flight', 'international flight']),
  F('recent_hospitalisation', 'Recent hospitalisation', 'exposure', ['recent hospital', 'recently admitted', 'recent admission', 'hospitalisation', 'hospitalization']),
  F('cancer_hx', 'History of cancer', 'exposure', ['cancer', 'carcinoma', 'malignancy', 'tumour', 'tumor']),
  F('contact_sick', 'Sick contacts / outbreak', 'exposure', ['contact with', 'sick contact', 'outbreak', 'family member unwell']),
  F('allergy_hx', 'Atopy / allergy', 'exposure', ['allergy', 'allergic', 'atopic', 'eczema', 'hay fever', 'allergic rhinitis']),
  F('ace_inhibitor', 'On ACE inhibitor', 'exposure', ['ace inhibitor', 'ramipril', 'lisinopril', 'enalapril', 'perindopril', 'captopril']),
  F('medication_side_effect', 'Possible drug side effect', 'exposure', ['side effect', 'adverse drug', 'drug reaction']),

  /* ---- examination ---- */
  F('exam_wheeze', 'Auscultation: wheeze / rhonchi', 'exam', ['wheez', 'rhonchi', 'expiratory wheeze', 'monophonic', 'polyphonic']),
  F('exam_crackles_focal', 'Auscultation: focal crackles', 'exam', ['focal crackle', 'focal crepitation', 'localised crackle', 'localized crackle', 'unilateral crackle', 'crepitations at']),
  F('exam_crackles_general', 'Auscultation: generalised crackles', 'exam', ['bilateral crackle', 'generalised crackle', 'generalized crackle', 'basal crackle', 'bibasal crackle']),
  F('exam_reduced_air_entry', 'Auscultation: reduced air entry', 'exam', ['reduced air entry', 'reduced breath sounds', 'diminished air entry', 'reduced air entry bilaterally']),
  F('exam_pharyngeal_redness', 'Pharyngeal redness / exudate', 'exam', ['pharyngeal redness', 'pharyngeal erythema', 'inflamed throat', 'red throat', 'tonsillar exudate', 'tonsillar swelling', 'exudative tonsillitis']),
  F('exam_calf_swelling', 'Calf swelling on examination', 'exam', ['calf swelling', 'swelling of the calf', 'swollen calf', 'calf is swollen']),
  F('exam_calf_tenderness', 'Calf tenderness on examination', 'exam', ['calf tenderness', 'tender calf', 'tenderness of the calf', 'tender left calf', 'tender right calf']),
  F('exam_lymphadenopathy', 'Lymphadenopathy on examination', 'exam', ['lymphadenopathy', 'enlarged lymph nodes', 'swollen glands', 'cervical nodes', 'nodes palpable']),
  F('exam_rash', 'Rash on examination', 'exam', ['rash on', 'rash noted', 'erythematous rash', 'maculopapular']),
  F('exam_cyanosis', 'Cyanosis', 'exam', ['cyanosis', 'cyanosed', 'blue lips']),
  F('exam_distress', 'Respiratory distress / accessory muscles', 'exam', ['accessory muscle', 'intercostal recession', 'sternal recession', 'respiratory distress', 'tripod', 'grunting', 'nasal flaring']),
  F('exam_reduced_chest_expansion', 'Reduced chest expansion', 'exam', ['reduced chest expansion', 'asymmetrical chest', 'reduced expansion']),
  F('exam_dullness', 'Chest dullness / decreased resonance', 'exam', ['dullness', 'stony dull', 'impaired resonance', 'decreased resonance']),
  F('exam_guarding', 'Abdominal guarding / rigidity', 'exam', ['guarding', 'rigidity', 'peritonism', 'rebound tenderness']),
  F('exam_tender_abdomen', 'Abdominal tenderness', 'exam', ['abdominal tenderness', 'tender abdomen', 'tenderness in the', 'right iliac fossa tenderness']),
  F('exam_dehydration', 'Clinically dehydrated', 'exam', ['dehydrated', 'dry mucous membranes', 'reduced skin turgor']),
  F('exam_pallor', 'Pallor', 'exam', ['pallor', 'pale conjunctivae', 'pale skin']),

  /* ---- investigations ---- */
  F('wbc_high', 'Raised white cell count', 'investigation', ['wbc: 1', 'raised wcc', 'elevated wcc', 'leukocytosis', 'leucocytosis']),
  F('wbc_normal', 'Normal white cell count', 'investigation', ['wbc: 5', 'wbc: 6', 'wbc: 7', 'wbc: 8', 'wbc: 9', 'normal wcc']),
  F('neutrophilia', 'Neutrophilia', 'investigation', ['neutrophil', 'neutrophilia']),
  F('crp_high', 'Raised CRP', 'investigation', ['crp: 2', 'crp: 3', 'crp: 4', 'crp: 5', 'crp: 6', 'crp: 7', 'crp: 8', 'crp: 9', 'raised crp', 'elevated crp']),
  F('crp_mild', 'Mildly raised CRP', 'investigation', ['crp: 1', 'crp: 2']),
  F('crp_normal', 'Normal CRP', 'investigation', ['crp: 0', 'crp: 1 ', 'normal crp']),
  F('xray_consolidation', 'CXR: consolidation', 'investigation', ['consolidation', 'consolidation on chest', 'infiltrate on chest', 'opacity on chest']),
  F('xray_normal', 'CXR: no focal consolidation', 'investigation', ['no focal consolidation', 'chest x-ray: no', 'chest x-ray normal', 'cxr normal', 'chest x-ray clear', 'normal chest x-ray', 'no consolidation']),
  F('influenza_positive', 'Influenza test positive', 'investigation', ['influenza test: positive', 'influenza positive', 'flu test positive']),
  F('covid_positive', 'COVID-19 test positive', 'investigation', ['covid: positive', 'covid-19 positive', 'sars-cov-2 positive', 'covid test positive']),
  F('ecg_sinus_tachycardia', 'ECG: sinus tachycardia', 'investigation', ['sinus tachycardia']),
  F('ecg_ischaemia', 'ECG: ischaemic changes', 'investigation', ['st elevation', 'st depression', 'ischaemic changes', 'ischemic changes', 't wave inversion', 'new lbbb']),
  F('troponin_high', 'Troponin raised', 'investigation', ['troponin raised', 'raised troponin', 'positive troponin', 'troponin elevated']),
  F('d_dimer_high', 'D-dimer raised', 'investigation', ['d-dimer raised', 'raised d-dimer', 'positive d-dimer', 'elevated d-dimer']),
  F('urine_nitrite', 'Urinalysis: nitrites / leucocytes', 'investigation', ['nitrite', 'leucocyte esterase', 'leukocyte esterase', 'positive nitrites']),
  F('spirometry_obstructive', 'Spirometry: obstructive pattern', 'investigation', ['obstructive pattern', 'fev1/fvc', 'reversible obstruction']),
  F('ct_pe', 'CTPA: pulmonary embolism', 'investigation', ['ctpa', 'ct pulmonary', 'filling defect', 'pulmonary embolism confirmed']),

  /* ---- age bands ---- */
  F('infant', 'Infant (under 1 year)', 'age', ['infant', 'baby', 'neonate', 'newborn']),
  F('child', 'Child', 'age', ['child', 'toddler', 'paediatric', 'pediatric']),
  F('elderly', 'Elderly', 'age', ['elderly', 'older adult']),
]

/* ------------------------------------------------------------------ *
 * Red-flag trigger terms (used for triage escalation)
 * ------------------------------------------------------------------ */

export const RED_FLAG_TERMS: { term: string; reason: string }[] = [
  { term: 'crushing chest pain', reason: 'Possible acute coronary syndrome' },
  { term: 'central chest pain', reason: 'Possible acute coronary syndrome' },
  { term: 'radiating to left arm', reason: 'Possible acute coronary syndrome' },
  { term: 'radiating to the jaw', reason: 'Possible acute coronary syndrome' },
  { term: 'chest pain radiating', reason: 'Possible acute coronary syndrome' },
  { term: 'thunderclap', reason: 'Possible subarachnoid haemorrhage' },
  { term: 'worst headache', reason: 'Possible subarachnoid haemorrhage' },
  { term: 'neck stiffness', reason: 'Possible meningitis' },
  { term: 'stiff neck', reason: 'Possible meningitis' },
  { term: 'non-blanching', reason: 'Possible meningococcal sepsis' },
  { term: 'non blanching', reason: 'Possible meningococcal sepsis' },
  { term: 'haemoptysis', reason: 'Haemoptysis — exclude malignancy / PE / TB' },
  { term: 'coughing up blood', reason: 'Haemoptysis — exclude malignancy / PE / TB' },
  { term: 'vomiting blood', reason: 'Upper GI bleed — urgent assessment' },
  { term: 'hematemesis', reason: 'Upper GI bleed — urgent assessment' },
  { term: 'haematemesis', reason: 'Upper GI bleed — urgent assessment' },
  { term: 'melaena', reason: 'Lower GI bleed — urgent assessment' },
  { term: 'silent chest', reason: 'Life-threatening asthma' },
  { term: 'cyanosis', reason: 'Hypoxia — emergency' },
  { term: 'stridor', reason: 'Upper airway obstruction — emergency' },
  { term: 'drooling', reason: 'Possible epiglottitis — do not examine throat' },
  { term: 'facial droop', reason: 'Possible stroke — time-critical' },
  { term: 'slurred speech', reason: 'Possible stroke — time-critical' },
  { term: 'unilateral weakness', reason: 'Possible stroke — time-critical' },
  { term: 'severe abdominal pain', reason: 'Possible surgical abdomen' },
  { term: 'rigid abdomen', reason: 'Possible peritonitis' },
  { term: 'testicular torsion', reason: 'Surgical emergency' },
  { term: 'sudden severe testicular pain', reason: 'Surgical emergency' },
]

/* ------------------------------------------------------------------ *
 * Matching helpers
 * ------------------------------------------------------------------ */

const NEGATION_CUES = [
  'no',
  'not',
  'non',
  'nil',
  'denies',
  'deny',
  'denied',
  'without',
  'negative for',
  'free of',
  'absent',
  'never',
  'no evidence of',
  'no history of',
  'no signs of',
  'no significant',
  'no obvious',
  'resolution of',
  'resolved',
]

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildPatternRegex(pattern: string): RegExp {
  const escaped = escapeRegExp(pattern)
  const startsWord = /^[a-z0-9]/i.test(pattern)
  const endsWord = /[a-z0-9]$/i.test(pattern)
  return new RegExp(
    `${startsWord ? '\\b' : ''}${escaped}${endsWord ? '\\b' : ''}`,
    'gi'
  )
}

/** Is a match at `index` negated by a cue in the preceding ~34 characters? */
function isNegated(text: string, index: number): boolean {
  const windowStart = Math.max(0, index - 34)
  const before = text.slice(windowStart, index).toLowerCase()
  return NEGATION_CUES.some((cue) => {
    const re = new RegExp(`(?:^|[^a-z])${escapeRegExp(cue)}(?:$|[^a-z])`)
    return re.test(before)
  })
}

function prettySnippet(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 24)
  const end = Math.min(text.length, index + length + 24)
  let snip = text.slice(start, end).replace(/\s+/g, ' ').trim()
  if (start > 0) snip = '…' + snip
  if (end < text.length) snip = snip + '…'
  return snip
}

/* ------------------------------------------------------------------ *
 * Vitals parsing
 * ------------------------------------------------------------------ */

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined
  const m = String(v).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
  return m ? parseFloat(m[0]) : undefined
}

export function parseVitals(v: Vitals = {}): Record<string, number> {
  const out: Record<string, number> = {}
  let sys = num(v.bpSystolic)
  let dia = num(v.bpDiastolic)
  if ((sys === undefined || dia === undefined) && v.bp !== undefined) {
    const m = String(v.bp).match(/(\d+)\s*\/\s*(\d+)/)
    if (m) {
      sys = sys ?? parseInt(m[1], 10)
      dia = dia ?? parseInt(m[2], 10)
    }
  }
  const t = num(v.temperature)
  const p = num(v.pulse)
  const rr = num(v.respiratoryRate)
  const spo2 = num(v.spo2)
  if (t !== undefined) out.temperature = t
  if (p !== undefined) out.pulse = p
  if (rr !== undefined) out.respiratoryRate = rr
  if (sys !== undefined) out.bpSystolic = sys
  if (dia !== undefined) out.bpDiastolic = dia
  if (spo2 !== undefined) out.spo2 = spo2
  return out
}

function featuresFromVitals(vitals: Record<string, number>): DetectedFeature[] {
  const out: DetectedFeature[] = []
  const add = (id: string, label: string, ev: string) =>
    out.push({ id, label, category: 'vital', evidence: ev })

  if (vitals.temperature !== undefined) {
    if (vitals.temperature >= 39)
      add('high_fever', 'High fever', `Temperature ${vitals.temperature}°C`)
    else if (vitals.temperature >= 38)
      add('fever', 'Fever', `Temperature ${vitals.temperature}°C`)
    else if (vitals.temperature <= 35.5)
      add('hypothermia', 'Hypothermia', `Temperature ${vitals.temperature}°C`)
    else add('afebrile', 'Afebrile', `Temperature ${vitals.temperature}°C`)
  }
  if (vitals.pulse !== undefined) {
    if (vitals.pulse > 100) add('tachycardia', 'Tachycardia', `Pulse ${vitals.pulse} bpm`)
    if (vitals.pulse >= 130) add('marked_tachycardia', 'Marked tachycardia', `Pulse ${vitals.pulse} bpm`)
    if (vitals.pulse < 60) add('bradycardia', 'Bradycardia', `Pulse ${vitals.pulse} bpm`)
  }
  if (vitals.respiratoryRate !== undefined) {
    if (vitals.respiratoryRate >= 24)
      add('tachypnoea', 'Tachypnoea', `Respiratory rate ${vitals.respiratoryRate}/min`)
    if (vitals.respiratoryRate >= 30)
      add('marked_tachypnoea', 'Marked tachypnoea', `Respiratory rate ${vitals.respiratoryRate}/min`)
  }
  if (vitals.spo2 !== undefined) {
    if (vitals.spo2 < 92) add('hypoxia_severe', 'Significant hypoxia', `SpO₂ ${vitals.spo2}%`)
    else if (vitals.spo2 < 95) add('hypoxia', 'Hypoxia', `SpO₂ ${vitals.spo2}%`)
  }
  if (vitals.bpSystolic !== undefined && vitals.bpSystolic < 90)
    add('hypotension', 'Hypotension', `BP systolic ${vitals.bpSystolic} mmHg`)
  return out
}

/* ------------------------------------------------------------------ *
 * Main extraction
 * ------------------------------------------------------------------ */

const FIELD_JOINERS: [keyof ConsultationInput, string][] = [
  ['reasonForVisit', 'Reason for visit'],
  ['chiefProblems', 'Chief problems'],
  ['history', 'History'],
  ['pastMedicalHistory', 'Past medical history'],
  ['medications', 'Medications'],
  ['allergies', 'Allergies'],
  ['socialHistory', 'Social history'],
  ['examination', 'Examination'],
  ['investigations', 'Investigations'],
  ['problemDescription', 'Problem description'],
  ['notes', 'Notes'],
]

export function extractFeatures(input: ConsultationInput): ExtractionResult {
  // Build a single searchable text block (keeps section labels for context)
  const parts: string[] = []
  for (const [key, label] of FIELD_JOINERS) {
    const val = input[key]
    if (val) parts.push(`${label}: ${String(val)}`)
  }
  if (input.duration) parts.push(`Duration: ${input.duration}`)
  const text = parts.join('\n')

  const found = new Map<string, DetectedFeature>()
  const negated: string[] = []

  for (const def of FEATURES) {
    let positive: DetectedFeature | null = null
    let sawNegated = false
    for (const pattern of def.patterns) {
      const re = buildPatternRegex(pattern)
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) !== null) {
        if (isNegated(text, m.index)) {
          sawNegated = true
          continue
        }
        if (!positive) {
          positive = {
            id: def.id,
            label: def.label,
            category: def.category,
            evidence: prettySnippet(text, m.index, m[0].length),
          }
        }
        if (m.index === re.lastIndex) re.lastIndex++
      }
      if (positive) break
    }
    if (positive) found.set(def.id, positive)
    else if (sawNegated) negated.push(def.id)
  }

  // Vital-sign derived features
  const vitals = parseVitals(input.vitals ?? {})
  for (const f of featuresFromVitals(vitals)) if (!found.has(f.id)) found.set(f.id, f)

  // Age / sex derived hints
  const ageNum = num(input.age)
  if (ageNum !== undefined) {
    if (ageNum < 2 && !found.has('infant'))
      found.set('infant', { id: 'infant', label: 'Infant', category: 'age', evidence: `Age ${ageNum}` })
    else if (ageNum < 16 && !found.has('child'))
      found.set('child', { id: 'child', label: 'Child', category: 'age', evidence: `Age ${ageNum}` })
    else if (ageNum >= 65 && !found.has('elderly'))
      found.set('elderly', { id: 'elderly', label: 'Elderly', category: 'age', evidence: `Age ${ageNum}` })
  }
  const sexLower = (input.sex || '').toLowerCase()
  if (sexLower.startsWith('f') && !found.has('pregnancy_possible'))
    found.set('female', { id: 'female', label: 'Female', category: 'age', evidence: 'Sex: female' })
  if (sexLower.startsWith('m'))
    found.set('male', { id: 'male', label: 'Male', category: 'age', evidence: 'Sex: male' })

  // Red-flag term scan
  const lower = text.toLowerCase()
  const redFlagTerms = RED_FLAG_TERMS.filter((r) => lower.includes(r.term)).map((r) => r.term)

  const features = [...found.values()]
  return {
    features,
    featureIds: features.map((f) => f.id),
    negated,
    vitals,
    redFlagTerms,
  }
}

export function hasFeature(res: ExtractionResult, id: string): boolean {
  return res.featureIds.includes(id)
}
