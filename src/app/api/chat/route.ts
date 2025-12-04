import { anthropic } from '@ai-sdk/anthropic'
import { streamText, createUIMessageStreamResponse, createUIMessageStream } from 'ai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

const SYSTEM_PROMPT = `Tu es un assistant expert en dentisterie qui aide à générer des idées de plans de traitement pour un dataset d'entraînement d'IA.

Ton rôle est de suggérer des idées de plans de traitement dentaire variés et réalistes, en tenant compte:
- Des plans déjà existants dans la base de données (pour éviter les doublons et améliorer la diversité)
- Des catégories de traitement manquantes ou sous-représentées
- Des combinaisons de contextes patients variés (âge, budget, temps, priorités, anxiété)
- Des scénarios cliniques courants et moins courants

Le système fonctionne ainsi:
- Un PLAN DE TRAITEMENT est une liste de traitements à effectuer (ex: "46 démonter CC + prov, 47 SRP")
- Une SÉQUENCE est une organisation des traitements du plan selon un contexte patient spécifique
- Le même plan peut avoir plusieurs séquences pour différents profils patients

Quand tu suggères des plans, inclus:
1. Le plan de traitement en notation dentaire (ex: "46 CC, 47 impl + couronne")
2. Un titre descriptif
3. Les catégories de traitement impliquées
4. Les dents concernées (notation FDI: 11-18, 21-28, 31-38, 41-48)
5. Des exemples de contextes patients intéressants à créer des séquences pour
6. Pourquoi ce plan serait utile pour le dataset

Contextes patients possibles:
- Âge: enfant (0-12), adolescent (13-17), jeune adulte (18-30), adulte (31-50), senior (51-70), très âgé (70+)
- Budget: sans contrainte, modéré, limité, très limité
- Temps: sans contrainte, modéré, urgent, très urgent
- Priorités: fonction, esthétique, coût, temps, durabilité, intervention minimale
- Anxiété: aucune, légère, modérée, sévère

Réponds toujours en français. Sois concis mais informatif.`

async function getDatasetSummary() {
  const supabase = await createClient()

  // Get plans summary
  const { data: plans } = await supabase
    .from('treatment_plans')
    .select('title, raw_input, dentistry_types, teeth_involved, status')

  // Get sequences summary with patient context
  const { data: sequences } = await supabase
    .from('treatment_sequences')
    .select('patient_age_range, patient_sex, budget_constraint, time_constraint, patient_priorities, dental_anxiety')

  // Get treatment categories used
  const { data: treatments } = await supabase
    .from('treatments')
    .select('treatment_category, treatment_type')

  const planCount = plans?.length || 0
  const sequenceCount = sequences?.length || 0

  // Plan stats
  const categoryDist: Record<string, number> = {}
  const teethDist: Record<string, number> = {}
  const planStatusDist: Record<string, number> = {}

  plans?.forEach(p => {
    if (p.status) planStatusDist[p.status] = (planStatusDist[p.status] || 0) + 1
    p.dentistry_types?.forEach((cat: string) => {
      categoryDist[cat] = (categoryDist[cat] || 0) + 1
    })
    p.teeth_involved?.forEach((tooth: string) => {
      teethDist[tooth] = (teethDist[tooth] || 0) + 1
    })
  })

  // Sequence patient context stats
  const ageDist: Record<string, number> = {}
  const sexDist: Record<string, number> = {}
  const budgetDist: Record<string, number> = {}
  const timeDist: Record<string, number> = {}
  const priorityDist: Record<string, number> = {}
  const anxietyDist: Record<string, number> = {}

  sequences?.forEach(s => {
    if (s.patient_age_range) ageDist[s.patient_age_range] = (ageDist[s.patient_age_range] || 0) + 1
    if (s.patient_sex) sexDist[s.patient_sex] = (sexDist[s.patient_sex] || 0) + 1
    if (s.budget_constraint) budgetDist[s.budget_constraint] = (budgetDist[s.budget_constraint] || 0) + 1
    if (s.time_constraint) timeDist[s.time_constraint] = (timeDist[s.time_constraint] || 0) + 1
    if (s.dental_anxiety) anxietyDist[s.dental_anxiety] = (anxietyDist[s.dental_anxiety] || 0) + 1
    s.patient_priorities?.forEach((priority: string) => {
      priorityDist[priority] = (priorityDist[priority] || 0) + 1
    })
  })

  // Treatment stats
  const treatmentCategoryDist: Record<string, number> = {}
  treatments?.forEach(t => {
    if (t.treatment_category) treatmentCategoryDist[t.treatment_category] = (treatmentCategoryDist[t.treatment_category] || 0) + 1
  })

  const allCategories = ['diagnostic', 'preventive', 'restorative', 'endodontic', 'periodontal', 'surgical', 'implant', 'prosthetic', 'orthodontic']
  const missingCategories = allCategories.filter(c => !categoryDist[c])
  const underrepresentedCategories = allCategories.filter(c => (categoryDist[c] || 0) < 3)

  const existingPlans = plans?.map(p => p.raw_input).filter(Boolean).slice(0, 15) || []

  return {
    planCount,
    sequenceCount,
    categoryDist,
    teethDist,
    planStatusDist,
    ageDist,
    sexDist,
    budgetDist,
    timeDist,
    priorityDist,
    anxietyDist,
    treatmentCategoryDist,
    missingCategories,
    underrepresentedCategories,
    existingPlans,
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Get dataset summary for context
  const summary = await getDatasetSummary()

  const contextMessage = `
ÉTAT ACTUEL DU DATASET:

PLANS DE TRAITEMENT:
- Nombre de plans: ${summary.planCount}
- Statuts: ${JSON.stringify(summary.planStatusDist)}
- Catégories utilisées: ${JSON.stringify(summary.categoryDist)}
- Dents les plus traitées: ${Object.entries(summary.teethDist).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k}(${v})`).join(', ') || 'Aucune'}
- Catégories manquantes: ${summary.missingCategories.join(', ') || 'Aucune'}
- Catégories sous-représentées (<3 plans): ${summary.underrepresentedCategories.join(', ') || 'Aucune'}
- Plans existants (exemples): ${summary.existingPlans.join(' | ') || 'Aucun plan'}

SÉQUENCES (${summary.sequenceCount} au total):
- Distribution par âge: ${JSON.stringify(summary.ageDist)}
- Distribution par sexe: ${JSON.stringify(summary.sexDist)}
- Contraintes budget: ${JSON.stringify(summary.budgetDist)}
- Contraintes temps: ${JSON.stringify(summary.timeDist)}
- Priorités patients: ${JSON.stringify(summary.priorityDist)}
- Niveaux d'anxiété: ${JSON.stringify(summary.anxietyDist)}

TRAITEMENTS DÉTAILLÉS:
- Catégories de traitements: ${JSON.stringify(summary.treatmentCategoryDist)}

Utilise ces informations pour suggérer des plans qui amélioreraient la diversité et la qualité du dataset.
Suggère aussi des contextes patients intéressants pour créer des séquences variées.
`

  // Convert UI messages to core messages format
  const coreMessages = messages.map((msg: any) => {
    const textParts = msg.parts?.filter((p: any) => p.type === 'text') || []
    const content = textParts.map((p: any) => p.text).join('\n') || ''
    return {
      role: msg.role,
      content,
    }
  })

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        system: SYSTEM_PROMPT + '\n\n' + contextMessage,
        messages: coreMessages,
      })

      // Consume the text stream and write to UI message stream
      for await (const textPart of result.textStream) {
        writer.write({
          type: 'text-delta',
          delta: textPart,
          id: 'assistant-msg',
        })
      }
    },
  })

  return createUIMessageStreamResponse({ stream })
}
