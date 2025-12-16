'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  Search,
  GitBranch,
  Star,
  Calendar,
  User,
  Wallet,
  Timer,
  Clock,
  Trash2,
} from 'lucide-react'
import { DeleteSequenceButton } from '@/components/sequences/delete-sequence-button'
import {
  SEQUENCE_STATUS_OPTIONS,
  AGE_RANGE_OPTIONS,
  SEX_OPTIONS,
  BUDGET_CONSTRAINT_OPTIONS,
  TIME_CONSTRAINT_OPTIONS,
  PATIENT_PRIORITY_OPTIONS,
} from '@/lib/constants'
import { StatusBadge } from '@/components/status/status-control'
import type { TreatmentSequence, TreatmentPlan } from '@/types/database'

type SequenceWithPlanAndCounts = TreatmentSequence & {
  plan?: TreatmentPlan | null
  appointment_count: number
  treatment_count: number
}

export default function SequencesPage() {
  const supabase = useMemo(() => createClient(), [])
  const [sequences, setSequences] = useState<SequenceWithPlanAndCounts[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [reloadKey, setReloadKey] = useState(0)

  const handleSequenceDeleted = () => {
    setReloadKey(prev => prev + 1)
  }

  useEffect(() => {
    async function loadSequences() {
      setIsLoading(true)

      // Load sequences with plan_id
      const { data: seqData, error } = await supabase
        .from('treatment_sequences')
        .select('*')
        .not('plan_id', 'is', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading sequences:', error)
        setIsLoading(false)
        return
      }

      // Get unique plan IDs
      const planIds = Array.from(new Set(seqData?.map(s => s.plan_id).filter(Boolean))) as string[]

      // Load plans
      let plansMap: Record<string, TreatmentPlan> = {}
      if (planIds.length > 0) {
        const { data: plansData } = await supabase
          .from('treatment_plans')
          .select('*')
          .in('id', planIds)

        plansData?.forEach(p => {
          plansMap[p.id] = p as unknown as TreatmentPlan
        })
      }

      // Get appointment counts
      const seqIds = seqData?.map(s => s.id) || []
      let appointmentCounts: Record<string, number> = {}
      let treatmentCounts: Record<string, number> = {}

      if (seqIds.length > 0) {
        const { data: appointments } = await supabase
          .from('appointment_groups')
          .select('id, sequence_id')
          .in('sequence_id', seqIds)

        appointments?.forEach(a => {
          appointmentCounts[a.sequence_id] = (appointmentCounts[a.sequence_id] || 0) + 1
        })

        const appointmentIds = appointments?.map(a => a.id) || []
        if (appointmentIds.length > 0) {
          const { data: treatments } = await supabase
            .from('treatments')
            .select('appointment_group_id')
            .in('appointment_group_id', appointmentIds)

          const apptToSeq: Record<string, string> = {}
          appointments?.forEach(a => { apptToSeq[a.id] = a.sequence_id })

          treatments?.forEach(t => {
            const seqId = apptToSeq[t.appointment_group_id]
            if (seqId) {
              treatmentCounts[seqId] = (treatmentCounts[seqId] || 0) + 1
            }
          })
        }
      }

      const seqWithData = (seqData || []).map(seq => ({
        ...seq,
        plan: seq.plan_id ? plansMap[seq.plan_id] : null,
        appointment_count: appointmentCounts[seq.id] || 0,
        treatment_count: treatmentCounts[seq.id] || 0,
      })) as SequenceWithPlanAndCounts[]

      setSequences(seqWithData)
      setIsLoading(false)
    }

    loadSequences()
  }, [supabase, reloadKey])

  const filteredSequences = useMemo(() => {
    return sequences.filter(seq => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesTitle = seq.title?.toLowerCase().includes(search)
        const matchesNumber = seq.sequence_number?.toLowerCase().includes(search)
        const matchesPlan = seq.plan?.raw_input?.toLowerCase().includes(search)
        if (!matchesTitle && !matchesNumber && !matchesPlan) return false
      }

      // Status filter
      if (statusFilter !== 'all' && seq.status !== statusFilter) return false

      return true
    })
  }, [sequences, searchTerm, statusFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <>
      <Header title="Séquences de traitement" />

      <div className="p-6 space-y-6">
        {/* Actions bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher une séquence..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {SEQUENCE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button asChild>
            <Link href="/plans">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle séquence
            </Link>
          </Button>
        </div>

        {/* Sequences list */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSequences.length > 0 ? (
          <div className="grid gap-4">
            {filteredSequences.map((sequence) => (
              <Card key={sequence.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <Link href={`/sequences/${sequence.id}`} className="flex-1 min-w-0 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">
                          {sequence.sequence_number}
                        </span>
                        <StatusBadge
                          status={sequence.status || 'draft'}
                          options={SEQUENCE_STATUS_OPTIONS}
                        />
                      </div>
                      <h3 className="font-semibold truncate">
                        {sequence.title || 'Séquence sans titre'}
                      </h3>

                      {/* Plan info */}
                      {sequence.plan && (
                        <p className="text-sm text-muted-foreground mt-1 font-mono truncate">
                          {sequence.plan.plan_number}: {sequence.plan.raw_input}
                        </p>
                      )}

                      {/* Patient context */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {sequence.patient_age_range && (
                          <Badge variant="outline" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            {AGE_RANGE_OPTIONS.find(o => o.value === sequence.patient_age_range)?.label}
                          </Badge>
                        )}
                        {sequence.patient_sex && (
                          <Badge variant="outline" className="text-xs">
                            {SEX_OPTIONS.find(o => o.value === sequence.patient_sex)?.label}
                          </Badge>
                        )}
                        {sequence.budget_constraint && sequence.budget_constraint !== 'no_constraint' && (
                          <Badge variant="secondary" className="text-xs">
                            <Wallet className="h-3 w-3 mr-1" />
                            {BUDGET_CONSTRAINT_OPTIONS.find(o => o.value === sequence.budget_constraint)?.label}
                          </Badge>
                        )}
                        {sequence.time_constraint && sequence.time_constraint !== 'no_constraint' && (
                          <Badge variant="secondary" className="text-xs">
                            <Timer className="h-3 w-3 mr-1" />
                            {TIME_CONSTRAINT_OPTIONS.find(o => o.value === sequence.time_constraint)?.label}
                          </Badge>
                        )}
                      </div>

                      {/* Patient priorities */}
                      {sequence.patient_priorities && sequence.patient_priorities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sequence.patient_priorities.slice(0, 3).map(priority => (
                            <Badge key={priority} variant="secondary" className="text-xs bg-primary/10">
                              {PATIENT_PRIORITY_OPTIONS.find(o => o.value === priority)?.label || priority}
                            </Badge>
                          ))}
                          {sequence.patient_priorities.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{sequence.patient_priorities.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(sequence.created_at)}
                        </span>
                      </div>
                    </Link>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <GitBranch className="h-4 w-4" />
                            <span className="font-medium">{sequence.appointment_count || 0}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">séances</span>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="font-medium">{sequence.treatment_count || 0}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">traitements</span>
                        </div>
                      </div>

                      <DeleteSequenceButton
                        sequenceId={sequence.id}
                        sequenceNumber={sequence.sequence_number || undefined}
                        onDeleted={handleSequenceDeleted}
                        size="icon"
                        showLabel={false}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-1">
                {sequences.length === 0 ? 'Aucune séquence' : 'Aucun résultat'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                {sequences.length === 0
                  ? 'Commencez par créer un plan de traitement, puis ajoutez-y des séquences.'
                  : 'Modifiez vos filtres pour afficher plus de résultats.'}
              </p>
              {sequences.length === 0 && (
                <Button asChild>
                  <Link href="/plans/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un plan
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
