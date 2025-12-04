import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  GitBranch,
  Target,
  Wallet,
  Timer,
  Heart,
  Brain,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import {
  SEQUENCE_STATUS_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS,
  DELAY_UNIT_OPTIONS,
  TREATMENT_GOALS,
  AGE_RANGE_OPTIONS,
  SEX_OPTIONS,
  BUDGET_CONSTRAINT_OPTIONS,
  TIME_CONSTRAINT_OPTIONS,
  PATIENT_PRIORITY_OPTIONS,
  DENTAL_ANXIETY_OPTIONS,
} from '@/lib/constants'
import { TREATMENT_CATEGORIES, getTreatmentById } from '@/lib/constants/treatments'
import { createClient } from '@/lib/supabase/server'
import { SequenceHeader } from '@/components/sequences/sequence-header'
import type { TreatmentPlan, TreatmentCategory } from '@/types/database'

async function getSequenceWithDetails(id: string) {
  const supabase = await createClient()

  // Get sequence
  const { data: sequence, error: seqError } = await supabase
    .from('treatment_sequences')
    .select('*')
    .eq('id', id)
    .single()

  if (seqError || !sequence) return null

  // Get plan info (new structure)
  let plan: TreatmentPlan | null = null
  if (sequence.plan_id) {
    const { data: planData } = await supabase
      .from('treatment_plans')
      .select('*')
      .eq('id', sequence.plan_id)
      .single()
    plan = planData as unknown as TreatmentPlan
  }

  // Get creator
  const { data: creator } = await supabase
    .from('dentists')
    .select('full_name')
    .eq('id', sequence.created_by)
    .single()

  // Get appointment groups with treatments
  const { data: appointments } = await supabase
    .from('appointment_groups')
    .select('*')
    .eq('sequence_id', id)
    .order('position', { ascending: true })

  // Get treatments for each appointment
  const appointmentsWithTreatments = await Promise.all(
    (appointments || []).map(async (appt) => {
      const { data: treatments } = await supabase
        .from('treatments')
        .select('*')
        .eq('appointment_group_id', appt.id)
        .order('position', { ascending: true })

      return {
        ...appt,
        treatments: treatments || [],
      }
    })
  )

  return {
    ...sequence,
    plan,
    creator_name: creator?.full_name || 'Inconnu',
    appointments: appointmentsWithTreatments,
  }
}

function getLabel(options: readonly { value: string; label: string }[], value: string | null) {
  if (!value) return '-'
  const option = options.find((o) => o.value === value)
  return option?.label || value
}

export default async function SequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const sequence = await getSequenceWithDetails(id)

  if (!sequence) {
    notFound()
  }

  return (
    <>
      <Header />

      <div className="p-6 space-y-6">
        {/* Back button */}
        <Button variant="ghost" asChild>
          <Link href={sequence.plan ? `/plans/${sequence.plan.id}` : '/sequences'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {sequence.plan ? 'Retour au plan' : 'Retour aux séquences'}
          </Link>
        </Button>

        {/* Header with status control */}
        <SequenceHeader
          sequenceId={id}
          sequenceNumber={sequence.sequence_number || ''}
          title={sequence.title || 'Séquence sans titre'}
          status={sequence.status || 'draft'}
          planId={sequence.plan?.id}
          planNumber={sequence.plan?.plan_number || undefined}
          planTitle={sequence.plan?.title || sequence.plan?.raw_input}
        />

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Créé par {sequence.creator_name}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDate(sequence.created_at)}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {sequence.appointments.length} séance(s)
          </div>
        </div>

        {/* Plan info card */}
        {sequence.plan && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle className="text-base">Plan de traitement</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{sequence.plan.plan_number}</Badge>
                {sequence.plan.title && (
                  <span className="font-medium">{sequence.plan.title}</span>
                )}
              </div>
              <p className="font-mono text-sm text-muted-foreground">{sequence.plan.raw_input}</p>
              {sequence.plan.dentistry_types && sequence.plan.dentistry_types.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {sequence.plan.dentistry_types.map((type: TreatmentCategory) => (
                    <Badge key={type} variant="secondary" className={`text-xs ${TREATMENT_CATEGORIES[type]?.color || ''}`}>
                      {TREATMENT_CATEGORIES[type]?.name || type}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Patient context card - NEW */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle className="text-base">Contexte patient</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Demographics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Âge</p>
                <p className="font-medium">
                  {getLabel(AGE_RANGE_OPTIONS, sequence.patient_age_range)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sexe</p>
                <p className="font-medium">
                  {getLabel(SEX_OPTIONS, sequence.patient_sex)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  <Wallet className="h-3 w-3 inline mr-1" />
                  Budget
                </p>
                <p className="font-medium">
                  {getLabel(BUDGET_CONSTRAINT_OPTIONS, sequence.budget_constraint)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  <Timer className="h-3 w-3 inline mr-1" />
                  Temps
                </p>
                <p className="font-medium">
                  {getLabel(TIME_CONSTRAINT_OPTIONS, sequence.time_constraint)}
                </p>
                {sequence.time_constraint_details && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {sequence.time_constraint_details}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Priorities */}
            {sequence.patient_priorities && sequence.patient_priorities.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  Priorités du patient
                </p>
                <div className="flex flex-wrap gap-2">
                  {sequence.patient_priorities.map((priority: string) => (
                    <Badge key={priority} variant="secondary">
                      {PATIENT_PRIORITY_OPTIONS.find(o => o.value === priority)?.label || priority}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Anxiety */}
            {sequence.dental_anxiety && sequence.dental_anxiety !== 'none' && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  <Brain className="h-3 w-3 inline mr-1" />
                  Anxiété dentaire
                </p>
                <Badge variant={sequence.dental_anxiety === 'severe' ? 'destructive' : 'secondary'}>
                  {getLabel(DENTAL_ANXIETY_OPTIONS, sequence.dental_anxiety)}
                </Badge>
              </div>
            )}

            {/* Additional context */}
            {sequence.additional_context && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contexte additionnel</p>
                <p className="text-sm">{sequence.additional_context}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strategy and goals */}
        <div className="grid gap-6 md:grid-cols-2">
          {sequence.overall_strategy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Stratégie globale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{sequence.overall_strategy}</p>
              </CardContent>
            </Card>
          )}

          {sequence.treatment_goals && sequence.treatment_goals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Objectifs de traitement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {sequence.treatment_goals.map((goalId: string) => {
                    const goal = TREATMENT_GOALS.find((g) => g.id === goalId)
                    return (
                      <Badge key={goalId} variant="outline">
                        {goal?.name || goalId}
                      </Badge>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Appointments */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Séances de traitement
          </h2>

          {sequence.appointments.length > 0 ? (
            <div className="space-y-4">
              {sequence.appointments.map((appt: any, index: number) => (
                <Card key={appt.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{appt.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {getLabel(APPOINTMENT_TYPE_OPTIONS, appt.appointment_type)}
                            </Badge>
                            {appt.estimated_duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {appt.estimated_duration_minutes} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {index > 0 && appt.delay_value && (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {appt.delay_value} {getLabel(DELAY_UNIT_OPTIONS, appt.delay_unit)} après
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Objectives */}
                    {appt.objectives && appt.objectives.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Objectifs</p>
                        <p>{Array.isArray(appt.objectives) ? appt.objectives.join(', ') : appt.objectives}</p>
                      </div>
                    )}

                    {/* Delay rationale */}
                    {appt.delay_rationale && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Raison du délai</p>
                        <p>{appt.delay_rationale}</p>
                      </div>
                    )}

                    {/* Treatments */}
                    {appt.treatments && appt.treatments.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Traitements</p>
                        <div className="space-y-2">
                          {appt.treatments.map((treatment: any) => {
                            const treatmentInfo = getTreatmentById(treatment.treatment_type)
                            return (
                              <div
                                key={treatment.id}
                                className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {treatmentInfo?.name || treatment.treatment_type}
                                    </span>
                                    {treatment.teeth && treatment.teeth.length > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        Dent {treatment.teeth.join(', ')}
                                      </Badge>
                                    )}
                                  </div>
                                  {treatmentInfo?.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {treatmentInfo.description}
                                    </p>
                                  )}
                                  {treatment.rationale_treatment && (
                                    <p className="text-sm mt-2">
                                      <strong>Justification:</strong> {treatment.rationale_treatment}
                                    </p>
                                  )}
                                </div>
                                {treatment.estimated_duration_minutes && (
                                  <Badge variant="secondary" className="shrink-0">
                                    {treatment.estimated_duration_minutes} min
                                  </Badge>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Aucune séance définie</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
