'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  Clock,
  ArrowDown,
  Hourglass,
  MessageSquare,
  ListChecks,
  Link2,
} from 'lucide-react'
import {
  DELAY_UNIT_OPTIONS,
  ORDER_CONSTRAINT_OPTIONS,
} from '@/lib/constants'
import { TREATMENT_CATEGORIES } from '@/lib/constants/treatments'
import { useFormOptions } from '@/hooks/use-form-options'
import type { TreatmentCategory, OrderConstraint } from '@/types/database'

type Treatment = {
  id: string
  position: number
  treatment_type: string
  treatment_category: TreatmentCategory
  teeth: string[]
  rationale_treatment: string | null
  estimated_duration_minutes: number | null
  order_constraint: OrderConstraint
  order_rationale: string | null
  plan_item_ids: string[]
}

type Appointment = {
  id: string
  position: number
  title: string
  appointment_type: string
  objectives: string[] | null
  delay_value: number | null
  delay_unit: string
  delay_reason: string | null
  delay_rationale_text: string | null
  grouping_rationale: string | null
  estimated_duration_minutes: number | null
  treatments: Treatment[]
}

type SequenceReadViewProps = {
  appointments: Appointment[]
  planItems?: Array<{
    id: string
    treatment_description: string
    teeth: string[]
    category: TreatmentCategory
  }>
}

export function SequenceReadView({ appointments, planItems }: SequenceReadViewProps) {
  const { treatments: availableTreatments } = useFormOptions()

  // Calculate totals
  const totalDuration = useMemo(() => {
    return appointments.reduce((sum, appt) => sum + (appt.estimated_duration_minutes || 0), 0)
  }, [appointments])

  const totalTreatments = useMemo(() => {
    return appointments.reduce((sum, appt) => sum + appt.treatments.length, 0)
  }, [appointments])

  const getTreatmentLabel = (treatmentType: string) => {
    const treatment = availableTreatments.find(t => t.id === treatmentType)
    return treatment?.label || treatmentType || 'Traitement non défini'
  }

  const getOrderConstraintLabel = (constraint: OrderConstraint) => {
    return ORDER_CONSTRAINT_OPTIONS.find(o => o.value === constraint)?.label || constraint
  }

  const getDelayLabel = (value: number | null, unit: string) => {
    if (!value || value === 0) return 'Immédiat'
    const unitLabel = DELAY_UNIT_OPTIONS.find(o => o.value === unit)?.label || unit
    return `${value} ${unitLabel}`
  }

  const getPlanItemLabel = (planItemId: string) => {
    const item = planItems?.find(p => p.id === planItemId)
    if (!item) return planItemId
    const teethStr = item.teeth.length > 0 ? `${item.teeth.join(', ')} - ` : ''
    return `${teethStr}${item.treatment_description}`
  }

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{appointments.length}</span>
          <span className="text-muted-foreground">séance{appointments.length > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{totalDuration}</span>
          <span className="text-muted-foreground">min au total</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{totalTreatments}</span>
          <span className="text-muted-foreground">traitement{totalTreatments > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative space-y-0">
        {appointments.map((appointment, index) => (
          <div key={appointment.id}>
            {/* Delay card between appointments */}
            {index > 0 && (
              <div className="relative py-3">
                {/* Vertical connector line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-orange-300" />

                {/* Arrow */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <ArrowDown className="h-5 w-5 text-orange-400" />
                </div>

                {/* Delay info */}
                <div className="ml-12">
                  <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                    <Hourglass className="h-4 w-4 text-orange-600 shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        {getDelayLabel(appointment.delay_value, appointment.delay_unit)}
                      </span>
                      {appointment.delay_reason && appointment.delay_reason !== 'Pas de délai nécessaire' && (
                        <span className="text-sm text-orange-700 dark:text-orange-300 ml-2">
                          — {appointment.delay_reason}
                        </span>
                      )}
                      {appointment.delay_rationale_text && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 italic">
                          {appointment.delay_rationale_text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appointment card */}
            <div className="relative">
              {/* Connector line for non-first items */}
              {index > 0 && (
                <div className="absolute left-6 -top-3 h-3 w-0.5 bg-orange-300" />
              )}
              {/* Connector line to next item */}
              {index < appointments.length - 1 && (
                <div className="absolute left-6 bottom-0 h-3 w-0.5 bg-orange-300" />
              )}

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{appointment.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-xs">
                          {appointment.treatments.length} traitement{appointment.treatments.length > 1 ? 's' : ''}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {appointment.estimated_duration_minutes || 0} min
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Objectives if any */}
                  {appointment.objectives && appointment.objectives.length > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50">
                      <ListChecks className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        {appointment.objectives.join(', ')}
                      </div>
                    </div>
                  )}

                  {/* Treatments */}
                  <div className="space-y-2">
                    {appointment.treatments.map((treatment, treatmentIndex) => (
                      <div
                        key={treatment.id}
                        className="p-3 rounded-lg bg-muted/30 border"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium shrink-0">
                            {treatmentIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Treatment header */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">
                                {getTreatmentLabel(treatment.treatment_type)}
                              </span>
                              {treatment.teeth.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Dent{treatment.teeth.length > 1 ? 's' : ''}: {treatment.teeth.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {treatment.estimated_duration_minutes || 0} min
                              </Badge>
                              {treatment.order_constraint !== 'flexible' && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    treatment.order_constraint === 'strict'
                                      ? 'border-red-300 text-red-700 dark:text-red-400'
                                      : 'border-yellow-300 text-yellow-700 dark:text-yellow-400'
                                  }`}
                                >
                                  Ordre: {getOrderConstraintLabel(treatment.order_constraint)}
                                </Badge>
                              )}
                            </div>

                            {/* Treatment rationale */}
                            {treatment.rationale_treatment && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {treatment.rationale_treatment}
                              </p>
                            )}

                            {/* Order rationale if strict/preferred */}
                            {treatment.order_rationale && treatment.order_constraint !== 'flexible' && (
                              <div className="flex items-start gap-2 mt-2 text-xs text-muted-foreground">
                                <Hourglass className="h-3 w-3 mt-0.5 shrink-0" />
                                <span className="italic">{treatment.order_rationale}</span>
                              </div>
                            )}

                            {/* Plan item links */}
                            {treatment.plan_item_ids && treatment.plan_item_ids.length > 0 && planItems && (
                              <div className="flex items-start gap-2 mt-2">
                                <Link2 className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                                <div className="flex flex-wrap gap-1">
                                  {treatment.plan_item_ids.map(itemId => (
                                    <Badge
                                      key={itemId}
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      {getPlanItemLabel(itemId)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grouping rationale if multiple treatments */}
                  {appointment.treatments.length > 1 && appointment.grouping_rationale && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50">
                      <MessageSquare className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                          Pourquoi ces traitements ensemble:
                        </span>
                        <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
                          {appointment.grouping_rationale}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
