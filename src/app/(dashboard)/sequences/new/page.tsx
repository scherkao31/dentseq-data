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
import { useFormOptions } from '@/hooks/use-form-options'
import { createClient } from '@/lib/supabase/client'
import { ToothSelectorCompact } from '@/components/dental/tooth-selector'
import {
  ArrowLeft,
  ArrowDown,
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
  Hourglass,
  MessageSquarePlus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import {
  DELAY_UNIT_OPTIONS,
  AGE_RANGE_OPTIONS,
  SEX_OPTIONS,
  BUDGET_CONSTRAINT_OPTIONS,
  TIME_CONSTRAINT_OPTIONS,
  PAIN_LEVEL_OPTIONS,
  ORDER_CONSTRAINT_OPTIONS,
} from '@/lib/constants'
import {
  TREATMENT_CATEGORIES,
  type TreatmentCategory
} from '@/lib/constants/treatments'
import type { TreatmentPlan, AgeRange, Sex, BudgetConstraint, TimeConstraint, PainLevel, OrderConstraint } from '@/types/database'

type Treatment = {
  id: string
  treatmentCode: string
  teeth: string[]
  rationale: string
  notes: string
  estimatedDuration: number
  orderIndex: number
  orderConstraint: OrderConstraint
  orderRationale: string
}

type AppointmentGroup = {
  id: string
  title: string
  appointmentType: string
  objectives: string
  delayFromPrevious: number | null
  delayUnit: string
  delayReason: string
  delayRationale: string // Free text: why this delay/order
  groupingRationale: string // Free text: why these treatments together
  estimatedDuration: number
  treatments: Treatment[]
  orderIndex: number
}

type FormData = {
  planId: string
  title: string
  globalRationale: string
  appointments: AppointmentGroup[]
  // Patient context
  patientAgeRange: AgeRange | ''
  patientSex: Sex | ''
  budgetConstraint: BudgetConstraint
  timeConstraint: TimeConstraint
  timeConstraintDetails: string
  painLevel: PainLevel
  additionalContext: string
}

const createTreatment = (orderIndex: number): Treatment => ({
  id: crypto.randomUUID(),
  treatmentCode: '',
  teeth: [],
  rationale: '',
  notes: '',
  estimatedDuration: 15,
  orderIndex,
  orderConstraint: 'flexible',
  orderRationale: '',
})

const createAppointment = (orderIndex: number): AppointmentGroup => ({
  id: crypto.randomUUID(),
  title: `Séance ${orderIndex + 1}`,
  appointmentType: 'treatment',
  objectives: '',
  delayFromPrevious: orderIndex === 0 ? null : 1,
  delayUnit: 'weeks',
  delayReason: '',
  delayRationale: '',
  groupingRationale: '',
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

  // Load dynamic form options
  const {
    treatments: availableTreatments,
    appointmentTypes,
    delayReasons,
    isLoading: optionsLoading
  } = useFormOptions()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [planData, setPlanData] = useState<TreatmentPlan | null>(null)
  const [formData, setFormData] = useState<FormData>({
    planId: planIdParam || '',
    title: '',
    globalRationale: '',
    appointments: [createAppointment(0)],
    // Patient context defaults
    patientAgeRange: '',
    patientSex: '',
    budgetConstraint: 'no_constraint',
    timeConstraint: 'no_constraint',
    timeConstraintDetails: '',
    painLevel: 'none',
    additionalContext: '',
  })

  // Track which rationale sections are expanded (by appointment id)
  const [expandedDelayRationale, setExpandedDelayRationale] = useState<Set<string>>(new Set())
  const [expandedGroupingRationale, setExpandedGroupingRationale] = useState<Set<string>>(new Set())
  // Track which treatments are expanded (by treatment id) - all start collapsed
  const [expandedTreatments, setExpandedTreatments] = useState<Set<string>>(new Set())
  // Track which appointment notes are expanded (by appointment id) - all start collapsed
  const [expandedAppointmentNotes, setExpandedAppointmentNotes] = useState<Set<string>>(new Set())
  // Track which treatment notes are expanded (by treatment id) - all start collapsed
  const [expandedTreatmentNotes, setExpandedTreatmentNotes] = useState<Set<string>>(new Set())
  // Track which order rationale sections are expanded (by treatment id) - all start collapsed
  const [expandedOrderRationale, setExpandedOrderRationale] = useState<Set<string>>(new Set())

  const toggleTreatmentExpanded = (treatmentId: string) => {
    setExpandedTreatments(prev => {
      const next = new Set(prev)
      if (next.has(treatmentId)) {
        next.delete(treatmentId)
      } else {
        next.add(treatmentId)
      }
      return next
    })
  }

  const toggleAppointmentNotes = (appointmentId: string) => {
    setExpandedAppointmentNotes(prev => {
      const next = new Set(prev)
      if (next.has(appointmentId)) {
        next.delete(appointmentId)
      } else {
        next.add(appointmentId)
      }
      return next
    })
  }

  const toggleTreatmentNotes = (treatmentId: string) => {
    setExpandedTreatmentNotes(prev => {
      const next = new Set(prev)
      if (next.has(treatmentId)) {
        next.delete(treatmentId)
      } else {
        next.add(treatmentId)
      }
      return next
    })
  }

  const toggleOrderRationale = (treatmentId: string) => {
    setExpandedOrderRationale(prev => {
      const next = new Set(prev)
      if (next.has(treatmentId)) {
        next.delete(treatmentId)
      } else {
        next.add(treatmentId)
      }
      return next
    })
  }

  const toggleDelayRationale = (appointmentId: string) => {
    setExpandedDelayRationale(prev => {
      const next = new Set(prev)
      if (next.has(appointmentId)) {
        next.delete(appointmentId)
      } else {
        next.add(appointmentId)
      }
      return next
    })
  }

  const toggleGroupingRationale = (appointmentId: string) => {
    setExpandedGroupingRationale(prev => {
      const next = new Set(prev)
      if (next.has(appointmentId)) {
        next.delete(appointmentId)
      } else {
        next.add(appointmentId)
      }
      return next
    })
  }

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

  // Handler for when a treatment type is selected - also sets default duration
  const handleTreatmentSelect = (
    appointmentId: string,
    treatmentId: string,
    treatmentCode: string
  ) => {
    const treatmentInfo = getTreatmentById(treatmentCode)
    const defaultDuration = treatmentInfo?.typicalDuration || 15
    updateTreatment(appointmentId, treatmentId, {
      treatmentCode,
      estimatedDuration: defaultDuration,
    })
  }


  // Group treatments by category for the dropdown
  const groupedTreatments = useMemo(() => {
    const grouped: Record<TreatmentCategory, typeof availableTreatments> = {
      diagnostic: [],
      preventive: [],
      restorative: [],
      endodontic: [],
      periodontal: [],
      surgical: [],
      implant: [],
      prosthetic: [],
      orthodontic: [],
      other: [],
    }

    availableTreatments.forEach(treatment => {
      const category = treatment.treatmentCategory || 'other'
      if (grouped[category]) {
        grouped[category].push(treatment)
      }
    })

    // Remove empty categories
    return Object.fromEntries(
      Object.entries(grouped).filter(([, treatments]) => treatments.length > 0)
    ) as Record<TreatmentCategory, typeof availableTreatments>
  }, [availableTreatments])

  // Helper to get treatment info by ID
  const getTreatmentById = useCallback((treatmentId: string) => {
    return availableTreatments.find(t => t.id === treatmentId)
  }, [availableTreatments])

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
          status: 'draft',
          // Patient context
          patient_age_range: formData.patientAgeRange || null,
          patient_sex: formData.patientSex || null,
          budget_constraint: formData.budgetConstraint,
          time_constraint: formData.timeConstraint,
          time_constraint_details: formData.timeConstraintDetails || null,
          pain_level: formData.painLevel,
          additional_context: formData.additionalContext || null,
        })
        .select('id')
        .single()

      if (seqError) {
        console.error('Sequence error:', seqError.message, seqError.details, seqError.hint, seqError.code)
        throw new Error(`Sequence creation failed: ${seqError.message}`)
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
            delay_reason: appt.delayReason || null,
            delay_rationale_text: appt.delayRationale || null,
            grouping_rationale: appt.groupingRationale || null,
            estimated_duration_minutes: appt.estimatedDuration,
          })
          .select('id')
          .single()

        if (apptError) {
          console.error('Appointment error:', apptError.message, apptError.details, apptError.hint, apptError.code)
          throw new Error(`Appointment creation failed: ${apptError.message}`)
        }

        // Create treatments for this appointment
        const treatmentInserts = appt.treatments.map((t) => {
          const treatmentInfo = getTreatmentById(t.treatmentCode)
          return {
            appointment_group_id: appointmentGroup.id,
            position: t.orderIndex,
            treatment_type: t.treatmentCode,
            treatment_category: treatmentInfo?.treatmentCategory || 'other',
            teeth: t.teeth,
            rationale_treatment: t.rationale || null,
            estimated_duration_minutes: t.estimatedDuration,
            order_constraint: t.orderConstraint,
            order_rationale: t.orderRationale || null,
          }
        })

        const { error: treatError } = await supabase
          .from('treatments')
          .insert(treatmentInserts)

        if (treatError) {
          console.error('Treatment error:', treatError.message, treatError.details, treatError.hint, treatError.code)
          throw new Error(`Treatment creation failed: ${treatError.message}`)
        }
      }

      toast({
        title: 'Séquence créée',
        description: 'La séquence de traitement a été créée avec succès',
      })

      router.push(`/plans/${formData.planId}`)
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Impossible de créer la séquence: ${errorMessage}`,
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

              {/* Pain/sensitivity level */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Douleurs / sensibilité du patient
                </Label>
                <Select
                  value={formData.painLevel}
                  onValueChange={(v) => updateFormData({ painLevel: v as PainLevel })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAIN_LEVEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col">
                          <span>{opt.label}</span>
                          {'description' in opt && opt.description && (
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          )}
                        </div>
                      </SelectItem>
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

            <div className="space-y-2">
              {formData.appointments.map((appointment, apptIndex) => (
                <div key={appointment.id}>
                  {/* Inter-appointment delay card - shown BEFORE the appointment (except first) */}
                  {apptIndex > 0 && (
                    <div className="relative py-4">
                      {/* Vertical connector lines */}
                      <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

                      {/* Delay card */}
                      <div className="ml-12 mr-4">
                        <Card className="border-dashed border-2 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/50">
                                <Hourglass className="h-4 w-4 text-orange-600" />
                              </div>
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-orange-800 dark:text-orange-200">
                                    Délai avant {appointment.title}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      value={appointment.delayFromPrevious || ''}
                                      onChange={(e) =>
                                        updateAppointment(appointment.id, {
                                          delayFromPrevious: parseInt(e.target.value) || 0,
                                        })
                                      }
                                      className="w-20 h-8"
                                      placeholder="0"
                                    />
                                    <Select
                                      value={appointment.delayUnit}
                                      onValueChange={(v) =>
                                        updateAppointment(appointment.id, { delayUnit: v })
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
                                    <Select
                                      value={appointment.delayReason || ''}
                                      onValueChange={(v) => {
                                        // If "Pas de délai nécessaire" is selected, set delay to 0
                                        if (v === 'Pas de délai nécessaire') {
                                          updateAppointment(appointment.id, {
                                            delayReason: v,
                                            delayFromPrevious: 0
                                          })
                                        } else {
                                          updateAppointment(appointment.id, { delayReason: v })
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Raison du délai..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {delayReasons.map((reason) => (
                                          <SelectItem key={reason.id} value={reason.label}>
                                            <div className="flex items-center gap-2">
                                              <span>{reason.label}</span>
                                              {reason.typicalWeeks && (
                                                <span className="text-xs text-muted-foreground">
                                                  (~{reason.typicalWeeks} sem.)
                                                </span>
                                              )}
                                            </div>
                                          </SelectItem>
                                        ))}
                                        <SelectItem value="custom">Autre (personnalisé)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Custom reason input if "Autre" selected */}
                                {appointment.delayReason === 'custom' && (
                                  <Input
                                    placeholder="Précisez la raison du délai..."
                                    className="h-8"
                                    onChange={(e) =>
                                      updateAppointment(appointment.id, { delayReason: e.target.value })
                                    }
                                  />
                                )}

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
                                    {appointment.delayRationale && (
                                      <span className="text-green-600 dark:text-green-400">✓</span>
                                    )}
                                  </button>
                                  {expandedDelayRationale.has(appointment.id) && (
                                    <div className="mt-2">
                                      <Textarea
                                        placeholder="Pourquoi cette séance vient après la précédente ? (ex: cicatrisation nécessaire, stabilité parodontale requise...)"
                                        rows={2}
                                        className="text-sm bg-white dark:bg-gray-900"
                                        value={appointment.delayRationale}
                                        onChange={(e) =>
                                          updateAppointment(appointment.id, { delayRationale: e.target.value })
                                        }
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
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
                    defaultValue={[appointment.id]}
                  >
                    <AccordionItem
                      value={appointment.id}
                      className="border rounded-lg"
                    >
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
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
                                  {appointmentTypes.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.id}>
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
                              {appointment.objectives && (
                                <span className="text-green-600 dark:text-green-400">✓</span>
                              )}
                            </button>
                            {expandedAppointmentNotes.has(appointment.id) && (
                              <div className="mt-2 pl-6">
                                <Textarea
                                  placeholder="Notes ou informations supplémentaires pour cette séance..."
                                  rows={2}
                                  value={appointment.objectives}
                                  onChange={(e) =>
                                    updateAppointment(appointment.id, { objectives: e.target.value })
                                  }
                                />
                              </div>
                            )}
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

                        {appointment.treatments.map((treatment) => {
                          const treatmentInfo = getTreatmentById(treatment.treatmentCode)
                          const isExpanded = expandedTreatments.has(treatment.id)

                          return (
                            <Card key={treatment.id} className="bg-muted/30 overflow-hidden">
                              {/* Collapsed header - always visible */}
                              <button
                                type="button"
                                onClick={() => toggleTreatmentExpanded(treatment.id)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                  <span className="font-medium truncate">
                                    {treatmentInfo?.label || treatment.treatmentCode || 'Nouveau traitement'}
                                  </span>
                                  {treatment.teeth.length > 0 && (
                                    <Badge variant="outline" className="shrink-0 text-xs">
                                      {treatment.teeth.length} dent{treatment.teeth.length > 1 ? 's' : ''} : {treatment.teeth.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}
                                    </Badge>
                                  )}
                                  {treatment.estimatedDuration && (
                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                      {treatment.estimatedDuration} min
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

                              {/* Expanded content */}
                              {isExpanded && (
                                <CardContent className="p-4 pt-0 space-y-4 border-t">
                                  {/* Row 1: Treatment type, Duration */}
                                  <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="space-y-2">
                                      <Label className="text-xs">Traitement</Label>
                                      <Select
                                        value={treatment.treatmentCode}
                                        onValueChange={(v) =>
                                          handleTreatmentSelect(appointment.id, treatment.id, v)
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
                                                    {t.label}
                                                  </SelectItem>
                                                ))}
                                              </div>
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
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

                                  {/* Row 2: Teeth selector */}
                                  <div className="space-y-2">
                                    <Label className="text-xs">Dent(s) concernée(s)</Label>
                                    <ToothSelectorCompact
                                      selectedTeeth={treatment.teeth}
                                      onSelectionChange={(teeth) =>
                                        updateTreatment(appointment.id, treatment.id, {
                                          teeth,
                                        })
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
                                              orderConstraint: opt.value as OrderConstraint,
                                            })
                                          }
                                          className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-colors ${
                                            treatment.orderConstraint === opt.value
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
                                  {treatment.orderConstraint !== 'flexible' && (
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
                                        {treatment.orderRationale && (
                                          <span className="text-green-600 dark:text-green-400">✓</span>
                                        )}
                                      </button>
                                      {expandedOrderRationale.has(treatment.id) && (
                                        <div className="mt-2 pl-5">
                                          <Textarea
                                            placeholder="Expliquez pourquoi ce traitement doit être dans cet ordre..."
                                            rows={2}
                                            value={treatment.orderRationale}
                                            onChange={(e) =>
                                              updateTreatment(appointment.id, treatment.id, {
                                                orderRationale: e.target.value,
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
                                      {treatment.rationale && (
                                        <span className="text-green-600 dark:text-green-400">✓</span>
                                      )}
                                    </button>
                                    {expandedTreatmentNotes.has(treatment.id) && (
                                      <div className="mt-2 pl-5">
                                        <Textarea
                                          placeholder="Notes ou justification pour ce choix de traitement..."
                                          rows={2}
                                          value={treatment.rationale}
                                          onChange={(e) =>
                                            updateTreatment(appointment.id, treatment.id, {
                                              rationale: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          )
                        })}

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
                              {appointment.groupingRationale && (
                                <span className="text-green-600 dark:text-green-400">✓</span>
                              )}
                            </button>
                            {expandedGroupingRationale.has(appointment.id) && (
                              <div className="mt-2">
                                <Textarea
                                  placeholder="Pourquoi regrouper ces traitements dans la même séance ? (ex: même zone d'anesthésie, optimisation du temps patient, séquence technique obligatoire...)"
                                  rows={2}
                                  className="text-sm"
                                  value={appointment.groupingRationale}
                                  onChange={(e) =>
                                    updateAppointment(appointment.id, { groupingRationale: e.target.value })
                                  }
                                />
                              </div>
                            )}
                          </div>
                        )}
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
                  </Accordion>
                </div>
              ))}
            </div>
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
