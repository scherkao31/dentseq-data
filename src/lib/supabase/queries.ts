/**
 * Supabase query helpers with proper typing
 * These wrappers help avoid TypeScript issues with Supabase's strict generic types
 */

import { createClient } from './server'
import type { ClinicalCase, Dentist, SequenceOverview, CaseOverview } from '@/types/database'

export async function getCaseById(id: string): Promise<ClinicalCase | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinical_cases')
    .select('*')
    .eq('id', id as unknown as never)
    .single()

  if (error) return null
  return data as unknown as ClinicalCase
}

export async function getCaseOverviewById(id: string): Promise<CaseOverview | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('case_overview')
    .select('*')
    .eq('id', id as unknown as never)
    .single()

  if (error) return null
  return data as unknown as CaseOverview
}

export async function getCaseOverviews(options?: {
  status?: string
  complexity?: string
  limit?: number
}): Promise<CaseOverview[]> {
  const supabase = await createClient()
  let query = supabase
    .from('case_overview')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status as unknown as never)
  }

  if (options?.complexity && options.complexity !== 'all') {
    query = query.eq('complexity', options.complexity as unknown as never)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) return []
  return (data || []) as unknown as CaseOverview[]
}

export async function getSequenceOverviewsByCaseId(caseId: string): Promise<SequenceOverview[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sequence_overview')
    .select('*')
    .eq('case_id', caseId as unknown as never)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data || []) as unknown as SequenceOverview[]
}

export async function getSequenceOverviews(options?: {
  status?: string
  limit?: number
}): Promise<SequenceOverview[]> {
  const supabase = await createClient()
  let query = supabase
    .from('sequence_overview')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status as unknown as never)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) return []
  return (data || []) as unknown as SequenceOverview[]
}

export async function getDentistById(id: string): Promise<Dentist | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dentists')
    .select('*')
    .eq('id', id as unknown as never)
    .single()

  if (error) return null
  return data as unknown as Dentist
}

export async function getDentistByAuthId(authUserId: string): Promise<Dentist | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dentists')
    .select('*')
    .eq('auth_user_id', authUserId as unknown as never)
    .single()

  if (error) return null
  return data as unknown as Dentist
}

export async function getStats() {
  const supabase = await createClient()

  const [casesResult, sequencesResult, evaluationsResult] = await Promise.all([
    supabase.from('clinical_cases').select('id', { count: 'exact', head: true }),
    supabase.from('treatment_sequences').select('id', { count: 'exact', head: true }),
    supabase.from('sequence_evaluations').select('id', { count: 'exact', head: true }),
  ])

  return {
    cases: casesResult.count || 0,
    sequences: sequencesResult.count || 0,
    evaluations: evaluationsResult.count || 0,
  }
}

export async function getCasesWithoutSequences(limit?: number): Promise<CaseOverview[]> {
  const supabase = await createClient()
  let query = supabase
    .from('case_overview')
    .select('*')
    .eq('status', 'published' as unknown as never)
    .eq('sequence_count', 0 as unknown as never)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) return []
  return (data || []) as unknown as CaseOverview[]
}

// ============================================
// STATISTICS QUERIES
// ============================================

export interface DatasetStats {
  totals: {
    cases: number
    sequences: number
    treatments: number
    appointments: number
    approvedCases: number
    approvedSequences: number
  }
  caseDistributions: {
    byComplexity: Record<string, number>
    byAgeRange: Record<string, number>
    bySex: Record<string, number>
    byGeneralHealth: Record<string, number>
    byOralHygiene: Record<string, number>
    byCompliance: Record<string, number>
    byPerioStage: Record<string, number>
    byPerioGrade: Record<string, number>
    byStatus: Record<string, number>
  }
  sequenceDistributions: {
    byStatus: Record<string, number>
    byTreatmentGoals: Record<string, number>
  }
  treatmentDistributions: {
    byCategory: Record<string, number>
    byType: Record<string, number>
    byTeeth: Record<string, number>
  }
  coverage: {
    teethWithData: string[]
    teethWithoutData: string[]
    categoriesWithData: string[]
    categoriesMissing: string[]
  }
}

export async function getDatasetStatistics(): Promise<DatasetStats> {
  const supabase = await createClient()

  // Fetch all data in parallel
  const [
    casesResult,
    sequencesResult,
    appointmentsResult,
    treatmentsResult,
  ] = await Promise.all([
    supabase.from('clinical_cases').select('*'),
    supabase.from('treatment_sequences').select('*'),
    supabase.from('appointment_groups').select('*'),
    supabase.from('treatments').select('*'),
  ])

  const cases = (casesResult.data || []) as any[]
  const sequences = (sequencesResult.data || []) as any[]
  const appointments = (appointmentsResult.data || []) as any[]
  const treatments = (treatmentsResult.data || []) as any[]

  // Count distributions
  const countBy = <T>(items: T[], key: keyof T): Record<string, number> => {
    return items.reduce((acc, item) => {
      const value = String(item[key] || 'non_renseigné')
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // Count array field occurrences
  const countArrayField = <T>(items: T[], key: keyof T): Record<string, number> => {
    return items.reduce((acc, item) => {
      const arr = item[key] as unknown as string[] | null
      if (Array.isArray(arr)) {
        arr.forEach(value => {
          acc[value] = (acc[value] || 0) + 1
        })
      }
      return acc
    }, {} as Record<string, number>)
  }

  // Count teeth from treatments
  const teethCount: Record<string, number> = {}
  treatments.forEach(t => {
    const teeth = t.teeth as string[] | null
    if (Array.isArray(teeth)) {
      teeth.forEach(tooth => {
        teethCount[tooth] = (teethCount[tooth] || 0) + 1
      })
    }
  })

  // All possible teeth (FDI notation)
  const allTeeth = [
    // Upper right (quadrant 1)
    '18', '17', '16', '15', '14', '13', '12', '11',
    // Upper left (quadrant 2)
    '21', '22', '23', '24', '25', '26', '27', '28',
    // Lower left (quadrant 3)
    '38', '37', '36', '35', '34', '33', '32', '31',
    // Lower right (quadrant 4)
    '41', '42', '43', '44', '45', '46', '47', '48',
  ]

  const teethWithData = Object.keys(teethCount)
  const teethWithoutData = allTeeth.filter(t => !teethWithData.includes(t))

  // All treatment categories
  const allCategories = [
    'diagnostic', 'preventive', 'restorative', 'endodontic',
    'periodontal', 'surgical', 'implant', 'prosthetic', 'orthodontic', 'other'
  ]
  const categoriesWithData = Array.from(new Set(treatments.map(t => t.treatment_category)))
  const categoriesMissing = allCategories.filter(c => !categoriesWithData.includes(c))

  return {
    totals: {
      cases: cases.length,
      sequences: sequences.length,
      treatments: treatments.length,
      appointments: appointments.length,
      approvedCases: cases.filter(c => c.status === 'approved').length,
      approvedSequences: sequences.filter(s => s.status === 'approved').length,
    },
    caseDistributions: {
      byComplexity: countBy(cases, 'complexity'),
      byAgeRange: countBy(cases, 'patient_age_range'),
      bySex: countBy(cases, 'patient_sex'),
      byGeneralHealth: countBy(cases, 'patient_general_health'),
      byOralHygiene: countBy(cases, 'patient_oral_hygiene'),
      byCompliance: countBy(cases, 'patient_compliance'),
      byPerioStage: countBy(cases, 'perio_stage'),
      byPerioGrade: countBy(cases, 'perio_grade'),
      byStatus: countBy(cases, 'status'),
    },
    sequenceDistributions: {
      byStatus: countBy(sequences, 'status'),
      byTreatmentGoals: countArrayField(sequences, 'treatment_goals'),
    },
    treatmentDistributions: {
      byCategory: countBy(treatments, 'treatment_category'),
      byType: countBy(treatments, 'treatment_type'),
      byTeeth: teethCount,
    },
    coverage: {
      teethWithData,
      teethWithoutData,
      categoriesWithData,
      categoriesMissing,
    },
  }
}
