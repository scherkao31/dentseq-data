/**
 * Treatment Taxonomy for Dental Sequence Data
 * Organized by category with French labels
 */

export type TreatmentCategory =
  | 'diagnostic'
  | 'preventive'
  | 'restorative'
  | 'endodontic'
  | 'periodontal'
  | 'surgical'
  | 'implant'
  | 'prosthetic'
  | 'orthodontic'
  | 'other'

export interface TreatmentType {
  id: string
  name: string
  category: TreatmentCategory
  description?: string
  typicalDuration?: number // in minutes
  requiresLab?: boolean
}

export const TREATMENT_CATEGORIES: Record<TreatmentCategory, { name: string; color: string }> = {
  diagnostic: { name: 'Diagnostique', color: 'bg-blue-100 text-blue-800' },
  preventive: { name: 'Préventif', color: 'bg-green-100 text-green-800' },
  restorative: { name: 'Restaurateur', color: 'bg-yellow-100 text-yellow-800' },
  endodontic: { name: 'Endodontique', color: 'bg-red-100 text-red-800' },
  periodontal: { name: 'Parodontal', color: 'bg-purple-100 text-purple-800' },
  surgical: { name: 'Chirurgical', color: 'bg-orange-100 text-orange-800' },
  implant: { name: 'Implantaire', color: 'bg-cyan-100 text-cyan-800' },
  prosthetic: { name: 'Prothétique', color: 'bg-pink-100 text-pink-800' },
  orthodontic: { name: 'Orthodontique', color: 'bg-indigo-100 text-indigo-800' },
  other: { name: 'Autre', color: 'bg-gray-100 text-gray-800' },
}

export const TREATMENTS: TreatmentType[] = [
  // ==================== DIAGNOSTIC ====================
  {
    id: 'comprehensive_exam',
    name: 'Examen complet',
    category: 'diagnostic',
    description: 'Examen clinique complet avec anamnèse',
    typicalDuration: 45,
  },
  {
    id: 'periodic_exam',
    name: 'Examen de contrôle',
    category: 'diagnostic',
    description: 'Examen périodique de suivi',
    typicalDuration: 20,
  },
  {
    id: 'limited_exam',
    name: 'Examen ciblé',
    category: 'diagnostic',
    description: 'Examen limité à un problème spécifique',
    typicalDuration: 15,
  },
  {
    id: 'radiograph_periapical',
    name: 'Radiographie périapicale',
    category: 'diagnostic',
    typicalDuration: 5,
  },
  {
    id: 'radiograph_bitewing',
    name: 'Radiographie bitewing',
    category: 'diagnostic',
    typicalDuration: 5,
  },
  {
    id: 'radiograph_panoramic',
    name: 'Radiographie panoramique',
    category: 'diagnostic',
    typicalDuration: 10,
  },
  {
    id: 'cbct_scan',
    name: 'Cone Beam CT (CBCT)',
    category: 'diagnostic',
    typicalDuration: 15,
  },
  {
    id: 'pulp_vitality_test',
    name: 'Test de vitalité pulpaire',
    category: 'diagnostic',
    typicalDuration: 10,
  },
  {
    id: 'periodontal_charting',
    name: 'Bilan parodontal complet',
    category: 'diagnostic',
    typicalDuration: 30,
  },

  // ==================== PREVENTIVE ====================
  {
    id: 'prophylaxis',
    name: 'Détartrage et polissage',
    category: 'preventive',
    description: 'Nettoyage professionnel prophylactique',
    typicalDuration: 30,
  },
  {
    id: 'fluoride_application',
    name: 'Application de fluor',
    category: 'preventive',
    typicalDuration: 10,
  },
  {
    id: 'sealant',
    name: 'Scellement de sillons',
    category: 'preventive',
    typicalDuration: 15,
  },
  {
    id: 'oral_hygiene_instruction',
    name: 'Instruction hygiène orale',
    category: 'preventive',
    description: 'Enseignement des techniques de brossage et utilisation du fil dentaire',
    typicalDuration: 20,
  },

  // ==================== RESTORATIVE ====================
  {
    id: 'restoration_composite_direct',
    name: 'Restauration composite directe',
    category: 'restorative',
    description: 'Obturation en résine composite',
    typicalDuration: 45,
  },
  {
    id: 'restoration_amalgam',
    name: 'Restauration amalgame',
    category: 'restorative',
    description: 'Obturation en amalgame',
    typicalDuration: 30,
  },
  {
    id: 'inlay',
    name: 'Inlay',
    category: 'restorative',
    description: 'Restauration indirecte intra-coronaire',
    typicalDuration: 60,
    requiresLab: true,
  },
  {
    id: 'onlay',
    name: 'Onlay',
    category: 'restorative',
    description: 'Restauration indirecte avec recouvrement cuspidien',
    typicalDuration: 60,
    requiresLab: true,
  },
  {
    id: 'crown_full',
    name: 'Couronne périphérique',
    category: 'restorative',
    description: 'Couronne complète (céramique, céramo-métallique, ou métallique)',
    typicalDuration: 60,
    requiresLab: true,
  },
  {
    id: 'crown_partial',
    name: 'Couronne partielle',
    category: 'restorative',
    typicalDuration: 60,
    requiresLab: true,
  },
  {
    id: 'veneer',
    name: 'Facette',
    category: 'restorative',
    description: 'Facette céramique ou composite',
    typicalDuration: 60,
    requiresLab: true,
  },
  {
    id: 'core_buildup',
    name: 'Reconstitution coronaire',
    category: 'restorative',
    description: 'Reconstitution du moignon coronaire',
    typicalDuration: 30,
  },
  {
    id: 'post_and_core',
    name: 'Inlay-core / Tenon',
    category: 'restorative',
    description: 'Ancrage radiculaire avec reconstitution',
    typicalDuration: 45,
    requiresLab: true,
  },
  {
    id: 'temporary_restoration',
    name: 'Restauration provisoire',
    category: 'restorative',
    typicalDuration: 20,
  },

  // ==================== ENDODONTIC ====================
  {
    id: 'pulp_capping_direct',
    name: 'Coiffage pulpaire direct',
    category: 'endodontic',
    description: 'Protection directe de la pulpe exposée',
    typicalDuration: 30,
  },
  {
    id: 'pulp_capping_indirect',
    name: 'Coiffage pulpaire indirect',
    category: 'endodontic',
    description: 'Protection indirecte de la pulpe proche',
    typicalDuration: 30,
  },
  {
    id: 'pulpotomy',
    name: 'Pulpotomie',
    category: 'endodontic',
    description: 'Ablation partielle de la pulpe',
    typicalDuration: 45,
  },
  {
    id: 'root_canal_treatment',
    name: 'Traitement canalaire',
    category: 'endodontic',
    description: 'Traitement endodontique complet',
    typicalDuration: 90,
  },
  {
    id: 'root_canal_retreatment',
    name: 'Retraitement canalaire',
    category: 'endodontic',
    description: 'Reprise de traitement endodontique',
    typicalDuration: 120,
  },
  {
    id: 'apicoectomy',
    name: 'Apicectomie',
    category: 'endodontic',
    description: 'Résection apicale chirurgicale',
    typicalDuration: 60,
  },
  {
    id: 'internal_bleaching',
    name: 'Blanchiment interne',
    category: 'endodontic',
    typicalDuration: 30,
  },

  // ==================== PERIODONTAL ====================
  {
    id: 'scaling_root_planing',
    name: 'Surfaçage radiculaire',
    category: 'periodontal',
    description: 'Détartrage sous-gingival et surfaçage',
    typicalDuration: 60,
  },
  {
    id: 'periodontal_maintenance',
    name: 'Maintenance parodontale',
    category: 'periodontal',
    description: 'Séance de maintenance après traitement parodontal',
    typicalDuration: 45,
  },
  {
    id: 'gingivectomy',
    name: 'Gingivectomie',
    category: 'periodontal',
    description: 'Excision de tissu gingival',
    typicalDuration: 45,
  },
  {
    id: 'crown_lengthening',
    name: 'Élongation coronaire',
    category: 'periodontal',
    description: 'Allongement de couronne clinique',
    typicalDuration: 60,
  },
  {
    id: 'bone_graft_periodontal',
    name: 'Greffe osseuse parodontale',
    category: 'periodontal',
    typicalDuration: 90,
  },
  {
    id: 'guided_tissue_regeneration',
    name: 'Régénération tissulaire guidée',
    category: 'periodontal',
    typicalDuration: 90,
  },
  {
    id: 'soft_tissue_graft',
    name: 'Greffe de tissu mou',
    category: 'periodontal',
    description: 'Greffe gingivale',
    typicalDuration: 60,
  },

  // ==================== SURGICAL ====================
  {
    id: 'extraction_simple',
    name: 'Extraction simple',
    category: 'surgical',
    typicalDuration: 30,
  },
  {
    id: 'extraction_surgical',
    name: 'Extraction chirurgicale',
    category: 'surgical',
    description: 'Extraction avec levée de lambeau',
    typicalDuration: 45,
  },
  {
    id: 'extraction_wisdom_tooth',
    name: 'Extraction dent de sagesse',
    category: 'surgical',
    typicalDuration: 60,
  },
  {
    id: 'alveoloplasty',
    name: 'Alvéoloplastie',
    category: 'surgical',
    description: 'Régularisation de crête',
    typicalDuration: 30,
  },
  {
    id: 'frenectomy',
    name: 'Frénectomie',
    category: 'surgical',
    typicalDuration: 30,
  },
  {
    id: 'biopsy',
    name: 'Biopsie',
    category: 'surgical',
    typicalDuration: 30,
  },
  {
    id: 'incision_drainage',
    name: 'Incision et drainage',
    category: 'surgical',
    description: 'Drainage d\'abcès',
    typicalDuration: 20,
  },

  // ==================== IMPLANT ====================
  {
    id: 'implant_placement',
    name: 'Pose d\'implant',
    category: 'implant',
    typicalDuration: 60,
  },
  {
    id: 'bone_augmentation',
    name: 'Augmentation osseuse',
    category: 'implant',
    description: 'Greffe osseuse pré-implantaire',
    typicalDuration: 90,
  },
  {
    id: 'sinus_lift',
    name: 'Élévation sinusienne',
    category: 'implant',
    description: 'Comblement de sinus',
    typicalDuration: 90,
  },
  {
    id: 'implant_uncovering',
    name: 'Mise en fonction implant',
    category: 'implant',
    description: 'Désenfouissement et pose de pilier de cicatrisation',
    typicalDuration: 30,
  },
  {
    id: 'abutment_placement',
    name: 'Pose de pilier',
    category: 'implant',
    typicalDuration: 30,
  },
  {
    id: 'implant_crown',
    name: 'Couronne sur implant',
    category: 'implant',
    typicalDuration: 45,
    requiresLab: true,
  },

  // ==================== PROSTHETIC ====================
  {
    id: 'denture_complete',
    name: 'Prothèse complète',
    category: 'prosthetic',
    description: 'Prothèse amovible complète',
    typicalDuration: 60,
    requiresLab: true,
  },
  {
    id: 'denture_partial_removable',
    name: 'Prothèse partielle amovible',
    category: 'prosthetic',
    typicalDuration: 60,
    requiresLab: true,
  },
  {
    id: 'bridge_fixed',
    name: 'Bridge fixe',
    category: 'prosthetic',
    description: 'Prothèse fixée plurale',
    typicalDuration: 90,
    requiresLab: true,
  },
  {
    id: 'implant_supported_prosthesis',
    name: 'Prothèse sur implants',
    category: 'prosthetic',
    typicalDuration: 90,
    requiresLab: true,
  },
  {
    id: 'denture_reline',
    name: 'Rebasage prothèse',
    category: 'prosthetic',
    typicalDuration: 30,
  },
  {
    id: 'denture_repair',
    name: 'Réparation prothèse',
    category: 'prosthetic',
    typicalDuration: 30,
  },
  {
    id: 'occlusal_splint',
    name: 'Gouttière occlusale',
    category: 'prosthetic',
    description: 'Gouttière de relaxation ou protection',
    typicalDuration: 30,
    requiresLab: true,
  },

  // ==================== ORTHODONTIC ====================
  {
    id: 'orthodontic_consultation',
    name: 'Consultation orthodontique',
    category: 'orthodontic',
    typicalDuration: 45,
  },
  {
    id: 'orthodontic_records',
    name: 'Dossier orthodontique',
    category: 'orthodontic',
    description: 'Photos, moulages, téléradiographie',
    typicalDuration: 60,
  },
  {
    id: 'appliance_placement',
    name: 'Pose d\'appareil',
    category: 'orthodontic',
    typicalDuration: 60,
  },
  {
    id: 'orthodontic_adjustment',
    name: 'Ajustement orthodontique',
    category: 'orthodontic',
    typicalDuration: 30,
  },
  {
    id: 'retainer',
    name: 'Pose de contention',
    category: 'orthodontic',
    typicalDuration: 30,
  },
  {
    id: 'aligner_delivery',
    name: 'Remise d\'aligneurs',
    category: 'orthodontic',
    typicalDuration: 30,
  },

  // ==================== OTHER ====================
  {
    id: 'emergency_treatment',
    name: 'Traitement d\'urgence',
    category: 'other',
    description: 'Gestion de douleur ou urgence',
    typicalDuration: 30,
  },
  {
    id: 'sedation',
    name: 'Sédation',
    category: 'other',
    description: 'Sédation consciente ou MEOPA',
    typicalDuration: 30,
  },
  {
    id: 'other_treatment',
    name: 'Autre traitement',
    category: 'other',
    description: 'Traitement non listé',
  },
]

/**
 * Get treatments by category
 */
export function getTreatmentsByCategory(category: TreatmentCategory): TreatmentType[] {
  return TREATMENTS.filter((t) => t.category === category)
}

/**
 * Get treatment by ID
 */
export function getTreatmentById(id: string): TreatmentType | undefined {
  return TREATMENTS.find((t) => t.id === id)
}

/**
 * Get category info
 */
export function getCategoryInfo(category: TreatmentCategory) {
  return TREATMENT_CATEGORIES[category]
}

/**
 * Group treatments by category
 */
export function getGroupedTreatments(): Record<TreatmentCategory, TreatmentType[]> {
  return TREATMENTS.reduce(
    (acc, treatment) => {
      if (!acc[treatment.category]) {
        acc[treatment.category] = []
      }
      acc[treatment.category].push(treatment)
      return acc
    },
    {} as Record<TreatmentCategory, TreatmentType[]>
  )
}
