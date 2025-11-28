/**
 * UI Options and Labels in French
 * For dropdowns, selects, and form fields
 */

// Age ranges
export const AGE_RANGE_OPTIONS = [
  { value: '18-30', label: '18-30 ans' },
  { value: '31-45', label: '31-45 ans' },
  { value: '46-60', label: '46-60 ans' },
  { value: '61-75', label: '61-75 ans' },
  { value: '75+', label: '75 ans et plus' },
] as const

// Sex
export const SEX_OPTIONS = [
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
  { value: 'other', label: 'Autre' },
] as const

// General health
export const GENERAL_HEALTH_OPTIONS = [
  { value: 'healthy', label: 'Bonne santé' },
  { value: 'compromised', label: 'Santé compromise' },
  { value: 'severely_compromised', label: 'Santé sévèrement compromise' },
] as const

// ASA Classification
export const ASA_OPTIONS = [
  { value: 'I', label: 'ASA I - Patient en bonne santé' },
  { value: 'II', label: 'ASA II - Maladie systémique légère' },
  { value: 'III', label: 'ASA III - Maladie systémique sévère' },
  { value: 'IV', label: 'ASA IV - Maladie systémique menaçant le pronostic vital' },
  { value: 'V', label: 'ASA V - Patient moribond' },
  { value: 'VI', label: 'ASA VI - Patient en mort cérébrale' },
] as const

// Severity
export const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Légère' },
  { value: 'moderate', label: 'Modérée' },
  { value: 'severe', label: 'Sévère' },
] as const

// Prognosis
export const PROGNOSIS_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Bon' },
  { value: 'fair', label: 'Réservé' },
  { value: 'questionable', label: 'Questionnable' },
  { value: 'hopeless', label: 'Sans espoir' },
] as const

// Mobility grades
export const MOBILITY_OPTIONS = [
  { value: '0', label: 'Grade 0 - Mobilité physiologique' },
  { value: '1', label: 'Grade 1 - Mobilité légère (<1mm)' },
  { value: '2', label: 'Grade 2 - Mobilité modérée (>1mm)' },
  { value: '3', label: 'Grade 3 - Mobilité sévère (axiale)' },
] as const

// Furcation grades
export const FURCATION_OPTIONS = [
  { value: '0', label: 'Grade 0 - Pas d\'atteinte' },
  { value: 'I', label: 'Grade I - <1/3 de la largeur' },
  { value: 'II', label: 'Grade II - >1/3 sans traversée' },
  { value: 'III', label: 'Grade III - Atteinte transfixiante' },
] as const

// Oral hygiene
export const ORAL_HYGIENE_OPTIONS = [
  { value: 'excellent', label: 'Excellente' },
  { value: 'good', label: 'Bonne' },
  { value: 'fair', label: 'Moyenne' },
  { value: 'poor', label: 'Mauvaise' },
] as const

// Compliance
export const COMPLIANCE_OPTIONS = [
  { value: 'high', label: 'Élevée' },
  { value: 'moderate', label: 'Modérée' },
  { value: 'low', label: 'Faible' },
] as const

// Anxiety level
export const ANXIETY_OPTIONS = [
  { value: 'none', label: 'Aucune' },
  { value: 'mild', label: 'Légère' },
  { value: 'moderate', label: 'Modérée' },
  { value: 'severe', label: 'Sévère' },
] as const

// Priority level
export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Faible' },
  { value: 'moderate', label: 'Modérée' },
  { value: 'high', label: 'Élevée' },
] as const

// Complexity
export const COMPLEXITY_OPTIONS = [
  { value: 'simple', label: 'Simple' },
  { value: 'moderate', label: 'Modéré' },
  { value: 'complex', label: 'Complexe' },
  { value: 'highly_complex', label: 'Très complexe' },
] as const

// Periodontal stages
export const PERIO_STAGE_OPTIONS = [
  { value: 'I', label: 'Stade I - Initial' },
  { value: 'II', label: 'Stade II - Modéré' },
  { value: 'III', label: 'Stade III - Sévère' },
  { value: 'IV', label: 'Stade IV - Avancé' },
] as const

// Periodontal grades
export const PERIO_GRADE_OPTIONS = [
  { value: 'A', label: 'Grade A - Progression lente' },
  { value: 'B', label: 'Grade B - Progression modérée' },
  { value: 'C', label: 'Grade C - Progression rapide' },
] as const

// Periodontal stability
export const PERIO_STABILITY_OPTIONS = [
  { value: 'stable', label: 'Stable' },
  { value: 'unstable', label: 'Instable' },
] as const

// Appointment types
export const APPOINTMENT_TYPE_OPTIONS = [
  { value: 'emergency', label: 'Urgence' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'treatment', label: 'Traitement' },
  { value: 'review', label: 'Contrôle' },
  { value: 'maintenance', label: 'Maintenance' },
] as const

// Delay units
export const DELAY_UNIT_OPTIONS = [
  { value: 'days', label: 'jours' },
  { value: 'weeks', label: 'semaines' },
  { value: 'months', label: 'mois' },
] as const

// Confidence levels
export const CONFIDENCE_OPTIONS = [
  { value: 'high', label: 'Élevée' },
  { value: 'moderate', label: 'Modérée' },
  { value: 'low', label: 'Faible' },
] as const

// Case status
export const CASE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' },
] as const

// Sequence status
export const SEQUENCE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'submitted', label: 'Soumis' },
  { value: 'under_review', label: 'En évaluation' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'needs_revision', label: 'À réviser' },
] as const

// Common medical conditions
export const MEDICAL_CONDITIONS = [
  { id: 'diabetes_type_1', name: 'Diabète type 1' },
  { id: 'diabetes_type_2', name: 'Diabète type 2' },
  { id: 'hypertension', name: 'Hypertension' },
  { id: 'heart_disease', name: 'Maladie cardiaque' },
  { id: 'arrhythmia', name: 'Arythmie' },
  { id: 'pacemaker', name: 'Pacemaker' },
  { id: 'anticoagulant_therapy', name: 'Traitement anticoagulant' },
  { id: 'antiplatelet_therapy', name: 'Traitement antiplaquettaire' },
  { id: 'bisphosphonate_therapy', name: 'Traitement bisphosphonates' },
  { id: 'immunosuppression', name: 'Immunosuppression' },
  { id: 'chemotherapy', name: 'Chimiothérapie' },
  { id: 'radiotherapy_head_neck', name: 'Radiothérapie tête/cou' },
  { id: 'osteoporosis', name: 'Ostéoporose' },
  { id: 'kidney_disease', name: 'Maladie rénale' },
  { id: 'liver_disease', name: 'Maladie hépatique' },
  { id: 'respiratory_disease', name: 'Maladie respiratoire' },
  { id: 'asthma', name: 'Asthme' },
  { id: 'epilepsy', name: 'Épilepsie' },
  { id: 'pregnancy', name: 'Grossesse' },
  { id: 'hiv_aids', name: 'VIH/SIDA' },
  { id: 'hepatitis_b', name: 'Hépatite B' },
  { id: 'hepatitis_c', name: 'Hépatite C' },
  { id: 'thyroid_disorder', name: 'Trouble thyroïdien' },
  { id: 'psychiatric_disorder', name: 'Trouble psychiatrique' },
  { id: 'substance_abuse', name: 'Addiction' },
  { id: 'smoking', name: 'Tabagisme' },
  { id: 'other', name: 'Autre' },
] as const

// Common allergies
export const COMMON_ALLERGIES = [
  { id: 'penicillin', name: 'Pénicilline' },
  { id: 'amoxicillin', name: 'Amoxicilline' },
  { id: 'nsaids', name: 'AINS' },
  { id: 'aspirin', name: 'Aspirine' },
  { id: 'latex', name: 'Latex' },
  { id: 'iodine', name: 'Iode' },
  { id: 'local_anesthetic', name: 'Anesthésique local' },
  { id: 'codeine', name: 'Codéine' },
  { id: 'sulfonamides', name: 'Sulfamides' },
  { id: 'other', name: 'Autre' },
] as const

// Treatment goals
export const TREATMENT_GOALS = [
  { id: 'eliminate_pain', name: 'Éliminer la douleur' },
  { id: 'eliminate_infection', name: 'Éliminer l\'infection' },
  { id: 'restore_function', name: 'Restaurer la fonction' },
  { id: 'restore_aesthetics', name: 'Restaurer l\'esthétique' },
  { id: 'prevent_progression', name: 'Prévenir la progression' },
  { id: 'stabilize_periodontal', name: 'Stabiliser le parodonte' },
  { id: 'replace_missing_teeth', name: 'Remplacer les dents manquantes' },
  { id: 'improve_oral_hygiene', name: 'Améliorer l\'hygiène orale' },
  { id: 'long_term_maintenance', name: 'Maintenance long terme' },
] as const
