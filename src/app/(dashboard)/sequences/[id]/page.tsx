import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Clock,
  User,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { TREATMENT_CATEGORIES } from '@/lib/constants/treatments'
import { createClient } from '@/lib/supabase/server'
import { SequenceHeader } from '@/components/sequences/sequence-header'
import { SequenceTimeline } from '@/components/sequences/sequence-timeline'
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
        treatments: (treatments || []).map(t => ({
          ...t,
          plan_item_ids: t.plan_item_ids || [],
        })),
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

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
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
        </div>

        {/* Plan info card - compact */}
        {sequence.plan && (
          <Card className="bg-muted/30">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground">Plan de traitement</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">{sequence.plan.plan_number}</Badge>
                {sequence.plan.title && (
                  <span className="font-medium text-sm">{sequence.plan.title}</span>
                )}
              </div>
              <p className="font-mono text-xs text-muted-foreground">{sequence.plan.raw_input}</p>
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

        {/* Overall strategy (if any) */}
        {sequence.overall_strategy && (
          <Card className="bg-blue-50/50 border-blue-200">
            <CardContent className="py-4">
              <p className="text-sm text-blue-900">{sequence.overall_strategy}</p>
            </CardContent>
          </Card>
        )}

        {/* Editable Timeline */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Séances de traitement</h2>
          <SequenceTimeline
            sequenceId={id}
            appointments={sequence.appointments}
          />
        </div>
      </div>
    </>
  )
}
