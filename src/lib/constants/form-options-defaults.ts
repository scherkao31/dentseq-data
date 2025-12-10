/**
 * Default Form Options
 * These are the default values used when no custom settings exist in the database.
 * Users can add, modify, or disable these options from the settings page.
 */

import type { FormOptionsConfig, FormOptionItem, TreatmentCategory } from '@/types/database'

// ============================================================================
// TREATMENT GOALS
// ============================================================================
export const DEFAULT_TREATMENT_GOALS: FormOptionItem[] = [
  { id: 'eliminate_pain', label: 'Éliminer la douleur', isCustom: false, isEnabled: true },
  { id: 'eliminate_infection', label: 'Éliminer l\'infection', isCustom: false, isEnabled: true },
  { id: 'restore_function', label: 'Restaurer la fonction', isCustom: false, isEnabled: true },
  { id: 'restore_aesthetics', label: 'Restaurer l\'esthétique', isCustom: false, isEnabled: true },
  { id: 'prevent_progression', label: 'Prévenir la progression', isCustom: false, isEnabled: true },
  { id: 'stabilize_periodontal', label: 'Stabiliser le parodonte', isCustom: false, isEnabled: true },
  { id: 'replace_missing_teeth', label: 'Remplacer les dents manquantes', isCustom: false, isEnabled: true },
  { id: 'improve_oral_hygiene', label: 'Améliorer l\'hygiène orale', isCustom: false, isEnabled: true },
  { id: 'long_term_maintenance', label: 'Maintenance long terme', isCustom: false, isEnabled: true },
]

// ============================================================================
// PATIENT PRIORITIES
// ============================================================================
export const DEFAULT_PATIENT_PRIORITIES: FormOptionItem[] = [
  { id: 'function', label: 'Fonction masticatoire', description: 'Pouvoir manger normalement', isCustom: false, isEnabled: true },
  { id: 'aesthetics', label: 'Esthétique', description: 'Apparence du sourire', isCustom: false, isEnabled: true },
  { id: 'cost', label: 'Coût', description: 'Minimiser le budget', isCustom: false, isEnabled: true },
  { id: 'time', label: 'Temps', description: 'Minimiser le nombre de séances', isCustom: false, isEnabled: true },
  { id: 'durability', label: 'Durabilité', description: 'Solution long terme', isCustom: false, isEnabled: true },
  { id: 'minimal_intervention', label: 'Intervention minimale', description: 'Approche conservatrice', isCustom: false, isEnabled: true },
]

// ============================================================================
// TREATMENTS (Full taxonomy - organized by category)
// ============================================================================
export const DEFAULT_TREATMENTS: FormOptionItem[] = [
  // ==================== DIAGNOSTIC ====================
  { id: 'comprehensive_exam', label: 'Examen complet', description: 'Examen clinique complet avec anamnèse', treatmentCategory: 'diagnostic', typicalDuration: 45, isCustom: false, isEnabled: true },
  { id: 'periodic_exam', label: 'Examen de contrôle', description: 'Examen périodique de suivi', treatmentCategory: 'diagnostic', typicalDuration: 20, isCustom: false, isEnabled: true },
  { id: 'limited_exam', label: 'Examen ciblé', description: 'Examen limité à un problème spécifique', treatmentCategory: 'diagnostic', typicalDuration: 15, isCustom: false, isEnabled: true },
  { id: 'radiograph_periapical', label: 'Radiographie périapicale', treatmentCategory: 'diagnostic', typicalDuration: 5, isCustom: false, isEnabled: true },
  { id: 'radiograph_bitewing', label: 'Radiographie bitewing', treatmentCategory: 'diagnostic', typicalDuration: 5, isCustom: false, isEnabled: true },
  { id: 'radiograph_panoramic', label: 'Radiographie panoramique', treatmentCategory: 'diagnostic', typicalDuration: 10, isCustom: false, isEnabled: true },
  { id: 'cbct_scan', label: 'Cone Beam CT (CBCT)', treatmentCategory: 'diagnostic', typicalDuration: 15, isCustom: false, isEnabled: true },
  { id: 'pulp_vitality_test', label: 'Test de vitalité pulpaire', treatmentCategory: 'diagnostic', typicalDuration: 10, isCustom: false, isEnabled: true },
  { id: 'periodontal_charting', label: 'Bilan parodontal complet', treatmentCategory: 'diagnostic', typicalDuration: 30, isCustom: false, isEnabled: true },

  // ==================== PREVENTIVE ====================
  { id: 'prophylaxis', label: 'Détartrage et polissage', description: 'Nettoyage professionnel prophylactique', treatmentCategory: 'preventive', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'fluoride_application', label: 'Application de fluor', treatmentCategory: 'preventive', typicalDuration: 10, isCustom: false, isEnabled: true },
  { id: 'sealant', label: 'Scellement de sillons', treatmentCategory: 'preventive', typicalDuration: 15, isCustom: false, isEnabled: true },
  { id: 'oral_hygiene_instruction', label: 'Instruction hygiène orale', description: 'Enseignement des techniques de brossage', treatmentCategory: 'preventive', typicalDuration: 20, isCustom: false, isEnabled: true },

  // ==================== RESTORATIVE ====================
  { id: 'restoration_composite_direct', label: 'Restauration composite directe', description: 'Obturation en résine composite', treatmentCategory: 'restorative', typicalDuration: 45, isCustom: false, isEnabled: true },
  { id: 'restoration_amalgam', label: 'Restauration amalgame', description: 'Obturation en amalgame', treatmentCategory: 'restorative', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'inlay', label: 'Inlay', description: 'Restauration indirecte intra-coronaire', treatmentCategory: 'restorative', typicalDuration: 60, requiresLab: true, isCustom: false, isEnabled: true },
  { id: 'onlay', label: 'Onlay', description: 'Restauration indirecte avec recouvrement cuspidien', treatmentCategory: 'restorative', typicalDuration: 60, requiresLab: true, isCustom: false, isEnabled: true },
  { id: 'crown_full', label: 'Couronne périphérique', description: 'Couronne complète', treatmentCategory: 'restorative', typicalDuration: 60, requiresLab: true, isCustom: false, isEnabled: true },
  { id: 'crown_partial', label: 'Couronne partielle', treatmentCategory: 'restorative', typicalDuration: 60, requiresLab: true, isCustom: false, isEnabled: true },
  { id: 'veneer', label: 'Facette', description: 'Facette céramique ou composite', treatmentCategory: 'restorative', typicalDuration: 60, requiresLab: true, isCustom: false, isEnabled: true },
  { id: 'core_buildup', label: 'Reconstitution coronaire', description: 'Reconstitution du moignon coronaire', treatmentCategory: 'restorative', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'post_and_core', label: 'Inlay-core / Tenon', description: 'Ancrage radiculaire avec reconstitution', treatmentCategory: 'restorative', typicalDuration: 45, requiresLab: true, isCustom: false, isEnabled: true },
  { id: 'temporary_restoration', label: 'Restauration provisoire', treatmentCategory: 'restorative', typicalDuration: 20, isCustom: false, isEnabled: true },

  // ==================== ENDODONTIC ====================
  { id: 'pulp_capping_direct', label: 'Coiffage pulpaire direct', description: 'Protection directe de la pulpe exposée', treatmentCategory: 'endodontic', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'pulp_capping_indirect', label: 'Coiffage pulpaire indirect', description: 'Protection indirecte de la pulpe proche', treatmentCategory: 'endodontic', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'pulpotomy', label: 'Pulpotomie', description: 'Ablation partielle de la pulpe', treatmentCategory: 'endodontic', typicalDuration: 45, isCustom: false, isEnabled: true },
  { id: 'root_canal_treatment', label: 'Traitement canalaire', description: 'Traitement endodontique complet', treatmentCategory: 'endodontic', typicalDuration: 90, isCustom: false, isEnabled: true },
  { id: 'root_canal_retreatment', label: 'Retraitement canalaire', description: 'Reprise de traitement endodontique', treatmentCategory: 'endodontic', typicalDuration: 120, isCustom: false, isEnabled: true },
  { id: 'apicoectomy', label: 'Apicectomie', description: 'Résection apicale chirurgicale', treatmentCategory: 'endodontic', typicalDuration: 60, isCustom: false, isEnabled: true },
  { id: 'internal_bleaching', label: 'Blanchiment interne', treatmentCategory: 'endodontic', typicalDuration: 30, isCustom: false, isEnabled: true },

  // ==================== PERIODONTAL ====================
  { id: 'scaling_root_planing', label: 'Surfaçage radiculaire', description: 'Détartrage sous-gingival et surfaçage', treatmentCategory: 'periodontal', typicalDuration: 60, isCustom: false, isEnabled: true },
  { id: 'periodontal_maintenance', label: 'Maintenance parodontale', description: 'Séance de maintenance après traitement parodontal', treatmentCategory: 'periodontal', typicalDuration: 45, isCustom: false, isEnabled: true },
  { id: 'gingivectomy', label: 'Gingivectomie', description: 'Excision de tissu gingival', treatmentCategory: 'periodontal', typicalDuration: 45, isCustom: false, isEnabled: true },
  { id: 'crown_lengthening', label: 'Élongation coronaire', description: 'Allongement de couronne clinique', treatmentCategory: 'periodontal', typicalDuration: 60, isCustom: false, isEnabled: true },
  { id: 'bone_graft_periodontal', label: 'Greffe osseuse parodontale', treatmentCategory: 'periodontal', typicalDuration: 90, isCustom: false, isEnabled: true },
  { id: 'guided_tissue_regeneration', label: 'Régénération tissulaire guidée', treatmentCategory: 'periodontal', typicalDuration: 90, isCustom: false, isEnabled: true },
  { id: 'soft_tissue_graft', label: 'Greffe de tissu mou', description: 'Greffe gingivale', treatmentCategory: 'periodontal', typicalDuration: 60, isCustom: false, isEnabled: true },

  // ==================== SURGICAL ====================
  { id: 'extraction_simple', label: 'Extraction simple', treatmentCategory: 'surgical', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'extraction_surgical', label: 'Extraction chirurgicale', description: 'Extraction avec levée de lambeau', treatmentCategory: 'surgical', typicalDuration: 45, isCustom: false, isEnabled: true },
  { id: 'extraction_wisdom_tooth', label: 'Extraction dent de sagesse', treatmentCategory: 'surgical', typicalDuration: 60, isCustom: false, isEnabled: true },
  { id: 'alveoloplasty', label: 'Alvéoloplastie', description: 'Régularisation de crête', treatmentCategory: 'surgical', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'frenectomy', label: 'Frénectomie', treatmentCategory: 'surgical', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'biopsy', label: 'Biopsie', treatmentCategory: 'surgical', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'incision_drainage', label: 'Incision et drainage', description: 'Drainage d\'abcès', treatmentCategory: 'surgical', typicalDuration: 20, isCustom: false, isEnabled: true },

  // ==================== IMPLANT ====================
  { id: 'implant_placement', label: 'Pose d\'implant', treatmentCategory: 'implant', typicalDuration: 60, isCustom: false, isEnabled: true },
  { id: 'bone_augmentation', label: 'Augmentation osseuse', description: 'Greffe osseuse pré-implantaire', treatmentCategory: 'implant', typicalDuration: 90, isCustom: false, isEnabled: true },
  { id: 'sinus_lift', label: 'Élévation sinusienne', description: 'Comblement de sinus', treatmentCategory: 'implant', typicalDuration: 90, isCustom: false, isEnabled: true },
  { id: 'implant_uncovering', label: 'Mise en fonction implant', description: 'Désenfouissement et pose de pilier', treatmentCategory: 'implant', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'abutment_placement', label: 'Pose de pilier', treatmentCategory: 'implant', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'implant_crown', label: 'Couronne sur implant', treatmentCategory: 'implant', typicalDuration: 45, requiresLab: true, isCustom: false, isEnabled: true },

  // ==================== PROSTHETIC ====================
  { id: 'denture_complete', label: 'Prothèse complète', description: 'Prothèse amovible complète', treatmentCategory: 'prosthetic', typicalDuration: 60, requiresLab: true, isCustom: false, isEnabled: true },
  { id: 'denture_partial_removable', label: 'Prothèse partielle amovible', treatmentCategory: 'prosthetic', typicalDuration: 60, requiresLab: true, isCustom: false, isEnabled: true },
  { id: 'bridge_fixed', label: 'Bridge fixe', description: 'Prothèse fixée plurale', treatmentCategory: 'prosthetic', typicalDuration: 90, requiresLab: true, isCustom: false, isEnabled: true },
  { id: 'implant_supported_prosthesis', label: 'Prothèse sur implants', treatmentCategory: 'prosthetic', typicalDuration: 90, requiresLab: true, isCustom: false, isEnabled: true },
  { id: 'denture_reline', label: 'Rebasage prothèse', treatmentCategory: 'prosthetic', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'denture_repair', label: 'Réparation prothèse', treatmentCategory: 'prosthetic', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'occlusal_splint', label: 'Gouttière occlusale', description: 'Gouttière de relaxation ou protection', treatmentCategory: 'prosthetic', typicalDuration: 30, requiresLab: true, isCustom: false, isEnabled: true },

  // ==================== ORTHODONTIC ====================
  { id: 'orthodontic_consultation', label: 'Consultation orthodontique', treatmentCategory: 'orthodontic', typicalDuration: 45, isCustom: false, isEnabled: true },
  { id: 'orthodontic_records', label: 'Dossier orthodontique', description: 'Photos, moulages, téléradiographie', treatmentCategory: 'orthodontic', typicalDuration: 60, isCustom: false, isEnabled: true },
  { id: 'appliance_placement', label: 'Pose d\'appareil', treatmentCategory: 'orthodontic', typicalDuration: 60, isCustom: false, isEnabled: true },
  { id: 'orthodontic_adjustment', label: 'Ajustement orthodontique', treatmentCategory: 'orthodontic', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'retainer', label: 'Pose de contention', treatmentCategory: 'orthodontic', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'aligner_delivery', label: 'Remise d\'aligneurs', treatmentCategory: 'orthodontic', typicalDuration: 30, isCustom: false, isEnabled: true },

  // ==================== OTHER ====================
  { id: 'emergency_treatment', label: 'Traitement d\'urgence', description: 'Gestion de douleur ou urgence', treatmentCategory: 'other', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'sedation', label: 'Sédation', description: 'Sédation consciente ou MEOPA', treatmentCategory: 'other', typicalDuration: 30, isCustom: false, isEnabled: true },
  { id: 'other_treatment', label: 'Autre traitement', description: 'Traitement non listé', treatmentCategory: 'other', isCustom: false, isEnabled: true },
]

// ============================================================================
// APPOINTMENT TYPES
// ============================================================================
export const DEFAULT_APPOINTMENT_TYPES: FormOptionItem[] = [
  { id: 'emergency', label: 'Urgence', description: 'Traitement d\'urgence', isCustom: false, isEnabled: true },
  { id: 'diagnostic', label: 'Diagnostic', description: 'Examen et diagnostic', isCustom: false, isEnabled: true },
  { id: 'treatment', label: 'Traitement', description: 'Séance de traitement', isCustom: false, isEnabled: true },
  { id: 'review', label: 'Contrôle', description: 'Visite de contrôle', isCustom: false, isEnabled: true },
  { id: 'maintenance', label: 'Maintenance', description: 'Maintenance préventive', isCustom: false, isEnabled: true },
]

// ============================================================================
// DELAY REASONS
// ============================================================================
export const DEFAULT_DELAY_REASONS: FormOptionItem[] = [
  { id: 'no_delay_needed', label: 'Pas de délai nécessaire', description: 'Séances consécutives possibles', typicalWeeks: 0, isCustom: false, isEnabled: true },
  { id: 'bone_healing', label: 'Cicatrisation osseuse', typicalWeeks: 12, isCustom: false, isEnabled: true },
  { id: 'soft_tissue_healing', label: 'Cicatrisation tissus mous', typicalWeeks: 2, isCustom: false, isEnabled: true },
  { id: 'implant_osseointegration', label: 'Ostéointégration implant', typicalWeeks: 12, isCustom: false, isEnabled: true },
  { id: 'graft_maturation', label: 'Maturation greffe', typicalWeeks: 16, isCustom: false, isEnabled: true },
  { id: 'root_canal_observation', label: 'Observation post-endo', typicalWeeks: 4, isCustom: false, isEnabled: true },
  { id: 'perio_reevaluation', label: 'Réévaluation parodontale', typicalWeeks: 6, isCustom: false, isEnabled: true },
  { id: 'provisional_test', label: 'Test provisoire', typicalWeeks: 4, isCustom: false, isEnabled: true },
  { id: 'lab_fabrication', label: 'Fabrication laboratoire', typicalWeeks: 2, isCustom: false, isEnabled: true },
  { id: 'patient_adaptation', label: 'Adaptation patient', typicalWeeks: 2, isCustom: false, isEnabled: true },
  { id: 'inflammation_resolution', label: 'Résolution inflammation', typicalWeeks: 2, isCustom: false, isEnabled: true },
  { id: 'extraction_socket_healing', label: 'Cicatrisation alvéole', typicalWeeks: 8, isCustom: false, isEnabled: true },
  { id: 'orthodontic_movement', label: 'Mouvement orthodontique', typicalWeeks: 4, isCustom: false, isEnabled: true },
  { id: 'medical_clearance', label: 'Accord médical requis', typicalWeeks: 2, isCustom: false, isEnabled: true },
  { id: 'patient_schedule', label: 'Disponibilité patient', typicalWeeks: 1, isCustom: false, isEnabled: true },
]

// ============================================================================
// MEDICAL CONDITIONS
// ============================================================================
export const DEFAULT_MEDICAL_CONDITIONS: FormOptionItem[] = [
  { id: 'diabetes_type_1', label: 'Diabète type 1', isCustom: false, isEnabled: true },
  { id: 'diabetes_type_2', label: 'Diabète type 2', isCustom: false, isEnabled: true },
  { id: 'hypertension', label: 'Hypertension', isCustom: false, isEnabled: true },
  { id: 'heart_disease', label: 'Maladie cardiaque', isCustom: false, isEnabled: true },
  { id: 'arrhythmia', label: 'Arythmie', isCustom: false, isEnabled: true },
  { id: 'pacemaker', label: 'Pacemaker', isCustom: false, isEnabled: true },
  { id: 'anticoagulant_therapy', label: 'Traitement anticoagulant', isCustom: false, isEnabled: true },
  { id: 'antiplatelet_therapy', label: 'Traitement antiplaquettaire', isCustom: false, isEnabled: true },
  { id: 'bisphosphonate_therapy', label: 'Traitement bisphosphonates', isCustom: false, isEnabled: true },
  { id: 'immunosuppression', label: 'Immunosuppression', isCustom: false, isEnabled: true },
  { id: 'chemotherapy', label: 'Chimiothérapie', isCustom: false, isEnabled: true },
  { id: 'radiotherapy_head_neck', label: 'Radiothérapie tête/cou', isCustom: false, isEnabled: true },
  { id: 'osteoporosis', label: 'Ostéoporose', isCustom: false, isEnabled: true },
  { id: 'kidney_disease', label: 'Maladie rénale', isCustom: false, isEnabled: true },
  { id: 'liver_disease', label: 'Maladie hépatique', isCustom: false, isEnabled: true },
  { id: 'respiratory_disease', label: 'Maladie respiratoire', isCustom: false, isEnabled: true },
  { id: 'asthma', label: 'Asthme', isCustom: false, isEnabled: true },
  { id: 'epilepsy', label: 'Épilepsie', isCustom: false, isEnabled: true },
  { id: 'pregnancy', label: 'Grossesse', isCustom: false, isEnabled: true },
  { id: 'hiv_aids', label: 'VIH/SIDA', isCustom: false, isEnabled: true },
  { id: 'hepatitis_b', label: 'Hépatite B', isCustom: false, isEnabled: true },
  { id: 'hepatitis_c', label: 'Hépatite C', isCustom: false, isEnabled: true },
  { id: 'thyroid_disorder', label: 'Trouble thyroïdien', isCustom: false, isEnabled: true },
  { id: 'psychiatric_disorder', label: 'Trouble psychiatrique', isCustom: false, isEnabled: true },
  { id: 'substance_abuse', label: 'Addiction', isCustom: false, isEnabled: true },
  { id: 'smoking', label: 'Tabagisme', isCustom: false, isEnabled: true },
]

// ============================================================================
// ALLERGIES
// ============================================================================
export const DEFAULT_ALLERGIES: FormOptionItem[] = [
  { id: 'penicillin', label: 'Pénicilline', isCustom: false, isEnabled: true },
  { id: 'amoxicillin', label: 'Amoxicilline', isCustom: false, isEnabled: true },
  { id: 'nsaids', label: 'AINS', isCustom: false, isEnabled: true },
  { id: 'aspirin', label: 'Aspirine', isCustom: false, isEnabled: true },
  { id: 'latex', label: 'Latex', isCustom: false, isEnabled: true },
  { id: 'iodine', label: 'Iode', isCustom: false, isEnabled: true },
  { id: 'local_anesthetic', label: 'Anesthésique local', isCustom: false, isEnabled: true },
  { id: 'codeine', label: 'Codéine', isCustom: false, isEnabled: true },
  { id: 'sulfonamides', label: 'Sulfamides', isCustom: false, isEnabled: true },
]

// ============================================================================
// COMPLETE DEFAULT CONFIG
// ============================================================================
export const DEFAULT_FORM_OPTIONS: FormOptionsConfig = {
  treatment_goals: DEFAULT_TREATMENT_GOALS,
  patient_priorities: DEFAULT_PATIENT_PRIORITIES,
  treatments: DEFAULT_TREATMENTS,
  appointment_types: DEFAULT_APPOINTMENT_TYPES,
  delay_reasons: DEFAULT_DELAY_REASONS,
  medical_conditions: DEFAULT_MEDICAL_CONDITIONS,
  allergies: DEFAULT_ALLERGIES,
}

/**
 * Get default form options
 */
export function getDefaultFormOptions(): FormOptionsConfig {
  return JSON.parse(JSON.stringify(DEFAULT_FORM_OPTIONS)) // Deep clone
}

/**
 * Merge user options with defaults
 * - Keeps all user customizations
 * - Adds any new default options that don't exist in user config
 * - Respects user's isEnabled settings
 */
export function mergeWithDefaults(
  userConfig: Partial<FormOptionsConfig> | null
): FormOptionsConfig {
  if (!userConfig) {
    return getDefaultFormOptions()
  }

  const merged: FormOptionsConfig = {
    treatment_goals: mergeOptionsList(
      DEFAULT_TREATMENT_GOALS,
      userConfig.treatment_goals
    ),
    patient_priorities: mergeOptionsList(
      DEFAULT_PATIENT_PRIORITIES,
      userConfig.patient_priorities
    ),
    treatments: mergeOptionsList(
      DEFAULT_TREATMENTS,
      userConfig.treatments
    ),
    appointment_types: mergeOptionsList(
      DEFAULT_APPOINTMENT_TYPES,
      userConfig.appointment_types
    ),
    delay_reasons: mergeOptionsList(
      DEFAULT_DELAY_REASONS,
      userConfig.delay_reasons
    ),
    medical_conditions: mergeOptionsList(
      DEFAULT_MEDICAL_CONDITIONS,
      userConfig.medical_conditions
    ),
    allergies: mergeOptionsList(
      DEFAULT_ALLERGIES,
      userConfig.allergies
    ),
  }

  return merged
}

function mergeOptionsList(
  defaults: FormOptionItem[],
  userItems?: FormOptionItem[]
): FormOptionItem[] {
  if (!userItems) {
    return [...defaults]
  }

  const result: FormOptionItem[] = []
  const userItemsMap = new Map(userItems.map(item => [item.id, item]))
  const processedIds = new Set<string>()

  // First, add all default items (with user overrides if exist)
  for (const defaultItem of defaults) {
    const userItem = userItemsMap.get(defaultItem.id)
    if (userItem) {
      result.push({ ...defaultItem, ...userItem, isCustom: false })
      processedIds.add(defaultItem.id)
    } else {
      result.push({ ...defaultItem })
    }
  }

  // Then add remaining user custom items
  userItems.forEach(userItem => {
    if (!processedIds.has(userItem.id)) {
      result.push({ ...userItem, isCustom: true })
    }
  })

  return result
}

/**
 * Get only enabled options for display in forms
 */
export function getEnabledOptions(items: FormOptionItem[]): FormOptionItem[] {
  return items.filter(item => item.isEnabled)
}
