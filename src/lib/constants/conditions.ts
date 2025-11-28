/**
 * Dental Condition Taxonomy
 * For documenting clinical findings
 */

export interface Condition {
  id: string
  name: string
  category: string
  description?: string
}

export const CONDITION_CATEGORIES = {
  caries: 'Caries',
  pulpal: 'Pulpaire',
  periapical: 'Périapical',
  periodontal: 'Parodontal',
  structural: 'Structurel',
  restoration: 'Restauration existante',
  prosthetic: 'Prothétique',
  other: 'Autre',
} as const

export type ConditionCategory = keyof typeof CONDITION_CATEGORIES

export const CONDITIONS: Condition[] = [
  // ==================== CARIES ====================
  { id: 'caries_initial', name: 'Carie initiale', category: 'caries', description: 'Lésion débutante, limitée à l\'émail' },
  { id: 'caries_moderate', name: 'Carie modérée', category: 'caries', description: 'Lésion atteignant la dentine superficielle' },
  { id: 'caries_deep', name: 'Carie profonde', category: 'caries', description: 'Lésion proche de la pulpe' },
  { id: 'caries_secondary', name: 'Carie secondaire', category: 'caries', description: 'Récidive carieuse sous/autour d\'une restauration' },
  { id: 'caries_root', name: 'Carie radiculaire', category: 'caries', description: 'Lésion sur la surface radiculaire exposée' },
  { id: 'caries_rampant', name: 'Caries rampantes', category: 'caries', description: 'Caries multiples à évolution rapide' },

  // ==================== PULPAL ====================
  { id: 'pulp_normal', name: 'Pulpe normale', category: 'pulpal', description: 'Réponse normale aux tests' },
  { id: 'pulpitis_reversible', name: 'Pulpite réversible', category: 'pulpal', description: 'Inflammation pulpaire réversible' },
  { id: 'pulpitis_irreversible', name: 'Pulpite irréversible', category: 'pulpal', description: 'Inflammation pulpaire irréversible' },
  { id: 'pulpitis_irreversible_symptomatic', name: 'Pulpite irréversible symptomatique', category: 'pulpal', description: 'Avec douleur spontanée' },
  { id: 'pulpitis_irreversible_asymptomatic', name: 'Pulpite irréversible asymptomatique', category: 'pulpal', description: 'Sans symptômes' },
  { id: 'pulp_necrosis', name: 'Nécrose pulpaire', category: 'pulpal', description: 'Pulpe nécrotique' },
  { id: 'previously_treated', name: 'Dent traitée', category: 'pulpal', description: 'Traitement endodontique antérieur' },
  { id: 'previously_initiated', name: 'Traitement initié', category: 'pulpal', description: 'Traitement endodontique en cours' },

  // ==================== PERIAPICAL ====================
  { id: 'periapical_normal', name: 'Péri-apex normal', category: 'periapical', description: 'Pas de pathologie périapicale' },
  { id: 'apical_periodontitis_symptomatic', name: 'Parodontite apicale symptomatique', category: 'periapical', description: 'Avec douleur à la percussion/palpation' },
  { id: 'apical_periodontitis_asymptomatic', name: 'Parodontite apicale asymptomatique', category: 'periapical', description: 'Image radiologique sans symptômes' },
  { id: 'periapical_abscess_acute', name: 'Abcès périapical aigu', category: 'periapical', description: 'Infection aiguë avec tuméfaction' },
  { id: 'periapical_abscess_chronic', name: 'Abcès périapical chronique', category: 'periapical', description: 'Fistule présente' },
  { id: 'periapical_cyst', name: 'Kyste périapical', category: 'periapical', description: 'Lésion kystique' },
  { id: 'condensing_osteitis', name: 'Ostéite condensante', category: 'periapical', description: 'Réaction osseuse locale' },

  // ==================== PERIODONTAL ====================
  { id: 'healthy_periodontium', name: 'Parodonte sain', category: 'periodontal' },
  { id: 'gingivitis', name: 'Gingivite', category: 'periodontal', description: 'Inflammation gingivale sans perte d\'attache' },
  { id: 'gingivitis_plaque_induced', name: 'Gingivite induite par la plaque', category: 'periodontal' },
  { id: 'periodontitis_stage_i', name: 'Parodontite Stade I', category: 'periodontal', description: 'Parodontite initiale' },
  { id: 'periodontitis_stage_ii', name: 'Parodontite Stade II', category: 'periodontal', description: 'Parodontite modérée' },
  { id: 'periodontitis_stage_iii', name: 'Parodontite Stade III', category: 'periodontal', description: 'Parodontite sévère avec potentiel de perte dentaire' },
  { id: 'periodontitis_stage_iv', name: 'Parodontite Stade IV', category: 'periodontal', description: 'Parodontite sévère avancée' },
  { id: 'recession', name: 'Récession gingivale', category: 'periodontal' },
  { id: 'mucogingival_defect', name: 'Défaut muco-gingival', category: 'periodontal' },
  { id: 'furcation_involvement', name: 'Atteinte de furcation', category: 'periodontal' },
  { id: 'perio_endo_lesion', name: 'Lésion endo-parodontale', category: 'periodontal' },

  // ==================== STRUCTURAL ====================
  { id: 'fracture_enamel', name: 'Fracture amélaire', category: 'structural', description: 'Fracture limitée à l\'émail' },
  { id: 'fracture_enamel_dentin', name: 'Fracture amélo-dentinaire', category: 'structural', description: 'Sans exposition pulpaire' },
  { id: 'fracture_complicated', name: 'Fracture compliquée', category: 'structural', description: 'Avec exposition pulpaire' },
  { id: 'fracture_root', name: 'Fracture radiculaire', category: 'structural' },
  { id: 'fracture_crown_root', name: 'Fracture corono-radiculaire', category: 'structural' },
  { id: 'cracked_tooth', name: 'Fêlure/Syndrome de dent fêlée', category: 'structural' },
  { id: 'tooth_wear_attrition', name: 'Usure par attrition', category: 'structural', description: 'Usure par contact dent-dent' },
  { id: 'tooth_wear_erosion', name: 'Usure par érosion', category: 'structural', description: 'Usure chimique' },
  { id: 'tooth_wear_abrasion', name: 'Usure par abrasion', category: 'structural', description: 'Usure mécanique externe' },
  { id: 'tooth_wear_abfraction', name: 'Abfraction', category: 'structural', description: 'Lésions cervicales non carieuses' },
  { id: 'hypoplasia', name: 'Hypoplasie', category: 'structural' },
  { id: 'internal_resorption', name: 'Résorption interne', category: 'structural' },
  { id: 'external_resorption', name: 'Résorption externe', category: 'structural' },

  // ==================== RESTORATION ====================
  { id: 'restoration_intact', name: 'Restauration intacte', category: 'restoration' },
  { id: 'restoration_defective', name: 'Restauration défectueuse', category: 'restoration', description: 'Marginal, fracturée, ou usée' },
  { id: 'restoration_failing', name: 'Restauration en échec', category: 'restoration', description: 'Nécessite remplacement' },
  { id: 'restoration_amalgam', name: 'Restauration amalgame', category: 'restoration' },
  { id: 'restoration_composite', name: 'Restauration composite', category: 'restoration' },
  { id: 'crown_intact', name: 'Couronne intacte', category: 'restoration' },
  { id: 'crown_defective', name: 'Couronne défectueuse', category: 'restoration' },
  { id: 'post_present', name: 'Tenon présent', category: 'restoration' },

  // ==================== PROSTHETIC ====================
  { id: 'edentulous_space', name: 'Édentement', category: 'prosthetic', description: 'Espace édenté' },
  { id: 'pontic_site', name: 'Site de pontique', category: 'prosthetic' },
  { id: 'implant_present', name: 'Implant présent', category: 'prosthetic' },
  { id: 'implant_failing', name: 'Implant en échec', category: 'prosthetic' },
  { id: 'periimplantitis', name: 'Péri-implantite', category: 'prosthetic' },

  // ==================== OTHER ====================
  { id: 'impacted', name: 'Dent incluse', category: 'other' },
  { id: 'partially_erupted', name: 'Dent partiellement éruptée', category: 'other' },
  { id: 'supernumerary', name: 'Dent surnuméraire', category: 'other' },
  { id: 'ankylosed', name: 'Dent ankylosée', category: 'other' },
  { id: 'mobility', name: 'Mobilité dentaire', category: 'other' },
  { id: 'sensitivity', name: 'Sensibilité dentaire', category: 'other' },
  { id: 'discoloration', name: 'Dyschromie', category: 'other' },
]

/**
 * Get conditions by category
 */
export function getConditionsByCategory(category: ConditionCategory): Condition[] {
  return CONDITIONS.filter((c) => c.category === category)
}

/**
 * Get condition by ID
 */
export function getConditionById(id: string): Condition | undefined {
  return CONDITIONS.find((c) => c.id === id)
}

/**
 * Group conditions by category
 */
export function getGroupedConditions(): Record<string, Condition[]> {
  return CONDITIONS.reduce(
    (acc, condition) => {
      if (!acc[condition.category]) {
        acc[condition.category] = []
      }
      acc[condition.category].push(condition)
      return acc
    },
    {} as Record<string, Condition[]>
  )
}
