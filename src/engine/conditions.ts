/**
 * Condition library — a primary-care oriented probabilistic model.
 *
 * Each condition defines supporting features (weight > 0) and features that
 * argue against it (weight < 0). Only non-zero weights are listed.
 *
 * The library is intentionally editable data: clinicians can tune weights
 * without touching engine code.
 */

export interface ConditionDef {
  id: string
  name: string
  category: string
  /** Chapter ids (from the Symptom Sorter knowledge base) this condition maps to. */
  chapters?: number[]
  /** featureId -> weight. */
  features: Record<string, number>
  urgency?: 'routine' | 'same-day' | 'urgent' | 'emergency'
}

export const CONDITIONS: ConditionDef[] = [
  /* --------------------------- RESPIRATORY --------------------------- */
  {
    id: 'viral_urti',
    name: 'Viral upper respiratory tract infection (common cold)',
    category: 'Respiratory',
    chapters: [115, 341, 356, 350],
    features: {
      runny_nose: 2.2, nasal_congestion: 1.6, sneezing: 1.6, sore_throat: 2.0,
      coryza: 2.4, cough: 1.4, dry_cough: 1.0, fever: 0.6, malaise: 0.6,
      fatigue: 0.5, headache: 0.5, exam_pharyngeal_redness: 0.4,
      exam_crackles_focal: -2.0, exam_wheeze: -0.8, sob: -0.4,
      sputum_purulent: -0.6, high_fever: -0.6, lymphadenopathy: -0.2,
    },
    urgency: 'routine',
  },
  {
    id: 'influenza',
    name: 'Influenza',
    category: 'Respiratory',
    chapters: [221, 115],
    features: {
      high_fever: 1.8, fever: 1.6, chills: 1.8, body_aches: 2.0, malaise: 1.2,
      headache: 1.2, dry_cough: 1.6, sore_throat: 0.9, fatigue: 1.0,
      cough: 0.8, influenza_positive: 6.0, tachycardia: 0.4,
      runny_nose: 0.4, sputum_purulent: -0.4, exam_crackles_focal: -1.2,
      crp_high: 0.3, contact_sick: 1.0,
    },
    urgency: 'routine',
  },
  {
    id: 'covid19',
    name: 'COVID-19',
    category: 'Respiratory',
    chapters: [221, 115],
    features: {
      fever: 1.2, dry_cough: 1.6, fatigue: 1.2, sore_throat: 0.8, headache: 0.8,
      anosmia: 3.0, sob: 0.8, body_aches: 0.8, covid_positive: 6.0,
      chills: 0.6, sneezing: -0.3,
    },
    urgency: 'routine',
  },
  {
    id: 'acute_bronchitis',
    name: 'Acute bronchitis',
    category: 'Respiratory',
    chapters: [115, 118],
    features: {
      cough: 2.4, productive_cough: 2.0, sputum_clear: 1.6, sputum_purulent: 0.8,
      sore_throat: 0.8, chest_pain: 0.5, wheeze: 0.8, runny_nose: 0.5,
      exam_wheeze: 1.4, exam_crackles_focal: -1.0, xray_normal: 0.6,
      sob: 0.6, fever: 0.4, crp_mild: 0.4, nocturnal_cough: 0.4,
      dry_cough: -0.4, cough_barking: -0.4,
    },
    urgency: 'routine',
  },
  {
    id: 'community_pneumonia',
    name: 'Community-acquired pneumonia',
    category: 'Respiratory',
    chapters: [115, 106, 218],
    features: {
      fever: 1.6, high_fever: 1.4, productive_cough: 1.8, sputum_purulent: 1.6,
      pleuritic_chest_pain: 1.8, chest_pain: 1.0, sob: 1.4, tachypnoea: 1.4,
      exam_crackles_focal: 3.0, exam_dullness: 1.4, exam_reduced_air_entry: 1.2,
      xray_consolidation: 4.5, wbc_high: 1.2, neutrophilia: 1.0, crp_high: 1.2,
      chills: 0.8, hypoxia: 1.2, hypoxia_severe: 1.4, cough: 1.0, fatigue: 0.5,
      sputum_clear: -1.0, xray_normal: -2.5, exam_wheeze: 0.2,
    },
    urgency: 'same-day',
  },
  {
    id: 'asthma_exacerbation',
    name: 'Asthma / acute asthma exacerbation',
    category: 'Respiratory',
    chapters: [106, 112, 115],
    features: {
      wheeze: 2.6, exam_wheeze: 3.0, sob: 2.0, chest_tightness: 2.0,
      dry_cough: 1.2, nocturnal_cough: 1.6, exercise_induced: 2.0,
      asthma_hx: 3.4, allergy_hx: 0.8, exam_reduced_air_entry: 1.0,
      tachypnoea: 1.0, tachycardia: 0.8, cough: 0.8, hypoxia: 1.2,
      xray_normal: 0.8, sob_exertional: 1.0,
      exam_crackles_focal: -1.5, fever: -0.6, sputum_purulent: -0.5,
      xray_consolidation: -2.0,
    },
    urgency: 'urgent',
  },
  {
    id: 'copd_exacerbation',
    name: 'COPD / infective exacerbation of COPD',
    category: 'Respiratory',
    chapters: [115, 112],
    features: {
      copd_hx: 3.6, smoker: 2.2, former_smoker: 1.6, productive_cough: 1.6,
      sputum_purulent: 1.4, sob: 2.0, wheeze: 1.6, exam_wheeze: 1.8,
      exam_reduced_air_entry: 1.4, chronic_cough: 1.4, cough: 1.0,
      tachypnoea: 1.0, hypoxia: 1.2, sob_exertional: 1.2, fever: 0.4,
      asthma_hx: -0.4,
    },
    urgency: 'urgent',
  },
  {
    id: 'pulmonary_embolism',
    name: 'Pulmonary embolism',
    category: 'Respiratory',
    chapters: [106, 109, 112],
    features: {
      sob_sudden: 2.6, sob: 2.0, pleuritic_chest_pain: 1.8, chest_pain: 1.0,
      tachycardia: 2.0, marked_tachycardia: 1.2, palpitations: 1.0,
      hypoxia: 2.0, hypoxia_severe: 1.4, immobility: 2.8, unilateral_leg_swelling: 3.0,
      exam_calf_swelling: 3.0, exam_calf_tenderness: 2.4, tachypnoea: 1.6,
      leg_pain: 1.0, anxiety_feeling: 0.5, d_dimer_high: 3.0, ct_pe: 6.0,
      ecg_sinus_tachycardia: 0.8, xray_normal: 0.4,
      fever: -0.6, sputum_purulent: -1.2, exam_crackles_focal: -1.0, cough: -0.2,
    },
    urgency: 'emergency',
  },
  {
    id: 'pneumothorax',
    name: 'Pneumothorax',
    category: 'Respiratory',
    chapters: [106],
    features: {
      sob_sudden: 2.8, pleuritic_chest_pain: 2.2, chest_pain: 1.2, sob: 1.6,
      exam_reduced_air_entry: 2.4, exam_reduced_chest_expansion: 2.2,
      tachypnoea: 1.0, tachycardia: 0.8, hypoxia: 1.0, smoker: 1.0,
      cough: 0.3, wheeze: -0.4,
    },
    urgency: 'emergency',
  },
  {
    id: 'lung_malignancy',
    name: 'Lung malignancy / bronchogenic carcinoma',
    category: 'Respiratory',
    chapters: [115, 121, 239],
    features: {
      chronic_cough: 1.8, haemoptysis: 3.4, weight_loss: 2.6, smoker: 2.4,
      sob: 1.0, chest_pain: 0.8, hoarseness: 2.0, night_sweats: 1.4,
      loss_of_appetite: 1.4, fatigue: 1.2, lymphadenopathy: 1.0,
      exam_reduced_air_entry: 0.6,
      fever: -0.4, sore_throat: -0.8, coryza: -1.0, influenza_positive: -1.5,
    },
    urgency: 'urgent',
  },
  {
    id: 'tuberculosis',
    name: 'Pulmonary tuberculosis',
    category: 'Respiratory',
    chapters: [221, 115, 239],
    features: {
      chronic_cough: 2.0, night_sweats: 2.6, weight_loss: 2.2, fever: 1.2,
      haemoptysis: 2.0, fatigue: 1.2, loss_of_appetite: 1.2, productive_cough: 1.0,
      lymphadenopathy: 1.0, sob: 0.6, recent_travel: 1.2, immunocompromised: 1.8,
      chest_pain: 0.6, coryza: -1.0, sneezing: -1.0, influenza_positive: -2.0,
    },
    urgency: 'urgent',
  },
  {
    id: 'gerd',
    name: 'Gastro-oesophageal reflux disease (GORD)',
    category: 'Gastrointestinal',
    chapters: [30, 115, 332],
    features: {
      reflux: 3.6, epigastric_pain: 2.0, chest_pain: 1.0, nausea: 0.8,
      dry_cough: 0.7, chronic_cough: 1.0, hoarseness: 1.4, chest_tightness: 0.4,
    },
    urgency: 'routine',
  },
  {
    id: 'acute_coronary_syndrome',
    name: 'Acute coronary syndrome (angina / myocardial infarction)',
    category: 'Cardiovascular',
    chapters: [109, 106],
    features: {
      central_chest_pain: 3.0, chest_pain: 1.8, chest_tightness: 1.6,
      sob: 1.0, palpitations: 0.8, nausea: 0.6, syncope: 1.0,
      diabetes_hx: 1.0, smoker: 1.2, cardiac_hx: 2.0,
      ecg_ischaemia: 4.0, troponin_high: 5.0, hypotension: 1.2,
      pleuritic_chest_pain: -1.6, fever: -0.6, exam_crackles_focal: -0.6,
      xray_consolidation: -1.2,
    },
    urgency: 'emergency',
  },
  {
    id: 'heart_failure',
    name: 'Heart failure / acute LVF',
    category: 'Cardiovascular',
    chapters: [112, 106, 324],
    features: {
      orthopnoea: 3.0, pnd: 3.0, ankle_swelling: 2.6, sob: 2.0,
      sob_exertional: 1.8, cardiac_hx: 2.2, fatigue: 1.0, exam_crackles_general: 2.4,
      exam_reduced_air_entry: 0.6, tachycardia: 0.8, cough: 0.4,
      wheeze: 0.4, hypoxia: 0.8, elderly: 0.8,
    },
    urgency: 'urgent',
  },
  {
    id: 'hypertensive_urgency',
    name: 'Hypertension (uncontrolled) / hypertensive urgency',
    category: 'Cardiovascular',
    chapters: [89, 96],
    features: {
      headache: 1.4, dizziness: 1.2, palpitations: 1.0, visual_disturbance: 1.2,
      syncope: 0.6, anxiety_feeling: 0.4,
    },
    urgency: 'same-day',
  },
  {
    id: 'atrial_fibrillation',
    name: 'Atrial fibrillation / arrhythmia',
    category: 'Cardiovascular',
    chapters: [124, 83],
    features: {
      palpitations: 2.8, syncope: 1.2, dizziness: 1.4, sob: 1.0,
      fatigue: 1.0, chest_pain: 0.6, cardiac_hx: 1.6, elderly: 1.2,
    },
    urgency: 'same-day',
  },

  /* --------------------------- INFECTIOUS / SYSTEMIC --------------------------- */
  {
    id: 'gastroenteritis',
    name: 'Acute gastroenteritis',
    category: 'Gastrointestinal',
    chapters: [24, 27, 9],
    features: {
      diarrhoea: 3.0, vomiting: 2.4, nausea: 1.6, abdominal_pain: 1.2,
      fever: 0.6, contact_sick: 1.6, exam_tender_abdomen: 0.6,
      dehydration: 0.8, weight_loss: 0.3,
      constipation: -2.0, rectal_bleeding: -1.0, exam_guarding: -2.0,
    },
    urgency: 'routine',
  },
  {
    id: 'urinary_tract_infection',
    name: 'Urinary tract infection',
    category: 'Genitourinary',
    chapters: [432, 435, 444],
    features: {
      dysuria: 3.2, urinary_frequency: 2.6, urinary_urgency: 2.2, haematuria: 1.4,
      pelvic_pain: 1.2, fever: 0.6, flare_pain: 1.0,
      confusion: 0.8, elderly: 0.8, urine_nitrite: 4.0, nausea: 0.6,
      vomiting: 0.6, vaginal_discharge: -1.0, weight_loss: -0.6,
    },
    urgency: 'same-day',
  },
  {
    id: 'pyelonephritis',
    name: 'Acute pyelonephritis',
    category: 'Genitourinary',
    chapters: [432, 444, 33],
    features: {
      flare_pain: 3.0, fever: 1.6, high_fever: 1.4, chills: 1.8, dysuria: 1.2,
      urinary_frequency: 1.0, nausea: 1.0, vomiting: 1.0, haematuria: 0.8,
      urine_nitrite: 2.4, tachycardia: 0.8, exam_tender_abdomen: 0.6,
      hypotension: 0.8, wbc_high: 1.2, crp_high: 1.0,
    },
    urgency: 'urgent',
  },
  {
    id: 'infective_endocarditis',
    name: 'Infective endocarditis',
    category: 'Cardiovascular',
    chapters: [221, 194],
    features: {
      fever: 1.6, night_sweats: 1.4, weight_loss: 1.2, fatigue: 1.2,
      cardiac_hx: 2.0, smoker: 0.4, malaise: 1.0,
    },
    urgency: 'urgent',
  },
  {
    id: 'sepsis',
    name: 'Sepsis / systemic infection',
    category: 'Infectious',
    chapters: [221, 200],
    features: {
      fever: 1.6, high_fever: 1.4, tachycardia: 1.6, marked_tachycardia: 1.4,
      tachypnoea: 1.4, hypotension: 2.4, confusion: 1.6, malaise: 1.4,
      chills: 1.4, exam_cyanosis: 1.0, dehydration: 1.0,
      non_blanching_rash: 2.4, exam_distress: 1.0, elderly: 0.8, infant: 1.2,
    },
    urgency: 'emergency',
  },
  {
    id: 'meningitis',
    name: 'Meningitis / meningococcal disease',
    category: 'Neurological',
    chapters: [89, 344],
    features: {
      neck_stiffness: 4.0, photophobia: 3.0, headache: 2.0, fever: 1.8,
      high_fever: 1.4, non_blanching_rash: 4.0, confusion: 1.6, vomiting: 1.0,
      seizure: 1.4, infant: 1.4, exam_pallor: 1.0, hypotension: 1.4,
      rash: 0.6, malaise: 0.6,
    },
    urgency: 'emergency',
  },
  {
    id: 'infectious_mononucleosis',
    name: 'Glandular fever (infectious mononucleosis)',
    category: 'Infectious',
    chapters: [341, 224],
    features: {
      sore_throat: 2.4, lymphadenopathy: 2.8, exam_lymphadenopathy: 2.0,
      fatigue: 2.0, fever: 1.2, malaise: 1.0, headache: 0.8,
      nausea: 0.4, exam_pharyngeal_redness: 1.0,
      cough: -0.6, coryza: -0.8, sneezing: -0.8,
    },
    urgency: 'routine',
  },
  {
    id: 'streptococcal_tonsillitis',
    name: 'Streptococcal tonsillitis / pharyngitis',
    category: 'ENT',
    chapters: [341],
    features: {
      sore_throat: 3.0, fever: 1.4, exam_pharyngeal_redness: 2.0,
      lymphadenopathy: 1.6, difficulty_swallowing: 1.4, headache: 0.6,
      exam_lymphadenopathy: 1.0,
      cough: -1.0, coryza: -0.8, sneezing: -1.0, hoarseness: -0.6, runny_nose: -0.8,
    },
    urgency: 'routine',
  },
  {
    id: 'peritonsillar_abscess',
    name: 'Quinsy (peritonsillar abscess)',
    category: 'ENT',
    chapters: [341],
    features: {
      sore_throat: 2.4, difficulty_swallowing: 2.6, drooling: 2.0,
      hoarseness: 1.2, fever: 1.2, exam_pharyngeal_redness: 2.0,
      lymphadenopathy: 1.2, neck_swelling: 1.0,
      dry_cough: -0.6, coryza: -1.0,
    },
    urgency: 'emergency',
  },
  {
    id: 'epiglottitis',
    name: 'Epiglottitis / acute upper airway obstruction',
    category: 'ENT',
    chapters: [341, 347],
    features: {
      difficulty_swallowing: 2.8, drooling: 3.0, stridor: 3.4,
      hoarseness: 1.4, fever: 1.2, neck_swelling: 1.0, exam_distress: 2.0,
      sore_throat: 1.6, cough: -0.6, coryza: -1.0,
    },
    urgency: 'emergency',
  },
  {
    id: 'croup',
    name: 'Croup (laryngotracheobronchitis)',
    category: 'Respiratory',
    chapters: [347, 118],
    features: {
      cough_barking: 4.0, stridor: 2.4, hoarseness: 2.0, child: 2.0,
      infant: 1.0, coryza: 0.8, fever: 0.6, nocturnal_cough: 1.2,
      exam_distress: 1.4, sob: 0.4,
    },
    urgency: 'urgent',
  },
  {
    id: 'bronchiolitis',
    name: 'Bronchiolitis',
    category: 'Respiratory',
    chapters: [118, 347],
    features: {
      infant: 3.0, sob: 1.8, wheeze: 1.8, exam_wheeze: 2.0,
      exam_crackles_general: 1.6, exam_distress: 1.2, cough: 1.4,
      coryza: 1.2, fever: 0.4, dehydration: 0.8, hypoxia: 1.2,
    },
    urgency: 'urgent',
  },
  {
    id: 'otitis_media',
    name: 'Acute otitis media',
    category: 'ENT',
    chapters: [131],
    features: {
      earache: 3.6, fever: 1.0, infant: 1.4, child: 1.6, malaise: 0.8,
      coryza: 0.8, cough: 0.4, exam_pharyngeal_redness: 0.4,
      lymphadenopathy: 0.4, headache: 0.4,
    },
    urgency: 'routine',
  },
  {
    id: 'acute_sinusitis',
    name: 'Acute rhinosinusitis',
    category: 'ENT',
    chapters: [356, 164],
    features: {
      facial_pain: 3.0, nasal_congestion: 2.2, runny_nose: 1.4, headache: 1.2,
      fever: 0.6, sore_throat: 0.4, anosmia: 1.2, cough: 0.6,
    },
    urgency: 'routine',
  },
  {
    id: 'allergic_rhinitis',
    name: 'Allergic rhinitis / hay fever',
    category: 'ENT',
    chapters: [356, 350],
    features: {
      sneezing: 2.6, runny_nose: 2.4, nasal_congestion: 2.0, itching: 1.6,
      allergy_hx: 2.4, fever: -1.4, sore_throat: -0.4, exam_pharyngeal_redness: -0.6,
    },
    urgency: 'routine',
  },

  /* --------------------------- GASTROINTESTINAL --------------------------- */
  {
    id: 'peptic_ulcer',
    name: 'Peptic ulcer disease / gastritis',
    category: 'Gastrointestinal',
    chapters: [30, 39],
    features: {
      epigastric_pain: 3.2, reflux: 1.4, nausea: 1.4, vomiting: 0.8,
      vomiting_blood: 2.0, weight_loss: 0.6, abdominal_pain: 1.0,
    },
    urgency: 'same-day',
  },
  {
    id: 'biliary_colic',
    name: 'Biliary colic / cholecystitis',
    category: 'Gastrointestinal',
    chapters: [9, 30, 215],
    features: {
      ruq_pain: 3.4, epigastric_pain: 2.0, nausea: 1.6, vomiting: 1.4,
      fever: 0.8, jaundice: 0.6, abdominal_pain: 1.2, exam_tender_abdomen: 1.0,
    },
    urgency: 'same-day',
  },
  {
    id: 'acute_appendicitis',
    name: 'Acute appendicitis',
    category: 'Gastrointestinal',
    chapters: [9, 12, 376],
    features: {
      rlq_pain: 3.8, abdominal_pain: 1.8, nausea: 1.4, vomiting: 1.4,
      fever: 1.0, loss_of_appetite: 1.4, exam_tender_abdomen: 1.6,
      exam_guarding: 2.0, wbc_high: 1.4, crp_high: 0.8, constipation: 0.4,
      diarrhoea: 0.2,
    },
    urgency: 'emergency',
  },
  {
    id: 'diverticulitis',
    name: 'Diverticulitis',
    category: 'Gastrointestinal',
    chapters: [9, 18, 24],
    features: {
      llq_pain: 3.2, abdominal_pain: 1.4, fever: 1.2, diarrhoea: 0.8,
      constipation: 0.6, rectal_bleeding: 0.8, exam_tender_abdomen: 1.4,
      nausea: 0.6, wbc_high: 1.2, crp_high: 0.8, elderly: 0.8,
    },
    urgency: 'urgent',
  },
  {
    id: 'renal_colic',
    name: 'Renal / ureteric colic (stones)',
    category: 'Genitourinary',
    chapters: [33, 9, 426],
    features: {
      flare_pain: 3.8, haematuria: 2.6, vomiting: 1.2, nausea: 1.4,
      abdominal_pain: 1.0, urinary_frequency: 0.8, dysuria: 0.8,
      fever: -0.6, exam_guarding: -1.0,
    },
    urgency: 'urgent',
  },
  {
    id: 'ibd',
    name: 'Inflammatory bowel disease (Crohn’s / ulcerative colitis)',
    category: 'Gastrointestinal',
    chapters: [24, 239],
    features: {
      diarrhoea: 1.8, rectal_bleeding: 1.6, abdominal_pain: 1.2, weight_loss: 1.8,
      fatigue: 1.4, fever: 0.6, bowel_habit_change: 1.4,
      joint_pain: 0.6, night_sweats: 0.6,
    },
    urgency: 'same-day',
  },
  {
    id: 'irritable_bowel_syndrome',
    name: 'Irritable bowel syndrome',
    category: 'Gastrointestinal',
    chapters: [18, 24],
    features: {
      abdominal_pain: 1.8, bloating: 1.8, bowel_habit_change: 1.6,
      diarrhoea: 1.2, constipation: 1.2, exam_tender_abdomen: 0.2,
      weight_loss: -1.2, rectal_bleeding: -1.6, fever: -1.2, night_sweats: -1.0,
    },
    urgency: 'routine',
  },
  {
    id: 'acute_bowel_obstruction',
    name: 'Intestinal obstruction',
    category: 'Gastrointestinal',
    chapters: [9, 6],
    features: {
      abdominal_pain: 2.0, vomiting: 2.2, constipation: 2.0, bloating: 2.0,
      exam_guarding: 1.4, exam_tender_abdomen: 1.2, dehydration: 1.0, elderly: 0.6,
    },
    urgency: 'emergency',
  },
  {
    id: 'upper_gi_bleed',
    name: 'Upper GI bleed',
    category: 'Gastrointestinal',
    chapters: [42, 39],
    features: {
      vomiting_blood: 5.0, epigastric_pain: 1.2, exam_pallor: 1.4,
      tachycardia: 1.4, hypotension: 1.6, dizziness: 1.0,
      syncope: 1.0, reflux: 0.6, nausea: 0.8,
    },
    urgency: 'emergency',
  },
  {
    id: 'acute_pancreatitis',
    name: 'Acute pancreatitis',
    category: 'Gastrointestinal',
    chapters: [9, 30],
    features: {
      epigastric_pain: 2.6, abdominal_pain: 1.6, vomiting: 2.0, nausea: 1.6,
      exam_tender_abdomen: 1.2, back_pain: 0.8, tachycardia: 0.8, fever: 0.4,
      wbc_high: 1.0,
    },
    urgency: 'emergency',
  },

  /* --------------------------- NEUROLOGICAL --------------------------- */
  {
    id: 'tension_headache',
    name: 'Tension-type headache',
    category: 'Neurological',
    chapters: [89],
    features: {
      headache: 2.6, anxiety_feeling: 1.4, stress: 1.2, fatigue: 0.8,
      neck_stiffness: 0.4,
      photophobia: -1.6, vomiting: -1.4, fever: -1.4,
      thunderclap_headache: -3.0, focal_deficit: -2.5, elderly: -0.4,
    },
    urgency: 'routine',
  },
  {
    id: 'migraine',
    name: 'Migraine',
    category: 'Neurological',
    chapters: [89],
    features: {
      headache: 2.4, photophobia: 2.6, nausea: 1.6, vomiting: 1.2,
      visual_disturbance: 1.8,
      neck_stiffness: -1.0, fever: -1.4, thunderclap_headache: -2.5,
    },
    urgency: 'routine',
  },
  {
    id: 'subarachnoid_haemorrhage',
    name: 'Subarachnoid haemorrhage',
    category: 'Neurological',
    chapters: [89],
    features: {
      thunderclap_headache: 5.0, headache: 2.0, vomiting: 1.4, neck_stiffness: 2.0,
      photophobia: 1.0, syncope: 1.4, confusion: 1.0, focal_deficit: 1.0,
      fever: -0.6,
    },
    urgency: 'emergency',
  },
  {
    id: 'stroke_tia',
    name: 'Stroke / transient ischaemic attack',
    category: 'Neurological',
    chapters: [218, 89],
    features: {
      focal_deficit: 4.5, confusion: 1.2, visual_disturbance: 1.0, headache: 0.4,
      syncope: 0.8, dizziness: 1.0, diabetes_hx: 0.8, cardiac_hx: 1.0,
      smoker: 0.8, elderly: 1.0,
    },
    urgency: 'emergency',
  },
  {
    id: 'vestibular_neuritis_labyrinthitis',
    name: 'Vestibular neuritis / labyrinthitis / BPPV',
    category: 'Neurological',
    chapters: [101, 83],
    features: {
      vertigo: 3.6, dizziness: 2.0, nausea: 1.4, vomiting: 1.0,
      earache: -0.6, focal_deficit: -2.0, headache: -0.8,
    },
    urgency: 'routine',
  },
  {
    id: 'benign_paroxysmal_vertigo',
    name: 'Benign paroxysmal positional vertigo',
    category: 'Neurological',
    chapters: [101],
    features: {
      vertigo: 3.4, dizziness: 1.6, nausea: 0.8,
      focal_deficit: -2.0,
    },
    urgency: 'routine',
  },
  {
    id: 'delirium',
    name: 'Delirium / acute confusional state',
    category: 'Neurological',
    chapters: [80, 98],
    features: {
      confusion: 3.6, elderly: 2.0, urinary_frequency: 0.6, fever: 0.8,
      medication_side_effect: 1.0, dehydration: 1.0, hypoxia: 1.0, memory_loss: 0.8,
    },
    urgency: 'urgent',
  },
  {
    id: 'dementia',
    name: 'Dementia / cognitive impairment',
    category: 'Neurological',
    chapters: [98],
    features: {
      memory_loss: 3.6, elderly: 1.6, confusion: 1.6,
      focal_deficit: -1.4, fever: -1.0,
    },
    urgency: 'routine',
  },

  /* --------------------------- MUSCULOSKELETAL --------------------------- */
  {
    id: 'viral_myalgia',
    name: 'Viral myalgia (non-specific viral illness)',
    category: 'Musculoskeletal',
    chapters: [315, 221],
    features: {
      body_aches: 2.8, muscle_tenderness: 2.0, fever: 1.2, fatigue: 1.2,
      headache: 0.8, malaise: 0.8, chills: 0.6,
    },
    urgency: 'routine',
  },
  {
    id: 'mechanical_back_pain',
    name: 'Mechanical / musculoskeletal back pain',
    category: 'Musculoskeletal',
    chapters: [185],
    features: {
      back_pain: 3.2, trauma: 1.4, muscle_tenderness: 1.0, elderly: 0.2,
      weight_loss: -1.4, fever: -1.4, cancer_hx: -1.6,
    },
    urgency: 'routine',
  },
  {
    id: 'sciatica',
    name: 'Sciatica / radiculopathy',
    category: 'Musculoskeletal',
    chapters: [185, 218],
    features: {
      back_pain: 2.4, numbness: 1.8, leg_pain: 2.0, weakness: 0.8,
    },
    urgency: 'same-day',
  },
  {
    id: 'osteoarthritis',
    name: 'Osteoarthritis',
    category: 'Musculoskeletal',
    chapters: [321, 312],
    features: {
      joint_pain: 2.4, morning_stiffness: 0.8, joint_swelling: 1.0,
      elderly: 1.4, exercise_induced: 0.8,
      fever: -1.6, joint_redness: -1.0,
    },
    urgency: 'routine',
  },
  {
    id: 'gout_pseudogout',
    name: 'Gout / pseudogout',
    category: 'Musculoskeletal',
    chapters: [288, 297],
    features: {
      joint_pain: 2.6, joint_swelling: 1.8, alcohol: 0.8, fever: 0.2,
    },
    urgency: 'routine',
  },
  {
    id: 'rheumatoid_arthritis',
    name: 'Rheumatoid arthritis / inflammatory polyarthritis',
    category: 'Musculoskeletal',
    chapters: [312, 300],
    features: {
      joint_pain: 2.2, joint_swelling: 2.0, morning_stiffness: 2.4,
      fatigue: 1.0, weight_loss: 0.4, fever: -0.6,
    },
    urgency: 'same-day',
  },
  {
    id: 'deep_vein_thrombosis',
    name: 'Deep vein thrombosis',
    category: 'Cardiovascular',
    chapters: [327, 294],
    features: {
      unilateral_leg_swelling: 3.6, exam_calf_swelling: 2.8, exam_calf_tenderness: 2.4,
      leg_pain: 2.0, immobility: 1.8, cancer_hx: 0.8, fever: -0.6,
    },
    urgency: 'same-day',
  },
  {
    id: 'cellulitis_erysipelas',
    name: 'Cellulitis / erysipelas',
    category: 'Skin',
    chapters: [306],
    features: {
      cellulitis_like: 3.6, fever: 1.2, leg_pain: 1.0, chills: 0.8,
      exam_rash: 1.4, unilateral_leg_swelling: 1.0, joint_pain: -0.6,
    },
    urgency: 'same-day',
  },

  /* --------------------------- GENITOURINARY / GYNAE --------------------------- */
  {
    id: 'acute_pelvic_inflammatory_disease',
    name: 'Pelvic inflammatory disease',
    category: 'Genitourinary',
    chapters: [376, 379],
    features: {
      pelvic_pain: 2.8, vaginal_discharge: 2.0, fever: 1.0, dysuria: 0.8,
      lower_abdominal: 1.4, wbc_high: 1.0, female: 1.0,
    },
    urgency: 'same-day',
  },
  {
    id: 'ectopic_pregnancy',
    name: 'Ectopic pregnancy',
    category: 'Genitourinary',
    chapters: [376, 386],
    features: {
      pelvic_pain: 2.6, amenorrhoea: 2.6, vaginal_bleeding: 2.4,
      pregnancy_possible: 2.4, dizziness: 1.2, syncope: 1.6,
      female: 1.2, lower_abdominal: 1.2,
    },
    urgency: 'emergency',
  },
  {
    id: 'abruptio_placenta',
    name: 'Placental abruption / pregnancy-related pain',
    category: 'Genitourinary',
    chapters: [15],
    features: {
      pregnancy_possible: 3.0, vaginal_bleeding: 2.4, abdominal_pain: 2.0,
      pelvic_pain: 1.6, female: 1.0, fever: -0.6,
    },
    urgency: 'emergency',
  },
  {
    id: 'bacterial_vaginosis',
    name: 'Bacterial vaginosis / vaginal infection',
    category: 'Genitourinary',
    chapters: [264],
    features: {
      vaginal_discharge: 3.4, itching: 1.0, dysuria: 0.4,
      pelvic_pain: -0.6, fever: -1.2, female: 1.0,
    },
    urgency: 'routine',
  },
  {
    id: 'testicular_torsion',
    name: 'Testicular torsion',
    category: 'Genitourinary',
    chapters: [262],
    features: {
      testicular_pain: 4.0, scrotal_swelling: 2.0, vomiting: 1.2,
      nausea: 1.0, abdominal_pain: 0.8, male: 1.2,
    },
    urgency: 'emergency',
  },
  {
    id: 'epididymo_orchitis',
    name: 'Epididymo-orchitis',
    category: 'Genitourinary',
    chapters: [262],
    features: {
      testicular_pain: 3.0, scrotal_swelling: 2.4, dysuria: 1.0,
      urinary_frequency: 0.6, fever: 0.8, male: 1.2,
    },
    urgency: 'same-day',
  },

  /* --------------------------- ENDOCRINE / OTHER --------------------------- */
  {
    id: 'type2_diabetes',
    name: 'Diabetes mellitus (new presentation)',
    category: 'Endocrine',
    chapters: [227, 239, 432],
    features: {
      polyuria_polydipsia: 3.6, urinary_frequency: 1.4, weight_loss: 1.4,
      fatigue: 1.4, visual_disturbance: 0.8, itching: 0.6,
    },
    urgency: 'same-day',
  },
  {
    id: 'hyperthyroidism',
    name: 'Hyperthyroidism / thyrotoxicosis',
    category: 'Endocrine',
    chapters: [194, 239, 233],
    features: {
      weight_loss: 2.2, palpitations: 1.8, tremor: 2.2, anxiety_feeling: 1.4,
      diarrhoea: 0.8, fatigue: 0.6, neck_swelling: 0.8, tachycardia: 1.2,
    },
    urgency: 'routine',
  },
  {
    id: 'hypothyroidism',
    name: 'Hypothyroidism',
    category: 'Endocrine',
    chapters: [230, 236],
    features: {
      fatigue: 2.4, weight_gain: 2.0, constipation: 1.2, bradycardia: 1.0,
    },
    urgency: 'routine',
  },
  {
    id: 'anaemia',
    name: 'Anaemia',
    category: 'Haematological',
    chapters: [230, 239],
    features: {
      fatigue: 2.6, sob_exertional: 1.6, dizziness: 1.2, palpitations: 1.2,
      exam_pallor: 2.4, headache: 0.8, weight_loss: 0.4, tachycardia: 0.8,
    },
    urgency: 'same-day',
  },
  {
    id: 'depression_anxiety',
    name: 'Depression / anxiety',
    category: 'Psychiatric',
    chapters: [203, 230, 92],
    features: {
      anxiety_feeling: 2.6, fatigue: 1.4, loss_of_appetite: 0.8, palpitations: 0.8,
      headache: 0.8, dizziness: 0.6, weight_loss: 0.4, chest_tightness: 0.6,
      fever: -1.2,
    },
    urgency: 'routine',
  },
  {
    id: 'hyperventilation_syndrome',
    name: 'Hyperventilation / panic attack',
    category: 'Psychiatric',
    chapters: [106, 203],
    features: {
      sob: 2.0, chest_tightness: 1.8, palpitations: 1.6, anxiety_feeling: 2.4,
      dizziness: 1.2, numbness: 1.2,
      hypoxia: -1.0, exam_wheeze: -1.0, fever: -1.0,
    },
    urgency: 'routine',
  },
  {
    id: 'pneumonia_child',
    name: 'Pneumonia (child)',
    category: 'Respiratory',
    chapters: [200, 118],
    features: {
      child: 2.4, infant: 0.6, fever: 1.6, high_fever: 1.2, cough: 1.4,
      tachypnoea: 1.8, exam_crackles_focal: 2.4, exam_distress: 1.6,
      xray_consolidation: 3.4, dehydration: 0.8, hypoxia: 1.2, malaise: 0.6,
    },
    urgency: 'urgent',
  },
  {
    id: 'febrile_child_focus',
    name: 'Febrile illness in child (fever without focus)',
    category: 'Infectious',
    chapters: [200],
    features: {
      child: 2.0, infant: 1.0, fever: 2.4, high_fever: 1.2, malaise: 1.0,
      fatigue: 0.8, dehydration: 0.8, non_blanching_rash: 2.0,
      exam_distress: 1.0, hypotension: 1.2, exam_pallor: 1.0,
    },
    urgency: 'same-day',
  },
]

export const CONDITION_BY_ID: Record<string, ConditionDef> = Object.fromEntries(
  CONDITIONS.map((c) => [c.id, c])
)
