/**
 * Default AI Settings
 * These are the default values used when no custom settings exist in the database.
 * Future AI features can add their own default sections here.
 */

import type { AISettingConfig, AISettingKey } from '@/types/database'

// ============================================================================
// PLAN PARSER DEFAULTS
// ============================================================================

export const DEFAULT_ABBREVIATIONS = `- CC = couronne céramique / couronne complète
- CCM = couronne céramo-métallique
- prov = provisoire
- endo = traitement endodontique / dévitalisation
- ext = extraction
- impl = implant
- SRP = surfaçage radiculaire
- détartrage = scaling/prophylaxis
- compo = composite
- amalg = amalgame
- RCT = root canal treatment
- IC = inlay-core
- bridge = prothèse fixée plurale
- PAP = prothèse amovible partielle
- PAC = prothèse amovible complète
- Q1, Q2, Q3, Q4 = quadrants`

export const DEFAULT_CUSTOM_TREATMENTS = ``

export const DEFAULT_CUSTOM_INSTRUCTIONS = ``

// ============================================================================
// DEFAULT CONFIGS BY SETTING KEY
// ============================================================================

export const DEFAULT_AI_SETTINGS: Record<AISettingKey, AISettingConfig> = {
  plan_parser: {
    abbreviations: DEFAULT_ABBREVIATIONS,
    custom_treatments: DEFAULT_CUSTOM_TREATMENTS,
    custom_instructions: DEFAULT_CUSTOM_INSTRUCTIONS,
  },
  // Future AI features can add their defaults here:
  // sequence_suggester: { ... },
  // treatment_advisor: { ... },
}

/**
 * Get default config for a specific AI setting key
 */
export function getDefaultAIConfig(key: AISettingKey): AISettingConfig {
  return DEFAULT_AI_SETTINGS[key] || {
    abbreviations: '',
    custom_treatments: '',
    custom_instructions: '',
  }
}
