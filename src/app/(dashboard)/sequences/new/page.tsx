'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { SingleToothSelector } from '@/components/dental/tooth-selector'
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Loader2,
  Calendar,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import {
  APPOINTMENT_TYPE_OPTIONS,
  DELAY_UNIT_OPTIONS,
  TREATMENT_GOALS,
} from '@/lib/constants'
import {
  TREATMENT_CATEGORIES,
  TREATMENTS,
  getGroupedTreatments,
  getTreatmentById,
  type TreatmentType,
  type TreatmentCategory
} from '@/lib/constants/treatments'
import type { ClinicalCase } from '@/types/database'

type Treatment = {
  id: string
  treatmentCode: string
  toothNumber: string | null
  rationale: string
  notes: string
  estimatedDuration: number
  orderIndex: number
}

type AppointmentGroup = {
  id: string
  title: string
  appointmentType: string
  objectives: string
  delayFromPrevious: number | null
  delayUnit: string
  delayReason: string
  estimatedDuration: number
  treatments: Treatment[]
  orderIndex: number
}

type FormData = {
  caseId: string
  title: string
  globalRationale: string
  treatmentGoals: string[]
  appointments: AppointmentGroup[]
}

const createTreatment = (orderIndex: number): Treatment => ({
  id: crypto.randomUUID(),
  treatmentCode: '',
  toothNumber: null,
  rationale: '',
  notes: '',
  estimatedDuration: 15,
  orderIndex,
})

const createAppointment = (orderIndex: number): AppointmentGroup => ({
  id: crypto.randomUUID(),
  title: `Séance ${orderIndex + 1}`,
  appointmentType: 'treatment',
  objectives: '',
  delayFromPrevious: orderIndex === 0 ? null : 1,
  delayUnit: 'weeks',
  delayReason: '',
  estimatedDuration: 60,
  treatments: [createTreatment(0)],
  orderIndex,
})

export default function NewSequencePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const caseIdParam = searchParams.get('caseId')
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [caseData, setCaseData] = useState<ClinicalCase | null>(null)
  const [formData, setFormData] = useState<FormData>({
    caseId: caseIdParam || '',
    title: '',
    globalRationale: '',
    treatmentGoals: [],
    appointments: [createAppointment(0)],
  })

  // Load case data if caseId is provided
  useEffect(() => {
    async function loadCase() {
      if (!caseIdParam) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('clinical_cases')
        .select('*')
        .eq('id', caseIdParam)
        .single()

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger le plan de traitement',
        })
        router.push('/cases')
        return
      }

      setCaseData(data as unknown as ClinicalCase)
      setFormData((prev) => ({ ...prev, caseId: caseIdParam }))
      setIsLoading(false)
    }

    loadCase()
  }, [caseIdParam, supabase, toast, router])

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const addAppointment = () => {
    const newIndex = formData.appointments.length
    updateFormData({
      appointments: [...formData.appointments, createAppointment(newIndex)],
    })
  }

  const removeAppointment = (appointmentId: string) => {
    if (formData.appointments.length <= 1) return
    const updated = formData.appointments
      .filter((a) => a.id !== appointmentId)
      .map((a, idx) => ({ ...a, orderIndex: idx, title: `Séance ${idx + 1}` }))
    updateFormData({ appointments: updated })
  }

  const updateAppointment = (appointmentId: string, updates: Partial<AppointmentGroup>) => {
    const updated = formData.appointments.map((a) =>
      a.id === appointmentId ? { ...a, ...updates } : a
    )
    updateFormData({ appointments: updated })
  }

  const addTreatment = (appointmentId: string) => {
    const updated = formData.appointments.map((a) => {
      if (a.id === appointmentId) {
        const newIndex = a.treatments.length
        return { ...a, treatments: [...a.treatments, createTreatment(newIndex)] }
      }
      return a
    })
    updateFormData({ appointments: updated })
  }

  const removeTreatment = (appointmentId: string, treatmentId: string) => {
    const updated = formData.appointments.map((a) => {
      if (a.id === appointmentId) {
        if (a.treatments.length <= 1) return a
        const treatments = a.treatments
          .filter((t) => t.id !== treatmentId)
          .map((t, idx) => ({ ...t, orderIndex: idx }))
        return { ...a, treatments }
      }
      return a
    })
    updateFormData({ appointments: updated })
  }

  const updateTreatment = (
    appointmentId: string,
    treatmentId: string,
    updates: Partial<Treatment>
  ) => {
    const updated = formData.appointments.map((a) => {
      if (a.id === appointmentId) {
        const treatments = a.treatments.map((t) =>
          t.id === treatmentId ? { ...t, ...updates } : t
        )
        return { ...a, treatments }
      }
      return a
    })
    updateFormData({ appointments: updated })
  }

  const toggleGoal = (goalId: string) => {
    const current = formData.treatmentGoals
    if (current.includes(goalId)) {
      updateFormData({ treatmentGoals: current.filter((g) => g !== goalId) })
    } else {
      updateFormData({ treatmentGoals: [...current, goalId] })
    }
  }

  const getTreatmentInfo = (id: string): TreatmentType | undefined => {
    return getTreatmentById(id)
  }

  const groupedTreatments = useMemo(() => getGroupedTreatments(), [])

  const handleSubmit = async () => {
    if (!formData.caseId) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez sélectionner un plan de traitement',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Vous devez être connecté',
        })
        return
      }

      const { data: dentist } = await supabase
        .from('dentists')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!dentist) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Profil dentiste non trouvé',
        })
        return
      }

      // Create the sequence
      const { data: sequence, error: seqError } = await supabase
        .from('treatment_sequences')
        .insert({
          case_id: formData.caseId,
          created_by: dentist.id,
          last_modified_by: dentist.id,
          title: formData.title || null,
          global_rationale: formData.globalRationale || null,
          treatment_goals: formData.treatmentGoals,
          status: 'draft',
        })
        .select('id')
        .single()

      if (seqError) {
        console.error('Sequence error:', seqError)
        throw seqError
      }

      // Create appointment groups
      for (const appt of formData.appointments) {
        const { data: appointmentGroup, error: apptError } = await supabase
          .from('appointment_groups')
          .insert({
            sequence_id: sequence.id,
            title: appt.title,
            appointment_type: appt.appointmentType,
            objectives: appt.objectives || null,
            delay_from_previous: appt.delayFromPrevious,
            delay_unit: appt.delayUnit,
            delay_reason: appt.delayReason || null,
            estimated_duration_minutes: appt.estimatedDuration,
            order_index: appt.orderIndex,
          })
          .select('id')
          .single()

        if (apptError) {
          console.error('Appointment error:', apptError)
          throw apptError
        }

        // Create treatments for this appointment
        const treatmentInserts = appt.treatments.map((t) => ({
          appointment_group_id: appointmentGroup.id,
          treatment_code: t.treatmentCode,
          tooth_number: t.toothNumber,
          rationale: t.rationale || null,
          notes: t.notes || null,
          estimated_duration_minutes: t.estimatedDuration,
          order_index: t.orderIndex,
        }))

        const { error: treatError } = await supabase
          .from('treatments')
          .insert(treatmentInserts)

        if (treatError) {
          console.error('Treatment error:', treatError)
          throw treatError
        }
      }

      toast({
        title: 'Séquence créée',
        description: 'La séquence de traitement a été créée avec succès',
      })

      router.push(`/cases/${formData.caseId}`)
    } catch (error) {
      console.error('Error:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer la séquence',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Header title="Nouvelle séquence" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Nouvelle séquence de traitement" />

      <div className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back button */}
          <Button variant="ghost" asChild>
            <Link href={caseData ? `/cases/${caseData.id}` : '/cases'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>

          {/* Case info */}
          {caseData && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{caseData.case_number}</Badge>
                  <CardTitle className="text-lg">{caseData.title}</CardTitle>
                </div>
                <CardDescription>
                  Créez une séquence de traitement pour ce plan
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Sequence info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de la séquence (optionnel)</Label>
                <Input
                  id="title"
                  placeholder="Ex: Approche conservatrice - Phase initiale"
                  value={formData.title}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="globalRationale">Raisonnement global</Label>
                <Textarea
                  id="globalRationale"
                  placeholder="Expliquez votre approche thérapeutique globale..."
                  rows={3}
                  value={formData.globalRationale}
                  onChange={(e) => updateFormData({ globalRationale: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Objectifs de traitement</Label>
                <div className="flex flex-wrap gap-2">
                  {TREATMENT_GOALS.map((goal) => (
                    <Badge
                      key={goal.id}
                      variant={formData.treatmentGoals.includes(goal.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleGoal(goal.id)}
                    >
                      {goal.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Séances de traitement</h2>
              <Button onClick={addAppointment}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une séance
              </Button>
            </div>

            <Accordion
              type="multiple"
              defaultValue={formData.appointments.map((a) => a.id)}
              className="space-y-4"
            >
              {formData.appointments.map((appointment, apptIndex) => (
                <AccordionItem
                  key={appointment.id}
                  value={appointment.id}
                  className="border rounded-lg"
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{appointment.title}</span>
                      {appointment.delayFromPrevious && apptIndex > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          <Clock className="h-3 w-3 mr-1" />
                          {appointment.delayFromPrevious}{' '}
                          {DELAY_UNIT_OPTIONS.find((d) => d.value === appointment.delayUnit)?.label}
                        </Badge>
                      )}
                      <Badge variant="outline" className="ml-auto mr-4">
                        {appointment.treatments.length} traitement(s)
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {/* Appointment details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type de séance</Label>
                          <Select
                            value={appointment.appointmentType}
                            onValueChange={(v) =>
                              updateAppointment(appointment.id, { appointmentType: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {APPOINTMENT_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Durée estimée (min)</Label>
                          <Input
                            type="number"
                            min={15}
                            step={15}
                            value={appointment.estimatedDuration}
                            onChange={(e) =>
                              updateAppointment(appointment.id, {
                                estimatedDuration: parseInt(e.target.value) || 60,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Delay from previous */}
                      {apptIndex > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Délai depuis la séance précédente</Label>
                            <Input
                              type="number"
                              min={1}
                              value={appointment.delayFromPrevious || ''}
                              onChange={(e) =>
                                updateAppointment(appointment.id, {
                                  delayFromPrevious: parseInt(e.target.value) || 1,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Unité</Label>
                            <Select
                              value={appointment.delayUnit}
                              onValueChange={(v) =>
                                updateAppointment(appointment.id, { delayUnit: v })
                              }
                            >
                              <SelectTrigger>
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
                          <div className="space-y-2">
                            <Label>Raison du délai</Label>
                            <Input
                              placeholder="Ex: Cicatrisation, temporisation..."
                              value={appointment.delayReason}
                              onChange={(e) =>
                                updateAppointment(appointment.id, { delayReason: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Objectifs de la séance</Label>
                        <Textarea
                          placeholder="Objectifs spécifiques à cette séance..."
                          rows={2}
                          value={appointment.objectives}
                          onChange={(e) =>
                            updateAppointment(appointment.id, { objectives: e.target.value })
                          }
                        />
                      </div>

                      {/* Treatments */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Traitements</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addTreatment(appointment.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Ajouter
                          </Button>
                        </div>

                        {appointment.treatments.map((treatment, treatIndex) => (
                          <Card key={treatment.id} className="bg-muted/30">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Traitement</Label>
                                    <Select
                                      value={treatment.treatmentCode}
                                      onValueChange={(v) =>
                                        updateTreatment(appointment.id, treatment.id, {
                                          treatmentCode: v,
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner..." />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-80">
                                        {Object.entries(groupedTreatments).map(
                                          ([category, treatments]) => (
                                            <div key={category}>
                                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                                                {TREATMENT_CATEGORIES[category as TreatmentCategory]?.name}
                                              </div>
                                              {treatments.map((t) => (
                                                <SelectItem key={t.id} value={t.id}>
                                                  {t.name}
                                                </SelectItem>
                                              ))}
                                            </div>
                                          )
                                        )}
                                      </SelectContent>
                                    </Select>
                                    {treatment.treatmentCode && (
                                      <p className="text-xs text-muted-foreground">
                                        {getTreatmentInfo(treatment.treatmentCode)?.description}
                                      </p>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-xs">Dent concernée</Label>
                                    <SingleToothSelector
                                      selectedTooth={treatment.toothNumber}
                                      onSelectionChange={(tooth) =>
                                        updateTreatment(appointment.id, treatment.id, {
                                          toothNumber: tooth,
                                        })
                                      }
                                      disabledTeeth={caseData?.missing_teeth || []}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-xs">Durée (min)</Label>
                                    <Input
                                      type="number"
                                      min={5}
                                      step={5}
                                      value={treatment.estimatedDuration}
                                      onChange={(e) =>
                                        updateTreatment(appointment.id, treatment.id, {
                                          estimatedDuration: parseInt(e.target.value) || 15,
                                        })
                                      }
                                    />
                                  </div>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0"
                                  onClick={() => removeTreatment(appointment.id, treatment.id)}
                                  disabled={appointment.treatments.length <= 1}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Justification clinique</Label>
                                <Textarea
                                  placeholder="Expliquez pourquoi ce traitement est indiqué..."
                                  rows={2}
                                  value={treatment.rationale}
                                  onChange={(e) =>
                                    updateTreatment(appointment.id, treatment.id, {
                                      rationale: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Remove appointment button */}
                      <div className="pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeAppointment(appointment.id)}
                          disabled={formData.appointments.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer cette séance
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href={caseData ? `/cases/${caseData.id}` : '/cases'}>Annuler</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer la séquence
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
