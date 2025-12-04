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
import { Separator } from '@/components/ui/separator'
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
  User,
  Wallet,
  Timer,
  Heart,
} from 'lucide-react'
import Link from 'next/link'
import {
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
import {
  TREATMENT_CATEGORIES,
  getGroupedTreatments,
  getTreatmentById,
  type TreatmentCategory
} from '@/lib/constants/treatments'
import type { TreatmentPlan, AgeRange, Sex, BudgetConstraint, TimeConstraint, PatientPriority, DentalAnxiety } from '@/types/database'

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
  planId: string
  title: string
  globalRationale: string
  treatmentGoals: string[]
  appointments: AppointmentGroup[]
  // Patient context
  patientAgeRange: AgeRange | ''
  patientSex: Sex | ''
  budgetConstraint: BudgetConstraint
  timeConstraint: TimeConstraint
  timeConstraintDetails: string
  patientPriorities: PatientPriority[]
  dentalAnxiety: DentalAnxiety
  additionalContext: string
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
  const planIdParam = searchParams.get('planId')
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [planData, setPlanData] = useState<TreatmentPlan | null>(null)
  const [formData, setFormData] = useState<FormData>({
    planId: planIdParam || '',
    title: '',
    globalRationale: '',
    treatmentGoals: [],
    appointments: [createAppointment(0)],
    // Patient context defaults
    patientAgeRange: '',
    patientSex: '',
    budgetConstraint: 'no_constraint',
    timeConstraint: 'no_constraint',
    timeConstraintDetails: '',
    patientPriorities: [],
    dentalAnxiety: 'none',
    additionalContext: '',
  })

  // Load plan data if planId is provided
  useEffect(() => {
    async function loadPlan() {
      if (!planIdParam) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('id', planIdParam)
        .single()

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger le plan de traitement',
        })
        router.push('/plans')
        return
      }

      setPlanData(data as unknown as TreatmentPlan)
      setFormData((prev) => ({ ...prev, planId: planIdParam }))
      setIsLoading(false)
    }

    loadPlan()
  }, [planIdParam, supabase, toast, router])

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

  const togglePriority = (priority: PatientPriority) => {
    const current = formData.patientPriorities
    if (current.includes(priority)) {
      updateFormData({ patientPriorities: current.filter((p) => p !== priority) })
    } else {
      updateFormData({ patientPriorities: [...current, priority] })
    }
  }

  const groupedTreatments = useMemo(() => getGroupedTreatments(), [])

  const handleSubmit = async () => {
    if (!formData.planId) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez sélectionner un plan de traitement',
      })
      return
    }

    if (!formData.patientAgeRange || !formData.patientSex) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez renseigner l\'âge et le sexe du patient',
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

      // Create the sequence with patient context
      const { data: sequence, error: seqError } = await supabase
        .from('treatment_sequences')
        .insert({
          plan_id: formData.planId,
          created_by: dentist.id,
          last_modified_by: dentist.id,
          title: formData.title || null,
          overall_strategy: formData.globalRationale || null,
          treatment_goals: formData.treatmentGoals,
          status: 'draft',
          // Patient context
          patient_age_range: formData.patientAgeRange || null,
          patient_sex: formData.patientSex || null,
          budget_constraint: formData.budgetConstraint,
          time_constraint: formData.timeConstraint,
          time_constraint_details: formData.timeConstraintDetails || null,
          patient_priorities: formData.patientPriorities,
          dental_anxiety: formData.dentalAnxiety,
          additional_context: formData.additionalContext || null,
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
            position: appt.orderIndex,
            title: appt.title,
            appointment_type: appt.appointmentType,
            objectives: appt.objectives ? [appt.objectives] : null,
            delay_value: appt.delayFromPrevious,
            delay_unit: appt.delayUnit,
            delay_rationale: appt.delayReason || null,
            estimated_duration_minutes: appt.estimatedDuration,
          })
          .select('id')
          .single()

        if (apptError) {
          console.error('Appointment error:', apptError)
          throw apptError
        }

        // Create treatments for this appointment
        const treatmentInserts = appt.treatments.map((t) => {
          const treatmentInfo = getTreatmentById(t.treatmentCode)
          return {
            appointment_group_id: appointmentGroup.id,
            position: t.orderIndex,
            treatment_type: t.treatmentCode,
            treatment_category: treatmentInfo?.category || 'other',
            teeth: t.toothNumber ? [t.toothNumber] : [],
            rationale_treatment: t.rationale || null,
            estimated_duration_minutes: t.estimatedDuration,
          }
        })

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

      router.push(`/plans/${formData.planId}`)
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
            <Link href={planData ? `/plans/${planData.id}` : '/plans'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>

          {/* Plan info */}
          {planData && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{planData.plan_number}</Badge>
                  <CardTitle className="text-lg">{planData.title || planData.raw_input}</CardTitle>
                </div>
                <CardDescription>
                  Créez une séquence de traitement pour ce plan
                </CardDescription>
                {planData.dentistry_types && planData.dentistry_types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {planData.dentistry_types.map(type => (
                      <Badge key={type} variant="secondary" className={TREATMENT_CATEGORIES[type]?.color || ''}>
                        {TREATMENT_CATEGORIES[type]?.name || type}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
            </Card>
          )}

          {/* Patient Context Card - NEW */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contexte patient
              </CardTitle>
              <CardDescription>
                Ces informations influencent la séquence de traitement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Demographics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tranche d'âge *</Label>
                  <Select
                    value={formData.patientAgeRange}
                    onValueChange={(v) => updateFormData({ patientAgeRange: v as AgeRange })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_RANGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sexe *</Label>
                  <Select
                    value={formData.patientSex}
                    onValueChange={(v) => updateFormData({ patientSex: v as Sex })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEX_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Constraints */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Contrainte budgétaire
                  </Label>
                  <Select
                    value={formData.budgetConstraint}
                    onValueChange={(v) => updateFormData({ budgetConstraint: v as BudgetConstraint })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_CONSTRAINT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Contrainte de temps
                  </Label>
                  <Select
                    value={formData.timeConstraint}
                    onValueChange={(v) => updateFormData({ timeConstraint: v as TimeConstraint })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_CONSTRAINT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.timeConstraint !== 'no_constraint' && (
                <div className="space-y-2">
                  <Label>Détails de la contrainte de temps</Label>
                  <Input
                    placeholder="Ex: Mariage dans 3 semaines, voyage prévu..."
                    value={formData.timeConstraintDetails}
                    onChange={(e) => updateFormData({ timeConstraintDetails: e.target.value })}
                  />
                </div>
              )}

              <Separator />

              {/* Patient priorities */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Priorités du patient
                </Label>
                <p className="text-sm text-muted-foreground">
                  Qu'est-ce qui compte le plus pour ce patient ?
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PATIENT_PRIORITY_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.patientPriorities.includes(opt.value as PatientPriority)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => togglePriority(opt.value as PatientPriority)}
                    >
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Anxiety */}
              <div className="space-y-2">
                <Label>Anxiété dentaire</Label>
                <Select
                  value={formData.dentalAnxiety}
                  onValueChange={(v) => updateFormData({ dentalAnxiety: v as DentalAnxiety })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DENTAL_ANXIETY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional context */}
              <div className="space-y-2">
                <Label>Contexte additionnel (optionnel)</Label>
                <Textarea
                  placeholder="Autres informations pertinentes pour cette séquence..."
                  rows={2}
                  value={formData.additionalContext}
                  onChange={(e) => updateFormData({ additionalContext: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sequence info */}
          <Card>
            <CardHeader>
              <CardTitle>Stratégie de traitement</CardTitle>
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
                        <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                          <Label className="text-sm font-medium">Délai depuis la séance précédente</Label>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Durée</Label>
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
                              <Label className="text-xs text-muted-foreground">Unité</Label>
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
                              <Label className="text-xs text-muted-foreground">Raison (optionnel)</Label>
                              <Input
                                placeholder="Cicatrisation..."
                                value={appointment.delayReason}
                                onChange={(e) =>
                                  updateAppointment(appointment.id, { delayReason: e.target.value })
                                }
                              />
                            </div>
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

                        {appointment.treatments.map((treatment) => (
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
              <Link href={planData ? `/plans/${planData.id}` : '/plans'}>Annuler</Link>
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
