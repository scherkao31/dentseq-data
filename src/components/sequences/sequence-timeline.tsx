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
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { TreatmentCombobox } from '@/components/dental/treatment-combobox'
import { DelayReasonCombobox } from '@/components/dental/delay-reason-combobox'
import { ToothSelectorCompact } from '@/components/dental/tooth-selector'
import { useFormOptions } from '@/hooks/use-form-options'
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
  Hourglass,
  Save,
  Loader2,
  MoveUp,
  MoveDown,
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

type SequenceTimelineProps = {
  sequenceId: string
  appointments: Appointment[]
  onUpdate?: () => void
}

export function SequenceTimeline({ sequenceId, appointments: initialAppointments, onUpdate }: SequenceTimelineProps) {
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])
  const { treatments: availableTreatments, delayReasons } = useFormOptions()

  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [expandedAppointments, setExpandedAppointments] = useState<Set<string>>(
    new Set(initialAppointments.map(a => a.id))
  )
  const [expandedDelays, setExpandedDelays] = useState<Set<string>>(new Set())
  const [editingTreatment, setEditingTreatment] = useState<string | null>(null)
  const [editingDelay, setEditingDelay] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Calculate totals
  const totalDuration = useMemo(() => {
    return appointments.reduce((sum, appt) => sum + (appt.estimated_duration_minutes || 0), 0)
  }, [appointments])

  const totalTreatments = useMemo(() => {
    return appointments.reduce((sum, appt) => sum + appt.treatments.length, 0)
  }, [appointments])

  const toggleAppointment = (id: string) => {
    setExpandedAppointments(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleDelay = (id: string) => {
    setExpandedDelays(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
    setEditingTreatment(newTreatment.id)
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
      <div className="relative">
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

                {/* Delay card */}
                <div className="ml-12">
                  <button
                    type="button"
                    onClick={() => toggleDelay(appointment.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 transition-colors text-left"
                  >
                    <Hourglass className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      {appointment.delay_value || 0} {DELAY_UNIT_OPTIONS.find(o => o.value === appointment.delay_unit)?.label || appointment.delay_unit}
                    </span>
                    {appointment.delay_reason && appointment.delay_reason !== 'Pas de délai nécessaire' && (
                      <span className="text-xs text-orange-600 truncate">
                        - {appointment.delay_reason}
                      </span>
                    )}
                    <ChevronRight className={`h-4 w-4 text-orange-400 ml-auto transition-transform ${expandedDelays.has(appointment.id) ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Expanded delay editor */}
                  {expandedDelays.has(appointment.id) && (
                    <div className="mt-2 p-4 rounded-lg border border-orange-200 bg-white space-y-3">
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min={0}
                          value={appointment.delay_value || 0}
                          onChange={(e) => updateAppointment(appointment.id, { delay_value: parseInt(e.target.value) || 0 })}
                          className="w-20 h-8"
                        />
                        <Select
                          value={appointment.delay_unit}
                          onValueChange={(v) => updateAppointment(appointment.id, { delay_unit: v })}
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
                      <DelayReasonCombobox
                        reasons={delayReasons}
                        value={appointment.delay_reason || ''}
                        onValueChange={(v) => {
                          if (v === 'Pas de délai nécessaire') {
                            updateAppointment(appointment.id, { delay_reason: v, delay_value: 0 })
                          } else {
                            updateAppointment(appointment.id, { delay_reason: v })
                          }
                        }}
                      />
                      <Textarea
                        placeholder="Justification du séquençage (optionnel)..."
                        rows={2}
                        value={appointment.delay_rationale_text || ''}
                        onChange={(e) => updateAppointment(appointment.id, { delay_rationale_text: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  )}
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

              <Card className="ml-0 border-2 hover:border-primary/30 transition-colors">
                {/* Appointment header */}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    {/* Move buttons */}
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveAppointment(appointment.id, 'up')
                        }}
                        disabled={index === 0}
                      >
                        <MoveUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveAppointment(appointment.id, 'down')
                        }}
                        disabled={index === appointments.length - 1}
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleAppointment(appointment.id)}
                      className="flex-1 flex items-center gap-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 text-left">
                        <CardTitle className="text-lg">{appointment.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {appointment.treatments.length} traitement{appointment.treatments.length > 1 ? 's' : ''}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {appointment.estimated_duration_minutes || 0} min
                          </span>
                        </div>
                      </div>
                      {expandedAppointments.has(appointment.id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </CardHeader>

                {/* Expanded content */}
                {expandedAppointments.has(appointment.id) && (
                  <CardContent className="space-y-4">
                    {/* Treatments */}
                    <div className="space-y-2">
                      {appointment.treatments.map((treatment, treatmentIndex) => (
                        <div
                          key={treatment.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            editingTreatment === treatment.id
                              ? 'border-primary bg-primary/5'
                              : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                        >
                          {editingTreatment === treatment.id ? (
                            /* Edit mode */
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Traitement</Label>
                                  <TreatmentCombobox
                                    treatments={availableTreatments}
                                    value={treatment.treatment_type}
                                    onValueChange={(v) => {
                                      const info = availableTreatments.find(t => t.id === v)
                                      updateTreatment(appointment.id, treatment.id, {
                                        treatment_type: v,
                                        treatment_category: info?.treatmentCategory || 'other',
                                        estimated_duration_minutes: info?.typicalDuration || 15,
                                      })
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Durée (min)</Label>
                                  <Input
                                    type="number"
                                    min={5}
                                    step={5}
                                    value={treatment.estimated_duration_minutes || 15}
                                    onChange={(e) => updateTreatment(appointment.id, treatment.id, {
                                      estimated_duration_minutes: parseInt(e.target.value) || 15,
                                    })}
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs">Dent(s) concernée(s)</Label>
                                <ToothSelectorCompact
                                  selectedTeeth={treatment.teeth}
                                  onSelectionChange={(teeth) => updateTreatment(appointment.id, treatment.id, { teeth })}
                                />
                              </div>

                              <div>
                                <Label className="text-xs">Ordre dans la séance</Label>
                                <div className="flex gap-1 mt-1">
                                  {ORDER_CONSTRAINT_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => updateTreatment(appointment.id, treatment.id, {
                                        order_constraint: opt.value as OrderConstraint,
                                      })}
                                      className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-colors ${
                                        treatment.order_constraint === opt.value
                                          ? 'bg-primary text-primary-foreground border-primary'
                                          : 'bg-background hover:bg-muted border-input'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <Textarea
                                placeholder="Notes / justification (optionnel)..."
                                rows={2}
                                value={treatment.rationale_treatment || ''}
                                onChange={(e) => updateTreatment(appointment.id, treatment.id, {
                                  rationale_treatment: e.target.value || null,
                                })}
                                className="text-sm"
                              />

                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeTreatment(appointment.id, treatment.id)}
                                  className="text-destructive"
                                  disabled={appointment.treatments.length <= 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setEditingTreatment(null)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Valider
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* View mode */
                            <div className="flex items-center gap-2">
                              {/* Move buttons for treatments */}
                              {appointment.treatments.length > 1 && (
                                <div className="flex flex-col gap-0.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      moveTreatment(appointment.id, treatment.id, 'up')
                                    }}
                                    disabled={treatmentIndex === 0}
                                  >
                                    <MoveUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      moveTreatment(appointment.id, treatment.id, 'down')
                                    }}
                                    disabled={treatmentIndex === appointment.treatments.length - 1}
                                  >
                                    <MoveDown className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}

                              <div
                                className="flex-1 flex items-center gap-3 cursor-pointer"
                                onClick={() => setEditingTreatment(treatment.id)}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">
                                      {getTreatmentLabel(treatment.treatment_type)}
                                    </span>
                                    {treatment.teeth.length > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        {treatment.teeth.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}
                                      </Badge>
                                    )}
                                  </div>
                                  {treatment.rationale_treatment && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                      {treatment.rationale_treatment}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="secondary" className="shrink-0">
                                  {treatment.estimated_duration_minutes || 0} min
                                </Badge>
                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add treatment button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => addTreatment(appointment.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter un traitement
                      </Button>
                    </div>

                    {/* Grouping rationale (if multiple treatments) */}
                    {appointment.treatments.length > 1 && (
                      <div className="pt-3 border-t">
                        <Label className="text-xs text-muted-foreground">Pourquoi ces traitements ensemble ?</Label>
                        <Textarea
                          placeholder="Justification du regroupement (optionnel)..."
                          rows={2}
                          value={appointment.grouping_rationale || ''}
                          onChange={(e) => updateAppointment(appointment.id, { grouping_rationale: e.target.value || null })}
                          className="mt-1 text-sm"
                        />
                      </div>
                    )}

                    {/* Delete appointment button */}
                    <div className="pt-3 border-t flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => removeAppointment(appointment.id)}
                        disabled={appointments.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer cette séance
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        ))}

        {/* Add appointment button */}
        <div className="relative pt-4">
          {appointments.length > 0 && (
            <div className="absolute left-6 top-0 h-4 w-0.5 bg-border" />
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={addAppointment}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une séance
          </Button>
        </div>
      </div>
    </div>
  )
}
