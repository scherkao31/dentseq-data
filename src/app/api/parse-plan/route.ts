import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'
import { TREATMENTS, TREATMENT_CATEGORIES, type TreatmentCategory } from '@/lib/constants/treatments'

export const maxDuration = 30

// Schema for parsed treatment items
const TreatmentItemSchema = z.object({
  raw_text: z.string().describe('The original text segment being parsed'),
  teeth: z.array(z.string()).describe('FDI tooth numbers (11-18, 21-28, 31-38, 41-48) or quadrant codes (Q1, Q2, Q3, Q4) or "all"'),
  treatment_type: z.string().nullable().describe('Matched treatment ID from the taxonomy, or null if custom/not found'),
  treatment_description: z.string().describe('Human-readable description in French'),
  category: z.enum([
    'diagnostic', 'preventive', 'restorative', 'endodontic',
    'periodontal', 'surgical', 'implant', 'prosthetic', 'orthodontic', 'other'
  ]).describe('Treatment category'),
})

const ParseResultSchema = z.object({
  items: z.array(TreatmentItemSchema),
  confidence: z.number().min(0).max(1).describe('Overall confidence score'),
  notes: z.string().optional().describe('Any parsing notes or ambiguities'),
})

// Build the treatment taxonomy for the prompt
function buildTreatmentTaxonomy(): string {
  const byCategory: Record<string, string[]> = {}

  for (const treatment of TREATMENTS) {
    if (!byCategory[treatment.category]) {
      byCategory[treatment.category] = []
    }
    byCategory[treatment.category].push(`  - ${treatment.id}: ${treatment.name}${treatment.description ? ` (${treatment.description})` : ''}`)
  }

  let result = ''
  for (const [category, treatments] of Object.entries(byCategory)) {
    const catInfo = TREATMENT_CATEGORIES[category as TreatmentCategory]
    result += `\n${catInfo?.name || category}:\n${treatments.join('\n')}`
  }

  return result
}

const SYSTEM_PROMPT = `Tu es un expert en dentisterie qui parse des plans de traitement écrits en notation clinique abrégée.

NOTATION DENTAIRE FDI:
- Quadrant 1 (sup droit): 11-18
- Quadrant 2 (sup gauche): 21-28
- Quadrant 3 (inf gauche): 31-38
- Quadrant 4 (inf droit): 41-48

ABRÉVIATIONS COURANTES:
- CC = couronne céramique / couronne complète
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
- Q1, Q2, Q3, Q4 = quadrants

TAXONOMIE DES TRAITEMENTS DISPONIBLES:
${buildTreatmentTaxonomy()}

INSTRUCTIONS:
1. Parse chaque élément du plan de traitement
2. Identifie les dents concernées (notation FDI)
3. Matche avec un treatment_type de la taxonomie si possible
4. Assigne la catégorie appropriée
5. Génère une description claire en français

EXEMPLES:
- "46 démonter CC + prov" → dent 46, dépose couronne + provisoire, restorative
- "36 impl" → dent 36, pose d'implant, implant
- "SRP Q1-Q2" → quadrants 1 et 2, surfaçage radiculaire, periodontal
- "11-21 facettes" → dents 11 et 21, facettes, restorative
- "ext 38 48" → dents 38 et 48, extractions, surgical`

export async function POST(req: Request) {
  try {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set')
      return Response.json({ error: 'API configuration error' }, { status: 500 })
    }

    const { rawInput } = await req.json()

    if (!rawInput || typeof rawInput !== 'string') {
      return Response.json({ error: 'rawInput is required' }, { status: 400 })
    }

    console.log('Parsing treatment plan:', rawInput)

    const result = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: ParseResultSchema,
      system: SYSTEM_PROMPT,
      prompt: `Parse ce plan de traitement dentaire:\n\n"${rawInput}"\n\nRetourne les éléments structurés avec les dents, types de traitement, et catégories.`,
    })

    // Add unique IDs to each item
    const itemsWithIds = result.object.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      ...item,
    }))

    // Derive dentistry types and teeth involved
    const dentistryTypes = Array.from(new Set(itemsWithIds.map(item => item.category)))
    const teethInvolved = Array.from(new Set(itemsWithIds.flatMap(item => item.teeth)))

    return Response.json({
      success: true,
      items: itemsWithIds,
      dentistryTypes,
      teethInvolved,
      confidence: result.object.confidence,
      notes: result.object.notes,
    })
  } catch (error: any) {
    console.error('Error parsing treatment plan:', error)
    return Response.json(
      {
        error: 'Failed to parse treatment plan',
        details: error?.message || String(error),
        code: error?.code,
      },
      { status: 500 }
    )
  }
}
