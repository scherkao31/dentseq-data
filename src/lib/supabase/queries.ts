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
