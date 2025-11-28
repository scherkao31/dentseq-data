import { anthropic } from '@ai-sdk/anthropic'
import { streamText, createUIMessageStreamResponse, createUIMessageStream } from 'ai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

const SYSTEM_PROMPT = `Tu es un assistant expert en dentisterie qui aide à générer des idées de cas cliniques pour un dataset d'entraînement d'IA.

Ton rôle est de suggérer des idées de plans de traitement dentaire variés et réalistes, en tenant compte:
- Des cas déjà existants dans la base de données (pour éviter les doublons et améliorer la diversité)
- Des catégories de traitement manquantes
- Des combinaisons de facteurs patients (âge, complexité, état parodontal, etc.)
- Des scénarios cliniques courants et moins courants

Quand tu suggères des cas, inclus:
1. Un titre descriptif
2. Le motif de consultation principal
3. Les caractéristiques patient suggérées (âge, hygiène, compliance, etc.)
4. La complexité estimée
5. Les types de traitements probables
6. Pourquoi ce cas serait utile pour le dataset

Réponds toujours en français. Sois concis mais informatif.`

async function getDatasetSummary() {
  const supabase = await createClient()

  // Get cases summary
  const { data: cases } = await supabase
    .from('clinical_cases')
    .select('title, complexity, patient_age_range, patient_general_health, perio_stage, chief_complaint')

  // Get treatment categories used
  const { data: treatments } = await supabase
    .from('treatments')
    .select('treatment_category, treatment_type')

  const caseCount = cases?.length || 0
  const complexityDist: Record<string, number> = {}
  const ageDist: Record<string, number> = {}
  const perioDist: Record<string, number> = {}

  cases?.forEach(c => {
    if (c.complexity) complexityDist[c.complexity] = (complexityDist[c.complexity] || 0) + 1
    if (c.patient_age_range) ageDist[c.patient_age_range] = (ageDist[c.patient_age_range] || 0) + 1
    if (c.perio_stage) perioDist[c.perio_stage] = (perioDist[c.perio_stage] || 0) + 1
  })

  const categoryDist: Record<string, number> = {}
  treatments?.forEach(t => {
    if (t.treatment_category) categoryDist[t.treatment_category] = (categoryDist[t.treatment_category] || 0) + 1
  })

  const allCategories = ['diagnostic', 'preventive', 'restorative', 'endodontic', 'periodontal', 'surgical', 'implant', 'prosthetic', 'orthodontic']
  const missingCategories = allCategories.filter(c => !categoryDist[c])

  const existingTitles = cases?.map(c => c.title).filter(Boolean) || []

  return {
    caseCount,
    complexityDist,
    ageDist,
    perioDist,
    categoryDist,
    missingCategories,
    existingTitles,
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Get dataset summary for context
  const summary = await getDatasetSummary()

  const contextMessage = `
ÉTAT ACTUEL DU DATASET:
- Nombre de cas: ${summary.caseCount}
- Distribution par complexité: ${JSON.stringify(summary.complexityDist)}
- Distribution par âge: ${JSON.stringify(summary.ageDist)}
- Distribution par stade parodontal: ${JSON.stringify(summary.perioDist)}
- Catégories de traitement utilisées: ${JSON.stringify(summary.categoryDist)}
- Catégories manquantes: ${summary.missingCategories.join(', ') || 'Aucune'}
- Titres des cas existants: ${summary.existingTitles.slice(0, 20).join(', ') || 'Aucun cas'}

Utilise ces informations pour suggérer des cas qui amélioreraient la diversité et la qualité du dataset.
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
