'use client'

import { useState, useCallback, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { TreatmentCombobox } from '@/components/dental/treatment-combobox'
import { DelayReasonCombobox } from '@/components/dental/delay-reason-combobox'
import { ToothSelectorCompact } from '@/components/dental/tooth-selector'
import { useFormOptions } from '@/hooks/use-form-options'
import {
  ArrowDown,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Hourglass,
  Save,
  Loader2,
  MoveUp,
  MoveDown,
  MessageSquarePlus,
  Link2,
} from 'lucide-react'
import {
  DELAY_UNIT_OPTIONS,
  ORDER_CONSTRAINT_OPTIONS,
} from '@/lib/constants'
import { TREATMENT_CATEGORIES } from '@/lib/constants/treatments'
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

type PlanItem = {
  id: string
  treatment_description: string
  teeth: string[]
  category: TreatmentCategory
}

type SequenceTimelineProps = {
  sequenceId: string
  appointments: Appointment[]
  planItems?: PlanItem[]
  onUpdate?: () => void
}

export function SequenceTimeline({ sequenceId, appointments: initialAppointments, planItems, onUpdate }: SequenceTimelineProps) {
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])
  const { treatments: availableTreatments, delayReasons } = useFormOptions()

  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [expandedAppointments, setExpandedAppointments] = useState<Set<string>>(
    new Set(initialAppointments.map(a => a.id))
  )
  const [expandedDelayCards, setExpandedDelayCards] = useState<Set<string>>(new Set())
  const [expandedTreatments, setExpandedTreatments] = useState<Set<string>>(new Set())
  const [expandedDelayRationale, setExpandedDelayRationale] = useState<Set<string>>(new Set())
  const [expandedGroupingRationale, setExpandedGroupingRationale] = useState<Set<string>>(new Set())
  const [expandedAppointmentNotes, setExpandedAppointmentNotes] = useState<Set<string>>(new Set())
  const [expandedTreatmentNotes, setExpandedTreatmentNotes] = useState<Set<string>>(new Set())
  const [expandedOrderRationale, setExpandedOrderRationale] = useState<Set<string>>(new Set())
  const [expandedPlanLinks, setExpandedPlanLinks] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Calculate totals
  const totalDuration = useMemo(() => {
    return appointments.reduce((sum, appt) => sum + (appt.estimated_duration_minutes || 0), 0)
  }, [appointments])

  const totalTreatments = useMemo(() => {
    return appointments.reduce((sum, appt) => sum + appt.treatments.length, 0)
  }, [appointments])

  // Toggle helpers
  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setter(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAppointment = (id: string) => toggleSet(setExpandedAppointments, id)
  const toggleDelayCard = (id: string) => toggleSet(setExpandedDelayCards, id)
  const toggleTreatment = (id: string) => toggleSet(setExpandedTreatments, id)
  const toggleDelayRationale = (id: string) => toggleSet(setExpandedDelayRationale, id)
  const toggleGroupingRationale = (id: string) => toggleSet(setExpandedGroupingRationale, id)
  const toggleAppointmentNotes = (id: string) => toggleSet(setExpandedAppointmentNotes, id)
  const toggleTreatmentNotes = (id: string) => toggleSet(setExpandedTreatmentNotes, id)
  const toggleOrderRationale = (id: string) => toggleSet(setExpandedOrderRationale, id)
  const togglePlanLinks = (id: string) => toggleSet(setExpandedPlanLinks, id)

  const updateAppointment = useCallback((appointmentId: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a =>
      a.id === appointmentId ? { ...a, ...updates } : a
    ))
    setHasChanges(true)
  }, [])

  const updateTreatment = useCallback((appointmentId: string, treatmentId: string, updates: Partial<Treatment>) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        const treatments = a.treatments.map(t =>
          t.id === treatmentId ? { ...t, ...updates } : t
        )
        // Recalculate appointment duration
        const newDuration = treatments.reduce((sum, t) => sum + (t.estimated_duration_minutes || 0), 0)
        return { ...a, treatments, estimated_duration_minutes: newDuration }
      }
      return a
    }))
    setHasChanges(true)
  }, [])

  const addTreatment = useCallback((appointmentId: string) => {
    const newTreatment: Treatment = {
      id: crypto.randomUUID(),
      position: 0,
      treatment_type: '',
      treatment_category: 'other',
      teeth: [],
      rationale_treatment: null,
      estimated_duration_minutes: 15,
      order_constraint: 'flexible',
      order_rationale: null,
      plan_item_ids: [],
    }

    setAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        const treatments = [...a.treatments, { ...newTreatment, position: a.treatments.length }]
        const newDuration = treatments.reduce((sum, t) => sum + (t.estimated_duration_minutes || 0), 0)
        return { ...a, treatments, estimated_duration_minutes: newDuration }
      }
      return a
    }))
    // Auto-expand the new treatment
    setExpandedTreatments(prev => new Set([...Array.from(prev), newTreatment.id]))
    setHasChanges(true)
  }, [])

  const removeTreatment = useCallback((appointmentId: string, treatmentId: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        const treatments = a.treatments.filter(t => t.id !== treatmentId)
          .map((t, idx) => ({ ...t, position: idx }))
        const newDuration = treatments.reduce((sum, t) => sum + (t.estimated_duration_minutes || 0), 0)
        return { ...a, treatments, estimated_duration_minutes: newDuration }
      }
      return a
    }))
    setHasChanges(true)
  }, [])

  const addAppointment = useCallback(() => {
    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      position: appointments.length,
      title: `Séance ${appointments.length + 1}`,
      appointment_type: 'treatment',
      objectives: null,
      delay_value: 0,
      delay_unit: 'days',
      delay_reason: 'Pas de délai nécessaire',
      delay_rationale_text: null,
      grouping_rationale: null,
      estimated_duration_minutes: 15,
      treatments: [{
        id: crypto.randomUUID(),
        position: 0,
        treatment_type: '',
        treatment_category: 'other',
        teeth: [],
        rationale_treatment: null,
        estimated_duration_minutes: 15,
        order_constraint: 'flexible',
        order_rationale: null,
        plan_item_ids: [],
      }],
    }

    setAppointments(prev => [...prev, newAppointment])
    setExpandedAppointments(prev => new Set([...Array.from(prev), newAppointment.id]))
    setHasChanges(true)
  }, [appointments.length])

  const removeAppointment = useCallback((appointmentId: string) => {
    if (appointments.length <= 1) return
    setAppointments(prev => prev
      .filter(a => a.id !== appointmentId)
      .map((a, idx) => ({ ...a, position: idx, title: `Séance ${idx + 1}` }))
    )
    setHasChanges(true)
  }, [appointments.length])

  // Move appointment up/down
  const moveAppointment = useCallback((appointmentId: string, direction: 'up' | 'down') => {
    setAppointments(prev => {
      const index = prev.findIndex(a => a.id === appointmentId)
      if (index === -1) return prev
      if (direction === 'up' && index === 0) return prev
      if (direction === 'down' && index === prev.length - 1) return prev

      const newIndex = direction === 'up' ? index - 1 : index + 1
      const newAppointments = [...prev]

      // Swap appointments
      const temp = newAppointments[index]
      newAppointments[index] = newAppointments[newIndex]
      newAppointments[newIndex] = temp

      // Update positions and titles
      return newAppointments.map((a, idx) => ({
        ...a,
        position: idx,
        title: `Séance ${idx + 1}`,
      }))
    })
    setHasChanges(true)
  }, [])

  // Move treatment up/down within an appointment
  const moveTreatment = useCallback((appointmentId: string, treatmentId: string, direction: 'up' | 'down') => {
    setAppointments(prev => prev.map(a => {
      if (a.id !== appointmentId) return a

      const index = a.treatments.findIndex(t => t.id === treatmentId)
      if (index === -1) return a
      if (direction === 'up' && index === 0) return a
      if (direction === 'down' && index === a.treatments.length - 1) return a

      const newIndex = direction === 'up' ? index - 1 : index + 1
      const newTreatments = [...a.treatments]

      // Swap treatments
      const temp = newTreatments[index]
      newTreatments[index] = newTreatments[newIndex]
      newTreatments[newIndex] = temp

      // Update positions
      return {
        ...a,
        treatments: newTreatments.map((t, idx) => ({ ...t, position: idx })),
      }
    }))
    setHasChanges(true)
  }, [])

  const saveChanges = async () => {
    setIsSaving(true)

    try {
      // Delete existing appointments and treatments, then recreate
      // First delete treatments (they have FK to appointments)
      for (const appt of initialAppointments) {
        await supabase
          .from('treatments')
          .delete()
          .eq('appointment_group_id', appt.id)
      }

      // Delete appointments
      await supabase
        .from('appointment_groups')
        .delete()
        .eq('sequence_id', sequenceId)

      // Recreate appointments and treatments
      for (const appt of appointments) {
        const { data: newAppt, error: apptError } = await supabase
          .from('appointment_groups')
          .insert({
            sequence_id: sequenceId,
            position: appt.position,
            title: appt.title,
            appointment_type: appt.appointment_type,
            objectives: appt.objectives,
            delay_value: appt.delay_value,
            delay_unit: appt.delay_unit,
            delay_reason: appt.delay_reason,
            delay_rationale_text: appt.delay_rationale_text,
            grouping_rationale: appt.grouping_rationale,
            estimated_duration_minutes: appt.estimated_duration_minutes,
          })
          .select('id')
          .single()

        if (apptError) throw apptError

        // Insert treatments
        if (appt.treatments.length > 0) {
          const treatmentInserts = appt.treatments.map(t => ({
            appointment_group_id: newAppt.id,
            position: t.position,
            treatment_type: t.treatment_type,
            treatment_category: t.treatment_category,
            teeth: t.teeth,
            rationale_treatment: t.rationale_treatment,
            estimated_duration_minutes: t.estimated_duration_minutes,
            order_constraint: t.order_constraint,
            order_rationale: t.order_rationale,
            plan_item_ids: t.plan_item_ids,
          }))

          const { error: treatError } = await supabase
            .from('treatments')
            .insert(treatmentInserts)

          if (treatError) throw treatError
        }
      }

      toast({
        title: 'Modifications enregistrées',
        description: 'La séquence a été mise à jour avec succès',
      })

      setHasChanges(false)
      onUpdate?.()

      // Reload the page to get fresh data with new IDs
      window.location.reload()
    } catch (error) {
      console.error('Error saving:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder les modifications',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getTreatmentLabel = (treatmentType: string) => {
    const treatment = availableTreatments.find(t => t.id === treatmentType)
    return treatment?.label || treatmentType || 'Traitement non défini'
  }

  const handleTreatmentSelect = (appointmentId: string, treatmentId: string, treatmentCode: string) => {
    const treatmentInfo = availableTreatments.find(t => t.id === treatmentCode)
    updateTreatment(appointmentId, treatmentId, {
      treatment_type: treatmentCode,
      treatment_category: treatmentInfo?.treatmentCategory || 'other',
      estimated_duration_minutes: treatmentInfo?.typicalDuration || 15,
    })
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

        {hasChanges && (
          <div className="ml-auto">
            <Button onClick={saveChanges} disabled={isSaving} size="sm">
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {appointments.map((appointment, apptIndex) => (
          <div key={appointment.id}>
            {/* Inter-appointment delay card - shown BEFORE the appointment (except first) */}
            {apptIndex > 0 && (
              <div className="relative py-4">
                {/* Vertical connector lines */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

                {/* Delay card - Collapsible */}
                <div className="ml-12 mr-4">
                  <Card className="border-dashed border-2 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 overflow-hidden">
                    {/* Collapsed header - always visible */}
                    <button
                      type="button"
                      onClick={() => toggleDelayCard(appointment.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-colors text-left"
                    >
                      {expandedDelayCards.has(appointment.id) ? (
                        <ChevronDown className="h-4 w-4 text-orange-600 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-orange-600 shrink-0" />
                      )}
                      <div className="p-1.5 rounded-full bg-orange-100 dark:bg-orange-900/50">
                        <Hourglass className="h-3 w-3 text-orange-600" />
                      </div>
                      <span className="font-medium text-sm text-orange-800 dark:text-orange-200">
                        Délai avant {appointment.title}
                      </span>
                      {/* Summary when collapsed */}
                      {!expandedDelayCards.has(appointment.id) && (
                        <div className="flex items-center gap-2 ml-auto text-xs text-orange-700 dark:text-orange-300">
                          {appointment.delay_value ? (
                            <Badge variant="outline" className="border-orange-300 text-orange-700 dark:text-orange-300">
                              {appointment.delay_value} {DELAY_UNIT_OPTIONS.find(o => o.value === appointment.delay_unit)?.label || appointment.delay_unit}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground italic">Non défini</span>
                          )}
                          {appointment.delay_reason && appointment.delay_reason !== 'Autre (personnalisé)' && appointment.delay_reason !== 'Pas de délai nécessaire' && (
                            <span className="truncate max-w-[150px] hidden sm:inline">{appointment.delay_reason}</span>
                          )}
                        </div>
                      )}
                    </button>

                    {/* Expanded content */}
                    {expandedDelayCards.has(appointment.id) && (
                      <CardContent className="p-4 pt-0 border-t border-orange-200/50">
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                value={appointment.delay_value || ''}
                                onChange={(e) =>
                                  updateAppointment(appointment.id, {
                                    delay_value: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-20 h-8"
                                placeholder="0"
                              />
                              <Select
                                value={appointment.delay_unit}
                                onValueChange={(v) =>
                                  updateAppointment(appointment.id, { delay_unit: v })
                                }
                              >
                                <SelectTrigger className="w-28 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DELAY_UNIT_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="md:col-span-2">
                              <DelayReasonCombobox
                                reasons={delayReasons}
                                value={appointment.delay_reason || ''}
                                onValueChange={(v) => {
                                  // If "Pas de délai nécessaire" is selected, set delay to 0
                                  if (v === 'Pas de délai nécessaire') {
                                    updateAppointment(appointment.id, {
                                      delay_reason: v,
                                      delay_value: 0
                                    })
                                  } else {
                                    updateAppointment(appointment.id, { delay_reason: v })
                                  }
                                }}
                                placeholder="Raison du délai..."
                              />
                            </div>
                          </div>

                          {/* Collapsible rationale section */}
                          <div className="pt-2 border-t border-orange-200/50">
                            <button
                              type="button"
                              onClick={() => toggleDelayRationale(appointment.id)}
                              className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100 transition-colors"
                            >
                              {expandedDelayRationale.has(appointment.id) ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              <MessageSquarePlus className="h-3 w-3" />
                              <span>Justification du séquençage</span>
                              {appointment.delay_rationale_text && (
                                <span className="text-green-600 dark:text-green-400">✓</span>
                              )}
                            </button>
                            {expandedDelayRationale.has(appointment.id) && (
                              <div className="mt-2">
                                <Textarea
                                  placeholder="Pourquoi cette séance vient après la précédente ? (ex: cicatrisation nécessaire, stabilité parodontale requise...)"
                                  rows={2}
                                  className="text-sm bg-white dark:bg-gray-900"
                                  value={appointment.delay_rationale_text || ''}
                                  onChange={(e) =>
                                    updateAppointment(appointment.id, { delay_rationale_text: e.target.value || null })
                                  }
                                />
                              </div>
                            )}
                          </div>

                          {/* Validate button */}
                          <div className="pt-2 border-t border-orange-200/50">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                              onClick={() => toggleDelayCard(appointment.id)}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Valider ce délai
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>

                {/* Arrow indicator */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <ArrowDown className="h-5 w-5 text-orange-400" />
                </div>
              </div>
            )}

            {/* Appointment card */}
            <Accordion
              type="multiple"
              value={expandedAppointments.has(appointment.id) ? [appointment.id] : []}
              onValueChange={(values) => {
                if (values.includes(appointment.id)) {
                  setExpandedAppointments(prev => {
                    const next = new Set(prev)
                    next.add(appointment.id)
                    return next
                  })
                } else {
                  setExpandedAppointments(prev => {
                    const next = new Set(prev)
                    next.delete(appointment.id)
                    return next
                  })
                }
              }}
            >
              <AccordionItem
                value={appointment.id}
                className="border rounded-lg"
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Move buttons */}
                    <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveAppointment(appointment.id, 'up')
                        }}
                        disabled={apptIndex === 0}
                      >
                        <MoveUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveAppointment(appointment.id, 'down')
                        }}
                        disabled={apptIndex === appointments.length - 1}
                      >
                        <MoveDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {apptIndex + 1}
                    </div>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{appointment.title}</span>
                    <Badge variant="outline" className="ml-auto mr-4">
                      {appointment.treatments.length} traitement(s)
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {/* Collapsible notes section */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => toggleAppointmentNotes(appointment.id)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {expandedAppointmentNotes.has(appointment.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <MessageSquarePlus className="h-4 w-4" />
                        <span>Notes additionnelles</span>
                        {appointment.objectives && appointment.objectives.length > 0 && (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        )}
                      </button>
                      {expandedAppointmentNotes.has(appointment.id) && (
                        <div className="mt-2 pl-6">
                          <Textarea
                            placeholder="Notes ou informations supplémentaires pour cette séance..."
                            rows={2}
                            value={appointment.objectives?.join('\n') || ''}
                            onChange={(e) =>
                              updateAppointment(appointment.id, {
                                objectives: e.target.value ? [e.target.value] : null
                              })
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* Treatments */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Traitements</Label>

                      {appointment.treatments.map((treatment, treatmentIndex) => {
                        const treatmentInfo = availableTreatments.find(t => t.id === treatment.treatment_type)
                        const isExpanded = expandedTreatments.has(treatment.id)

                        return (
                          <Card key={treatment.id} className="bg-muted/30 overflow-hidden">
                            {/* Collapsed header - always visible */}
                            <div className="flex items-center">
                              {/* Move treatment buttons */}
                              <div className="flex flex-col gap-0.5 pl-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => moveTreatment(appointment.id, treatment.id, 'up')}
                                  disabled={treatmentIndex === 0}
                                >
                                  <MoveUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => moveTreatment(appointment.id, treatment.id, 'down')}
                                  disabled={treatmentIndex === appointment.treatments.length - 1}
                                >
                                  <MoveDown className="h-3 w-3" />
                                </Button>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleTreatment(treatment.id)}
                                className="flex-1 flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                  <span className="font-medium truncate">
                                    {treatmentInfo?.label || treatment.treatment_type || 'Nouveau traitement'}
                                  </span>
                                  {treatment.teeth.length > 0 && (
                                    <Badge variant="outline" className="shrink-0 text-xs">
                                      {treatment.teeth.length} dent{treatment.teeth.length > 1 ? 's' : ''} : {treatment.teeth.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}
                                    </Badge>
                                  )}
                                  {treatment.estimated_duration_minutes && (
                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                      {treatment.estimated_duration_minutes} min
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeTreatment(appointment.id, treatment.id)
                                  }}
                                  disabled={appointment.treatments.length <= 1}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </button>
                            </div>

                            {/* Expanded content */}
                            {isExpanded && (
                              <CardContent className="p-4 pt-0 space-y-4 border-t">
                                {/* Row 1: Treatment type, Duration */}
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Traitement</Label>
                                    <TreatmentCombobox
                                      treatments={availableTreatments}
                                      value={treatment.treatment_type}
                                      onValueChange={(v) =>
                                        handleTreatmentSelect(appointment.id, treatment.id, v)
                                      }
                                      placeholder="Rechercher un traitement..."
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-xs">Durée (min)</Label>
                                    <Input
                                      type="number"
                                      min={5}
                                      step={5}
                                      value={treatment.estimated_duration_minutes || 15}
                                      onChange={(e) =>
                                        updateTreatment(appointment.id, treatment.id, {
                                          estimated_duration_minutes: parseInt(e.target.value) || 15,
                                        })
                                      }
                                    />
                                  </div>
                                </div>

                                {/* Row 2: Teeth selector */}
                                <div className="space-y-2">
                                  <Label className="text-xs">Dent(s) concernée(s)</Label>
                                  <ToothSelectorCompact
                                    selectedTeeth={treatment.teeth}
                                    onSelectionChange={(teeth) =>
                                      updateTreatment(appointment.id, treatment.id, { teeth })
                                    }
                                  />
                                </div>

                                {/* Row 3: Order constraint - segmented buttons */}
                                <div className="space-y-2">
                                  <Label className="text-xs">Ordre dans la séance</Label>
                                  <div className="flex gap-1">
                                    {ORDER_CONSTRAINT_OPTIONS.map((opt) => (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() =>
                                          updateTreatment(appointment.id, treatment.id, {
                                            order_constraint: opt.value as OrderConstraint,
                                          })
                                        }
                                        className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-colors ${
                                          treatment.order_constraint === opt.value
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background hover:bg-muted border-input'
                                        }`}
                                        title={opt.description}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Collapsible order rationale - only show if not flexible */}
                                {treatment.order_constraint !== 'flexible' && (
                                  <div className="pt-2 border-t border-dashed">
                                    <button
                                      type="button"
                                      onClick={() => toggleOrderRationale(treatment.id)}
                                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      {expandedOrderRationale.has(treatment.id) ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                      <Hourglass className="h-3 w-3" />
                                      <span>Justification de l'ordre</span>
                                      {treatment.order_rationale && (
                                        <span className="text-green-600 dark:text-green-400">✓</span>
                                      )}
                                    </button>
                                    {expandedOrderRationale.has(treatment.id) && (
                                      <div className="mt-2 pl-5">
                                        <Textarea
                                          placeholder="Expliquez pourquoi ce traitement doit être dans cet ordre..."
                                          rows={2}
                                          value={treatment.order_rationale || ''}
                                          onChange={(e) =>
                                            updateTreatment(appointment.id, treatment.id, {
                                              order_rationale: e.target.value || null,
                                            })
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Collapsible notes section */}
                                <div className="pt-2 border-t border-dashed">
                                  <button
                                    type="button"
                                    onClick={() => toggleTreatmentNotes(treatment.id)}
                                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {expandedTreatmentNotes.has(treatment.id) ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                    <MessageSquarePlus className="h-3 w-3" />
                                    <span>Notes additionnelles</span>
                                    {treatment.rationale_treatment && (
                                      <span className="text-green-600 dark:text-green-400">✓</span>
                                    )}
                                  </button>
                                  {expandedTreatmentNotes.has(treatment.id) && (
                                    <div className="mt-2 pl-5">
                                      <Textarea
                                        placeholder="Notes ou justification pour ce choix de traitement..."
                                        rows={2}
                                        value={treatment.rationale_treatment || ''}
                                        onChange={(e) =>
                                          updateTreatment(appointment.id, treatment.id, {
                                            rationale_treatment: e.target.value || null,
                                          })
                                        }
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Optional: Link to plan items for ML traceability */}
                                {planItems && planItems.length > 0 && (
                                  <div className="pt-2 border-t border-dashed">
                                    <button
                                      type="button"
                                      onClick={() => togglePlanLinks(treatment.id)}
                                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      {expandedPlanLinks.has(treatment.id) ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                      <Link2 className="h-3 w-3" />
                                      <span>Lié aux éléments du plan</span>
                                      {treatment.plan_item_ids && treatment.plan_item_ids.length > 0 && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                          {treatment.plan_item_ids.length}
                                        </Badge>
                                      )}
                                    </button>
                                    {expandedPlanLinks.has(treatment.id) && (
                                      <div className="mt-2 pl-5">
                                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto rounded-md border p-2 bg-muted/30">
                                          {planItems.map((item) => {
                                            const isSelected = treatment.plan_item_ids?.includes(item.id) || false
                                            return (
                                              <label
                                                key={item.id}
                                                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                                                  isSelected
                                                    ? 'bg-primary/10 border border-primary/30'
                                                    : 'hover:bg-muted/50'
                                                }`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  onChange={(e) => {
                                                    const currentIds = treatment.plan_item_ids || []
                                                    const newPlanItemIds = e.target.checked
                                                      ? [...currentIds, item.id]
                                                      : currentIds.filter(id => id !== item.id)
                                                    updateTreatment(appointment.id, treatment.id, {
                                                      plan_item_ids: newPlanItemIds,
                                                    })
                                                  }}
                                                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <Badge variant="outline" className={`text-[10px] px-1 py-0 shrink-0 ${TREATMENT_CATEGORIES[item.category]?.color || ''}`}>
                                                  {TREATMENT_CATEGORIES[item.category]?.name?.slice(0, 4) || item.category}
                                                </Badge>
                                                <span className="text-xs truncate">
                                                  {item.teeth.length > 0 && `${item.teeth.join(', ')} - `}
                                                  {item.treatment_description}
                                                </span>
                                              </label>
                                            )
                                          })}
                                        </div>
                                        {treatment.plan_item_ids && treatment.plan_item_ids.length > 0 && (
                                          <div className="mt-1 text-xs text-muted-foreground">
                                            {treatment.plan_item_ids.length} élément{treatment.plan_item_ids.length > 1 ? 's' : ''} lié{treatment.plan_item_ids.length > 1 ? 's' : ''}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Validate and collapse button */}
                                <div className="pt-3 border-t">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                                    onClick={() => toggleTreatment(treatment.id)}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Valider ce traitement
                                  </Button>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        )
                      })}

                      {/* Add treatment button - at the bottom */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => addTreatment(appointment.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter un traitement
                      </Button>

                      {/* Collapsible grouping rationale - only show if more than 1 treatment */}
                      {appointment.treatments.length > 1 && (
                        <div className="pt-3 mt-3 border-t border-dashed">
                          <button
                            type="button"
                            onClick={() => toggleGroupingRationale(appointment.id)}
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {expandedGroupingRationale.has(appointment.id) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                            <MessageSquarePlus className="h-3 w-3" />
                            <span>Pourquoi ces traitements ensemble ?</span>
                            {appointment.grouping_rationale && (
                              <span className="text-green-600 dark:text-green-400">✓</span>
                            )}
                          </button>
                          {expandedGroupingRationale.has(appointment.id) && (
                            <div className="mt-2">
                              <Textarea
                                placeholder="Pourquoi regrouper ces traitements dans la même séance ? (ex: même zone d'anesthésie, optimisation du temps patient, séquence technique obligatoire...)"
                                rows={2}
                                className="text-sm"
                                value={appointment.grouping_rationale || ''}
                                onChange={(e) =>
                                  updateAppointment(appointment.id, { grouping_rationale: e.target.value || null })
                                }
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Appointment duration - at the end after all treatments */}
                    <div className="pt-3 border-t flex items-center gap-3">
                      <Label className="text-sm whitespace-nowrap">Durée totale de la séance:</Label>
                      <Input
                        type="number"
                        min={15}
                        step={15}
                        value={appointment.estimated_duration_minutes || 0}
                        onChange={(e) =>
                          updateAppointment(appointment.id, {
                            estimated_duration_minutes: parseInt(e.target.value) || 60,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">min</span>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeAppointment(appointment.id)}
                        disabled={appointments.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer cette séance
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                        onClick={() => toggleAppointment(appointment.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Valider cette séance
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ))}
      </div>

      {/* Add appointment button - at the bottom */}
      <Button
        variant="outline"
        className="w-full"
        onClick={addAppointment}
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une séance
      </Button>
    </div>
  )
}
