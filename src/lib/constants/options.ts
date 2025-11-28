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
  { value: 'draft', label: 'Brouillon', description: 'En cours de création', color: 'secondary' },
  { value: 'pending_review', label: 'En attente', description: 'Soumis pour validation', color: 'default' },
  { value: 'approved', label: 'Approuvé', description: 'Validé et prêt', color: 'success' },
  { value: 'needs_revision', label: 'À réviser', description: 'Modifications requises', color: 'destructive' },
  { value: 'archived', label: 'Archivé', description: 'Plus utilisé', color: 'outline' },
] as const

// Sequence status
export const SEQUENCE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon', description: 'En cours de création', color: 'secondary' },
  { value: 'submitted', label: 'Soumis', description: 'Soumis pour validation', color: 'default' },
  { value: 'under_review', label: 'En évaluation', description: 'En cours de revue', color: 'default' },
  { value: 'approved', label: 'Approuvé', description: 'Validé', color: 'success' },
  { value: 'needs_revision', label: 'À réviser', description: 'Modifications requises', color: 'destructive' },
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

// ============================================
// DECISION CONTEXT - Patient Constraints
// ============================================

// Patient priority (what matters most to them)
export const PATIENT_PRIORITY_OPTIONS = [
  { value: 'function', label: 'Fonction masticatoire', description: 'Pouvoir manger normalement' },
  { value: 'aesthetics', label: 'Esthétique', description: 'Apparence du sourire' },
  { value: 'cost', label: 'Coût', description: 'Minimiser le budget' },
  { value: 'time', label: 'Temps', description: 'Minimiser le nombre de séances' },
  { value: 'durability', label: 'Durabilité', description: 'Solution long terme' },
  { value: 'minimal_intervention', label: 'Intervention minimale', description: 'Approche conservatrice' },
] as const

// Budget constraints
export const BUDGET_CONSTRAINT_OPTIONS = [
  { value: 'no_constraint', label: 'Pas de contrainte' },
  { value: 'moderate', label: 'Budget modéré', description: 'Préfère éviter les options les plus coûteuses' },
  { value: 'limited', label: 'Budget limité', description: 'Doit prioriser les traitements essentiels' },
  { value: 'very_limited', label: 'Budget très limité', description: 'Uniquement les urgences' },
] as const

// Time constraints
export const TIME_CONSTRAINT_OPTIONS = [
  { value: 'no_constraint', label: 'Pas de contrainte' },
  { value: 'moderate', label: 'Contrainte modérée', description: 'Disponibilité limitée' },
  { value: 'urgent', label: 'Urgent', description: 'Événement important à venir' },
  { value: 'very_urgent', label: 'Très urgent', description: 'Doit être terminé rapidement' },
] as const

// Dental anxiety level
export const DENTAL_ANXIETY_OPTIONS = [
  { value: 'none', label: 'Aucune anxiété' },
  { value: 'mild', label: 'Anxiété légère', description: 'Légèrement nerveux' },
  { value: 'moderate', label: 'Anxiété modérée', description: 'Nécessite rassurance' },
  { value: 'severe', label: 'Anxiété sévère', description: 'Phobie dentaire' },
] as const

// ============================================
// DECISION CONTEXT - Risk Factors
// ============================================

// Smoking status
export const SMOKING_STATUS_OPTIONS = [
  { value: 'never', label: 'Non-fumeur' },
  { value: 'former', label: 'Ancien fumeur', description: 'Arrêt > 1 an' },
  { value: 'current_light', label: 'Fumeur léger', description: '< 10 cigarettes/jour' },
  { value: 'current_moderate', label: 'Fumeur modéré', description: '10-20 cigarettes/jour' },
  { value: 'current_heavy', label: 'Gros fumeur', description: '> 20 cigarettes/jour' },
] as const

// Diabetes control
export const DIABETES_CONTROL_OPTIONS = [
  { value: 'none', label: 'Pas de diabète' },
  { value: 'well_controlled', label: 'Bien contrôlé', description: 'HbA1c < 7%' },
  { value: 'moderately_controlled', label: 'Modérément contrôlé', description: 'HbA1c 7-8%' },
  { value: 'poorly_controlled', label: 'Mal contrôlé', description: 'HbA1c > 8%' },
] as const

// Bruxism
export const BRUXISM_OPTIONS = [
  { value: 'none', label: 'Pas de bruxisme' },
  { value: 'suspected', label: 'Suspecté', description: 'Signes d\'usure' },
  { value: 'confirmed_night', label: 'Bruxisme nocturne', description: 'Confirmé' },
  { value: 'confirmed_day', label: 'Bruxisme diurne', description: 'Serrement' },
  { value: 'confirmed_both', label: 'Bruxisme mixte', description: 'Jour et nuit' },
  { value: 'treated', label: 'Traité', description: 'Gouttière portée' },
] as const

// Bleeding on probing
export const BOP_OPTIONS = [
  { value: 'less_10', label: '< 10%', description: 'Santé parodontale' },
  { value: '10_30', label: '10-30%', description: 'Inflammation légère' },
  { value: 'more_30', label: '> 30%', description: 'Inflammation active' },
] as const

// ============================================
// DECISION CONTEXT - Treatment Alternatives
// ============================================

// Reasons for rejecting an alternative treatment
export const REJECTION_REASON_OPTIONS = [
  { value: 'cost', label: 'Coût trop élevé' },
  { value: 'time', label: 'Durée de traitement trop longue' },
  { value: 'complexity', label: 'Trop complexe pour ce cas' },
  { value: 'patient_preference', label: 'Préférence du patient' },
  { value: 'contraindication', label: 'Contre-indication médicale' },
  { value: 'poor_prognosis', label: 'Pronostic défavorable' },
  { value: 'anatomical_limitation', label: 'Limitation anatomique' },
  { value: 'insufficient_bone', label: 'Volume osseux insuffisant' },
  { value: 'insufficient_space', label: 'Espace insuffisant' },
  { value: 'occlusal_issues', label: 'Problèmes occlusaux' },
  { value: 'periodontal_status', label: 'État parodontal incompatible' },
  { value: 'patient_compliance', label: 'Compliance patient insuffisante' },
  { value: 'temporary_solution_preferred', label: 'Solution temporaire préférée' },
  { value: 'more_conservative_available', label: 'Option plus conservatrice disponible' },
  { value: 'better_evidence', label: 'Meilleure évidence pour l\'alternative choisie' },
] as const

// ============================================
// DECISION CONTEXT - Sequencing Logic
// ============================================

// Why this treatment comes before another
export const SEQUENCING_REASON_OPTIONS = [
  { value: 'pain_relief_first', label: 'Soulagement douleur prioritaire' },
  { value: 'infection_control', label: 'Contrôle infection d\'abord' },
  { value: 'foundation_first', label: 'Base/fondation nécessaire' },
  { value: 'healing_required', label: 'Cicatrisation requise avant' },
  { value: 'perio_before_resto', label: 'Parodonte stable avant restauration' },
  { value: 'endo_before_crown', label: 'Traitement endodontique avant prothèse' },
  { value: 'extraction_before_implant', label: 'Extraction avant implant' },
  { value: 'bone_graft_integration', label: 'Intégration greffe osseuse' },
  { value: 'soft_tissue_healing', label: 'Cicatrisation tissus mous' },
  { value: 'occlusion_adjustment', label: 'Ajustement occlusal préalable' },
  { value: 'patient_adaptation', label: 'Adaptation progressive du patient' },
  { value: 'aesthetic_priority', label: 'Zone esthétique prioritaire' },
  { value: 'functional_priority', label: 'Restaurer fonction d\'abord' },
  { value: 'diagnostic_clarity', label: 'Clarifier diagnostic d\'abord' },
  { value: 'test_treatment', label: 'Tester avant traitement définitif' },
] as const

// ============================================
// DECISION CONTEXT - Delay Reasons (structured)
// ============================================

// Why wait between appointments
export const DELAY_REASON_OPTIONS = [
  { value: 'bone_healing', label: 'Cicatrisation osseuse', typical_weeks: 12 },
  { value: 'soft_tissue_healing', label: 'Cicatrisation tissus mous', typical_weeks: 2 },
  { value: 'implant_osseointegration', label: 'Ostéointégration implant', typical_weeks: 12 },
  { value: 'graft_maturation', label: 'Maturation greffe', typical_weeks: 16 },
  { value: 'root_canal_observation', label: 'Observation post-endo', typical_weeks: 4 },
  { value: 'perio_reevaluation', label: 'Réévaluation parodontale', typical_weeks: 6 },
  { value: 'provisional_test', label: 'Test provisoire', typical_weeks: 4 },
  { value: 'lab_fabrication', label: 'Fabrication laboratoire', typical_weeks: 2 },
  { value: 'patient_adaptation', label: 'Adaptation patient', typical_weeks: 2 },
  { value: 'inflammation_resolution', label: 'Résolution inflammation', typical_weeks: 2 },
  { value: 'extraction_socket_healing', label: 'Cicatrisation alvéole', typical_weeks: 8 },
  { value: 'orthodontic_movement', label: 'Mouvement orthodontique', typical_weeks: 4 },
  { value: 'medical_clearance', label: 'Accord médical requis', typical_weeks: 2 },
  { value: 'patient_schedule', label: 'Disponibilité patient', typical_weeks: 1 },
] as const

// ============================================
// DECISION CONTEXT - Tooth-level prognosis
// ============================================

// Individual tooth prognosis
export const TOOTH_PROGNOSIS_OPTIONS = [
  { value: 'favorable', label: 'Favorable', description: 'Bon pronostic long terme' },
  { value: 'questionable', label: 'Questionnable', description: 'Pronostic incertain' },
  { value: 'unfavorable', label: 'Défavorable', description: 'Pronostic réservé' },
  { value: 'hopeless', label: 'Sans espoir', description: 'Extraction recommandée' },
] as const

// Reasons affecting prognosis
export const PROGNOSIS_FACTOR_OPTIONS = [
  { value: 'bone_loss', label: 'Perte osseuse importante' },
  { value: 'furcation', label: 'Atteinte de furcation' },
  { value: 'mobility', label: 'Mobilité importante' },
  { value: 'root_resorption', label: 'Résorption radiculaire' },
  { value: 'crack', label: 'Fêlure/fracture' },
  { value: 'periapical_lesion', label: 'Lésion péri-apicale' },
  { value: 'recurrent_caries', label: 'Caries récurrentes' },
  { value: 'crown_root_ratio', label: 'Rapport couronne/racine défavorable' },
  { value: 'endodontic_failure', label: 'Échec endodontique' },
  { value: 'non_restorable', label: 'Non restaurable' },
  { value: 'strategic_extraction', label: 'Extraction stratégique (orthodontie/prothèse)' },
] as const
