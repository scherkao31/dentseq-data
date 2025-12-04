'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Plus,
  GitBranch,
  Calendar,
  User,
  Wallet,
  Timer,
  Clock,
  Check,
  Sparkles,
  FileText,
  Loader2,
} from 'lucide-react'
import { TREATMENT_CATEGORIES, type TreatmentCategory } from '@/lib/constants/treatments'
import {
  AGE_RANGE_OPTIONS,
  SEX_OPTIONS,
  BUDGET_CONSTRAINT_OPTIONS,
  TIME_CONSTRAINT_OPTIONS,
  DENTAL_ANXIETY_OPTIONS,
  PATIENT_PRIORITY_OPTIONS,
  SEQUENCE_STATUS_OPTIONS,
} from '@/lib/constants'
import type { TreatmentPlan, TreatmentSequence, PlanStatus } from '@/types/database'

const PLAN_STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'active', label: 'Actif' },
  { value: 'completed', label: 'Terminé' },
  { value: 'archived', label: 'Archivé' },
]

type SequenceWithCounts = TreatmentSequence & {
  appointment_count: number
  treatment_count: number
}

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])
  const planId = params.id as string

  const [plan, setPlan] = useState<TreatmentPlan | null>(null)
  const [sequences, setSequences] = useState<SequenceWithCounts[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPlanAndSequences() {
      setIsLoading(true)

      // Load plan
      const { data: planData, error: planError } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (planError || !planData) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Plan de traitement non trouvé',
        })
        router.push('/plans')
        return
      }

      setPlan(planData as unknown as TreatmentPlan)

      // Load sequences
      const { data: seqData, error: seqError } = await supabase
        .from('treatment_sequences')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false })

      if (seqError) {
        console.error('Error loading sequences:', seqError)
      } else {
        // Get appointment and treatment counts
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

            // Map back to sequence
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

        const seqWithCounts = (seqData || []).map(seq => ({
          ...seq,
          appointment_count: appointmentCounts[seq.id] || 0,
          treatment_count: treatmentCounts[seq.id] || 0,
        })) as SequenceWithCounts[]

        setSequences(seqWithCounts)
      }

      setIsLoading(false)
    }

    loadPlanAndSequences()
  }, [planId, supabase, toast, router])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <>
        <Header title="Plan de traitement" />
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    )
  }

  if (!plan) {
    return null
  }

  return (
    <>
      <Header title={plan.title || plan.raw_input.slice(0, 50)} />

      <div className="p-6 space-y-6">
        {/* Back button */}
        <Button variant="ghost" asChild>
          <Link href="/plans">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux plans
          </Link>
        </Button>

        {/* Plan info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{plan.plan_number}</Badge>
                  <Badge variant={plan.status === 'active' ? 'default' : plan.status === 'completed' ? 'secondary' : 'outline'}>
                    {PLAN_STATUS_OPTIONS.find(o => o.value === plan.status)?.label || plan.status}
                  </Badge>
                  {plan.user_confirmed && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Confirmé
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">
                  {plan.title || 'Plan sans titre'}
                </CardTitle>
                <CardDescription className="font-mono mt-2">
                  {plan.raw_input}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Treatment items */}
            {plan.treatment_items && plan.treatment_items.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Éléments du plan</h4>
                <div className="space-y-2">
                  {plan.treatment_items.map((item, index) => (
                    <div key={item.id || index} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                      <Badge className={TREATMENT_CATEGORIES[item.category]?.color || ''}>
                        {TREATMENT_CATEGORIES[item.category]?.name || item.category}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium">{item.treatment_description}</div>
                        {item.teeth.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Dent{item.teeth.length > 1 ? 's' : ''}: {item.teeth.join(', ')}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground font-mono mt-1">
                          "{item.raw_text}"
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Categories and teeth summary */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Catégories de traitement</h4>
                <div className="flex flex-wrap gap-1">
                  {plan.dentistry_types?.map(type => (
                    <Badge key={type} variant="secondary" className={TREATMENT_CATEGORIES[type]?.color || ''}>
                      {TREATMENT_CATEGORIES[type]?.name || type}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Dents concernées</h4>
                <div className="flex flex-wrap gap-1">
                  {plan.teeth_involved?.map(tooth => (
                    <Badge key={tooth} variant="outline">{tooth}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            {plan.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{plan.notes}</p>
                </div>
              </>
            )}

            {/* Metadata */}
            <Separator />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Créé le {formatDate(plan.created_at)}
              </div>
              {plan.ai_parsing_confidence !== null && (
                <div className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Confiance IA: {Math.round((plan.ai_parsing_confidence || 0) * 100)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sequences section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Séquences de traitement</h2>
              <p className="text-sm text-muted-foreground">
                {sequences.length} séquence{sequences.length > 1 ? 's' : ''} pour ce plan
              </p>
            </div>
            <Button asChild>
              <Link href={`/sequences/new?planId=${plan.id}`}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle séquence
              </Link>
            </Button>
          </div>

          {sequences.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold mb-2">Aucune séquence</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                  Créez votre première séquence de traitement pour ce plan.
                  Chaque séquence représente une approche différente selon le contexte patient.
                </p>
                <Button asChild>
                  <Link href={`/sequences/new?planId=${plan.id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une séquence
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sequences.map(seq => {
                const statusOpt = SEQUENCE_STATUS_OPTIONS.find(o => o.value === seq.status)

                return (
                  <Link key={seq.id} href={`/sequences/${seq.id}`}>
                    <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{seq.sequence_number}</Badge>
                              <Badge
                                variant={seq.status === 'approved' ? 'default' : seq.status === 'draft' ? 'secondary' : 'outline'}
                              >
                                {statusOpt?.label || seq.status}
                              </Badge>
                            </div>
                            <CardTitle className="text-base">
                              {seq.title || `Séquence ${seq.sequence_number}`}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Patient context summary */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {seq.patient_age_range && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <User className="h-3 w-3" />
                              {AGE_RANGE_OPTIONS.find(o => o.value === seq.patient_age_range)?.label}
                            </div>
                          )}
                          {seq.patient_sex && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              {SEX_OPTIONS.find(o => o.value === seq.patient_sex)?.label}
                            </div>
                          )}
                          {seq.budget_constraint && seq.budget_constraint !== 'no_constraint' && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Wallet className="h-3 w-3" />
                              {BUDGET_CONSTRAINT_OPTIONS.find(o => o.value === seq.budget_constraint)?.label}
                            </div>
                          )}
                          {seq.time_constraint && seq.time_constraint !== 'no_constraint' && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Timer className="h-3 w-3" />
                              {TIME_CONSTRAINT_OPTIONS.find(o => o.value === seq.time_constraint)?.label}
                            </div>
                          )}
                        </div>

                        {/* Priorities */}
                        {seq.patient_priorities && seq.patient_priorities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {seq.patient_priorities.slice(0, 3).map(priority => (
                              <Badge key={priority} variant="secondary" className="text-xs">
                                {PATIENT_PRIORITY_OPTIONS.find(o => o.value === priority)?.label || priority}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <div className="flex items-center gap-3">
                            <span>{seq.appointment_count} séance{seq.appointment_count > 1 ? 's' : ''}</span>
                            <span>{seq.treatment_count} traitement{seq.treatment_count > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(seq.created_at)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
