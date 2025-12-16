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
import { TreatmentCombobox } from '@/components/dental/treatment-combobox'
import { DelayReasonCombobox } from '@/components/dental/delay-reason-combobox'
import {
  ArrowLeft,
  ArrowDown,
  Plus,
  Trash2,
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
  Check,
  MoveUp,
  MoveDown,
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
import type { TreatmentPlan, TreatmentPlanItem, AgeRange, Sex, BudgetConstraint, TimeConstraint, PainLevel, OrderConstraint } from '@/types/database'
import { Link2 } from 'lucide-react'

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
  planItemIds: string[]  // Links to original plan items for ML traceability (can be multiple)
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
  planItemIds: [],
})

const createAppointment = (orderIndex: number): AppointmentGroup => {
  const initialTreatment = createTreatment(0)
  return {
    id: crypto.randomUUID(),
    title: `Séance ${orderIndex + 1}`,
    appointmentType: 'treatment',
    objectives: '',
    delayFromPrevious: orderIndex === 0 ? null : 0,
    delayUnit: 'days',
    delayReason: orderIndex === 0 ? '' : 'Pas de délai nécessaire',
    delayRationale: '',
    groupingRationale: '',
    estimatedDuration: initialTreatment.estimatedDuration, // Auto-calculated from treatments
    treatments: [initialTreatment],
    orderIndex,
  }
}

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

  // Track which appointments (séances) are expanded - all start expanded
  const [expandedAppointments, setExpandedAppointments] = useState<Set<string>>(() => {
    // Initialize with the first appointment expanded
    return new Set([formData.appointments[0]?.id].filter(Boolean))
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
  // Track which delay cards are expanded (by appointment id) - all start collapsed
  const [expandedDelayCards, setExpandedDelayCards] = useState<Set<string>>(new Set())

  const toggleAppointmentExpanded = (appointmentId: string) => {
    setExpandedAppointments(prev => {
      const next = new Set(prev)
      if (next.has(appointmentId)) {
        next.delete(appointmentId)
      } else {
        next.add(appointmentId)
      }
      return next
    })
  }

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

  const toggleDelayCard = (appointmentId: string) => {
    setExpandedDelayCards(prev => {
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
    const newAppointment = createAppointment(newIndex)
    updateFormData({
      appointments: [...formData.appointments, newAppointment],
    })
    // Auto-expand the new appointment
    setExpandedAppointments(prev => {
      const next = new Set(prev)
      next.add(newAppointment.id)
      return next
    })
  }

  const removeAppointment = (appointmentId: string) => {
    if (formData.appointments.length <= 1) return
    const updated = formData.appointments
      .filter((a) => a.id !== appointmentId)
      .map((a, idx) => ({ ...a, orderIndex: idx, title: `Séance ${idx + 1}` }))
    updateFormData({ appointments: updated })
  }

  // Move appointment up/down
  const moveAppointment = (appointmentId: string, direction: 'up' | 'down') => {
    const index = formData.appointments.findIndex(a => a.id === appointmentId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === formData.appointments.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newAppointments = [...formData.appointments]

    // Swap appointments
    const temp = newAppointments[index]
    newAppointments[index] = newAppointments[newIndex]
    newAppointments[newIndex] = temp

    // Update positions and titles
    const updated = newAppointments.map((a, idx) => ({
      ...a,
      orderIndex: idx,
      title: `Séance ${idx + 1}`,
    }))
    updateFormData({ appointments: updated })
  }

  // Move treatment up/down within an appointment
  const moveTreatment = (appointmentId: string, treatmentId: string, direction: 'up' | 'down') => {
    const updated = formData.appointments.map(a => {
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
        treatments: newTreatments.map((t, idx) => ({ ...t, orderIndex: idx })),
      }
    })
    updateFormData({ appointments: updated })
  }

  const updateAppointment = (appointmentId: string, updates: Partial<AppointmentGroup>) => {
    const updated = formData.appointments.map((a) =>
      a.id === appointmentId ? { ...a, ...updates } : a
    )
    updateFormData({ appointments: updated })
  }

  // Helper to calculate total duration from treatments
  const calculateAppointmentDuration = (treatments: Treatment[]): number => {
    return treatments.reduce((sum, t) => sum + (t.estimatedDuration || 0), 0)
  }

  const addTreatment = (appointmentId: string) => {
    const newTreatment = createTreatment(0) // Will be updated with correct index
    const updated = formData.appointments.map((a) => {
      if (a.id === appointmentId) {
        const newIndex = a.treatments.length
        const treatmentWithIndex = { ...newTreatment, orderIndex: newIndex }
        const newTreatments = [...a.treatments, treatmentWithIndex]
        return {
          ...a,
          treatments: newTreatments,
          estimatedDuration: calculateAppointmentDuration(newTreatments),
        }
      }
      return a
    })
    updateFormData({ appointments: updated })
    // Auto-expand the new treatment
    setExpandedTreatments(prev => {
      const next = new Set(prev)
      next.add(newTreatment.id)
      return next
    })
  }

  const removeTreatment = (appointmentId: string, treatmentId: string) => {
    const updated = formData.appointments.map((a) => {
      if (a.id === appointmentId) {
        if (a.treatments.length <= 1) return a
        const treatments = a.treatments
          .filter((t) => t.id !== treatmentId)
          .map((t, idx) => ({ ...t, orderIndex: idx }))
        return {
          ...a,
          treatments,
          estimatedDuration: calculateAppointmentDuration(treatments),
        }
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
        // Recalculate duration if treatment duration changed
        const newDuration = 'estimatedDuration' in updates
          ? calculateAppointmentDuration(treatments)
          : a.estimatedDuration
        return { ...a, treatments, estimatedDuration: newDuration }
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

    // Patient context validation removed - creating ideal sequences only for now

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
            plan_item_ids: t.planItemIds.length > 0 ? t.planItemIds : [],
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

      router.push(`/sequences/${sequence.id}`)
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
              {/* Treatment items from the plan */}
              {planData.treatment_items && (planData.treatment_items as TreatmentPlanItem[]).length > 0 && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Traitements à séquencer</Label>
                    <div className="space-y-2">
                      {(planData.treatment_items as TreatmentPlanItem[]).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-2 rounded-md bg-muted/50 text-sm"
                        >
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-xs ${TREATMENT_CATEGORIES[item.category]?.color || ''}`}
                          >
                            {TREATMENT_CATEGORIES[item.category]?.name || item.category}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{item.treatment_description}</p>
                            {item.teeth.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Dent{item.teeth.length > 1 ? 's' : ''}: {item.teeth.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Patient Context Card - HIDDEN for ideal sequences (no patient context needed)
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
              {/* ... rest of patient context fields ... */}
            {/*</CardContent>
          </Card>
          */}

          {/* Appointments */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Séances de traitement</h2>

            <div className="space-y-2">
              {formData.appointments.map((appointment, apptIndex) => (
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
                                {appointment.delayFromPrevious ? (
                                  <Badge variant="outline" className="border-orange-300 text-orange-700 dark:text-orange-300">
                                    {appointment.delayFromPrevious} {DELAY_UNIT_OPTIONS.find(o => o.value === appointment.delayUnit)?.label || appointment.delayUnit}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground italic">Non défini</span>
                                )}
                                {appointment.delayReason && appointment.delayReason !== 'Autre (personnalisé)' && (
                                  <span className="truncate max-w-[150px] hidden sm:inline">{appointment.delayReason}</span>
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
                                    <DelayReasonCombobox
                                      reasons={delayReasons}
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
                                      placeholder="Raison du délai..."
                                    />
                                  </div>
                                </div>

                                {/* Custom reason input if "Autre" selected */}
                                {appointment.delayReason === 'Autre (personnalisé)' && (
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
                              disabled={apptIndex === formData.appointments.length - 1}
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
                        <Label className="text-base font-semibold">Traitements</Label>

                        {appointment.treatments.map((treatment, treatmentIndex) => {
                          const treatmentInfo = getTreatmentById(treatment.treatmentCode)
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
                                  onClick={() => toggleTreatmentExpanded(treatment.id)}
                                  className="flex-1 flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
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
                                        value={treatment.treatmentCode}
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

                                  {/* Optional: Link to plan items for ML traceability */}
                                  {planData?.treatment_items && planData.treatment_items.length > 0 && (
                                    <div className="pt-2 border-t border-dashed">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Link2 className="h-3 w-3 text-muted-foreground" />
                                        <Label className="text-xs text-muted-foreground">Lié aux éléments du plan</Label>
                                      </div>
                                      <div className="space-y-1.5 max-h-[200px] overflow-y-auto rounded-md border p-2 bg-muted/30">
                                        {(planData.treatment_items as TreatmentPlanItem[]).map((item) => {
                                          const isSelected = treatment.planItemIds.includes(item.id)
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
                                                  const newPlanItemIds = e.target.checked
                                                    ? [...treatment.planItemIds, item.id]
                                                    : treatment.planItemIds.filter(id => id !== item.id)
                                                  updateTreatment(appointment.id, treatment.id, {
                                                    planItemIds: newPlanItemIds,
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
                                      {treatment.planItemIds.length > 0 && (
                                        <div className="mt-1 text-xs text-muted-foreground">
                                          {treatment.planItemIds.length} élément{treatment.planItemIds.length > 1 ? 's' : ''} lié{treatment.planItemIds.length > 1 ? 's' : ''}
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
                                      onClick={() => toggleTreatmentExpanded(treatment.id)}
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

                          {/* Appointment duration - at the end after all treatments */}
                          <div className="pt-3 border-t flex items-center gap-3">
                            <Label className="text-sm whitespace-nowrap">Durée totale de la séance:</Label>
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
                              disabled={formData.appointments.length <= 1}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer cette séance
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                              onClick={() => toggleAppointmentExpanded(appointment.id)}
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
            <Button onClick={addAppointment} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une séance
            </Button>
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
