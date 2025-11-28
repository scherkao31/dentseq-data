import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  GitBranch,
  Target,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import {
  SEQUENCE_STATUS_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS,
  DELAY_UNIT_OPTIONS,
  TREATMENT_GOALS,
} from '@/lib/constants'
import { TREATMENTS, getTreatmentById } from '@/lib/constants/treatments'
import { createClient } from '@/lib/supabase/server'
import { SequenceHeader } from '@/components/sequences/sequence-header'

async function getSequenceWithDetails(id: string) {
  const supabase = await createClient()

  // Get sequence
  const { data: sequence, error: seqError } = await supabase
    .from('treatment_sequences')
    .select('*')
    .eq('id', id)
    .single()

  if (seqError || !sequence) return null

  // Get case info
  const { data: caseData } = await supabase
    .from('clinical_cases')
    .select('id, case_number, title')
    .eq('id', sequence.case_id)
    .single()

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
    case: caseData,
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
        {/* Header with status control */}
        <SequenceHeader
          sequenceId={id}
          sequenceNumber={sequence.sequence_number || ''}
          title={sequence.title || 'Séquence sans titre'}
          status={sequence.status || 'draft'}
          caseId={sequence.case?.id}
          caseNumber={sequence.case?.case_number}
          caseTitle={sequence.case?.title}
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
