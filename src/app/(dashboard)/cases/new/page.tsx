'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { ToothSelector } from '@/components/dental/tooth-selector'
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import {
  AGE_RANGE_OPTIONS,
  SEX_OPTIONS,
  GENERAL_HEALTH_OPTIONS,
  COMPLEXITY_OPTIONS,
  ORAL_HYGIENE_OPTIONS,
  COMPLIANCE_OPTIONS,
  PERIO_STAGE_OPTIONS,
  PERIO_GRADE_OPTIONS,
  MEDICAL_CONDITIONS,
  COMMON_ALLERGIES,
  PATIENT_PRIORITY_OPTIONS,
  BUDGET_CONSTRAINT_OPTIONS,
  TIME_CONSTRAINT_OPTIONS,
  DENTAL_ANXIETY_OPTIONS,
  SMOKING_STATUS_OPTIONS,
  DIABETES_CONTROL_OPTIONS,
  BRUXISM_OPTIONS,
  BOP_OPTIONS,
} from '@/lib/constants'

type FormData = {
  title: string
  chiefComplaint: string
  chiefComplaintSymptoms: string[]
  patientAgeRange: string
  patientSex: string
  patientGeneralHealth: string
  complexity: string
  patientOralHygiene: string
  patientCompliance: string
  medicalConditions: string[]
  allergies: string[]
  medicalNotes: string
  perioStage: string
  perioGrade: string
  perioDiagnosis: string
  missingTeeth: string[]
  additionalNotes: string
  // Decision Context - Patient Constraints
  patientPriorities: string[]
  budgetConstraint: string
  timeConstraint: string
  timeConstraintDetails: string
  dentalAnxiety: string
  // Decision Context - Risk Factors
  smokingStatus: string
  diabetesControl: string
  bruxism: string
  bopPercentage: string
}

const initialFormData: FormData = {
  title: '',
  chiefComplaint: '',
  chiefComplaintSymptoms: [],
  patientAgeRange: '',
  patientSex: '',
  patientGeneralHealth: '',
  complexity: 'moderate',
  patientOralHygiene: '',
  patientCompliance: '',
  medicalConditions: [],
  allergies: [],
  medicalNotes: '',
  perioStage: '',
  perioGrade: '',
  perioDiagnosis: '',
  missingTeeth: [],
  additionalNotes: '',
  // Decision Context
  patientPriorities: [],
  budgetConstraint: '',
  timeConstraint: '',
  timeConstraintDetails: '',
  dentalAnxiety: '',
  smokingStatus: '',
  diabetesControl: '',
  bruxism: '',
  bopPercentage: '',
}

const CHIEF_COMPLAINT_SYMPTOMS = [
  'Douleur',
  'Sensibilité',
  'Saignement',
  'Mobilité dentaire',
  'Gonflement',
  'Mauvaise haleine',
  'Esthétique',
  'Fonction masticatoire',
  'Absence dentaire',
  'Fracture dentaire',
]

const STEPS = [
  { id: 'chief', title: 'Motif', description: 'Raison de la consultation' },
  { id: 'patient', title: 'Patient', description: 'Informations sur le patient' },
  { id: 'constraints', title: 'Contraintes', description: 'Priorités et contraintes du patient' },
  { id: 'medical', title: 'Médical', description: 'Antécédents et facteurs de risque' },
  { id: 'dental', title: 'Dentaire', description: 'Examen clinique' },
  { id: 'review', title: 'Résumé', description: 'Vérification finale' },
]

export default function NewCasePage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Vous devez être connecté pour créer un plan',
        })
        return
      }

      // Get dentist ID
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

      // Create the case
      const { data: newCase, error } = await supabase
        .from('clinical_cases')
        .insert({
          created_by: dentist.id,
          last_modified_by: dentist.id,
          title: formData.title,
          chief_complaint: formData.chiefComplaint,
          chief_complaint_symptoms: formData.chiefComplaintSymptoms,
          patient_age_range: formData.patientAgeRange || null,
          patient_sex: formData.patientSex || null,
          patient_general_health: formData.patientGeneralHealth || null,
          complexity: formData.complexity || null,
          patient_oral_hygiene: formData.patientOralHygiene || null,
          patient_compliance: formData.patientCompliance || null,
          medical_history: {
            conditions: formData.medicalConditions,
            allergies: formData.allergies,
            notes: formData.medicalNotes,
          },
          perio_stage: formData.perioStage || null,
          perio_grade: formData.perioGrade || null,
          perio_diagnosis: formData.perioDiagnosis || null,
          missing_teeth: formData.missingTeeth,
          additional_notes: formData.additionalNotes || null,
          // Decision Context - Patient Constraints
          patient_priorities: formData.patientPriorities.length > 0 ? formData.patientPriorities : null,
          budget_constraint: formData.budgetConstraint || null,
          time_constraint: formData.timeConstraint || null,
          time_constraint_details: formData.timeConstraintDetails || null,
          dental_anxiety: formData.dentalAnxiety || null,
          // Decision Context - Risk Factors
          smoking_status: formData.smokingStatus || null,
          diabetes_control: formData.diabetesControl || null,
          bruxism: formData.bruxism || null,
          bop_percentage: formData.bopPercentage || null,
          status: 'draft',
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating case:', error)
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de créer le plan de traitement',
        })
        return
      }

      toast({
        title: 'Plan créé',
        description: 'Le plan de traitement a été créé avec succès',
      })

      router.push(`/cases/${newCase.id}`)
    } catch (error) {
      console.error('Error:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleSymptom = (symptom: string) => {
    const current = formData.chiefComplaintSymptoms
    if (current.includes(symptom)) {
      updateFormData({ chiefComplaintSymptoms: current.filter((s) => s !== symptom) })
    } else {
      updateFormData({ chiefComplaintSymptoms: [...current, symptom] })
    }
  }

  const toggleCondition = (condition: string) => {
    const current = formData.medicalConditions
    if (current.includes(condition)) {
      updateFormData({ medicalConditions: current.filter((c) => c !== condition) })
    } else {
      updateFormData({ medicalConditions: [...current, condition] })
    }
  }

  const toggleAllergy = (allergy: string) => {
    const current = formData.allergies
    if (current.includes(allergy)) {
      updateFormData({ allergies: current.filter((a) => a !== allergy) })
    } else {
      updateFormData({ allergies: [...current, allergy] })
    }
  }

  const togglePriority = (priority: string) => {
    const current = formData.patientPriorities
    if (current.includes(priority)) {
      updateFormData({ patientPriorities: current.filter((p) => p !== priority) })
    } else {
      updateFormData({ patientPriorities: [...current, priority] })
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Chief complaint
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du plan *</Label>
              <Input
                id="title"
                placeholder="Ex: Réhabilitation complète arcade supérieure"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chiefComplaint">Motif de consultation *</Label>
              <Textarea
                id="chiefComplaint"
                placeholder="Décrivez le motif principal de consultation du patient..."
                rows={4}
                value={formData.chiefComplaint}
                onChange={(e) => updateFormData({ chiefComplaint: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Symptômes associés</Label>
              <div className="flex flex-wrap gap-2">
                {CHIEF_COMPLAINT_SYMPTOMS.map((symptom) => (
                  <Badge
                    key={symptom}
                    variant={formData.chiefComplaintSymptoms.includes(symptom) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSymptom(symptom)}
                  >
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complexity">Complexité estimée</Label>
              <Select
                value={formData.complexity}
                onValueChange={(value) => updateFormData({ complexity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la complexité" />
                </SelectTrigger>
                <SelectContent>
                  {COMPLEXITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 1: // Patient info
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tranche d'âge *</Label>
                <Select
                  value={formData.patientAgeRange}
                  onValueChange={(value) => updateFormData({ patientAgeRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_RANGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sexe *</Label>
                <Select
                  value={formData.patientSex}
                  onValueChange={(value) => updateFormData({ patientSex: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEX_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>État de santé général</Label>
              <Select
                value={formData.patientGeneralHealth}
                onValueChange={(value) => updateFormData({ patientGeneralHealth: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {GENERAL_HEALTH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hygiène orale</Label>
                <Select
                  value={formData.patientOralHygiene}
                  onValueChange={(value) => updateFormData({ patientOralHygiene: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORAL_HYGIENE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Compliance attendue</Label>
                <Select
                  value={formData.patientCompliance}
                  onValueChange={(value) => updateFormData({ patientCompliance: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLIANCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 2: // Patient Constraints (NEW STEP)
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Priorités du patient</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Qu'est-ce qui compte le plus pour ce patient ? (plusieurs choix possibles)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PATIENT_PRIORITY_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.patientPriorities.includes(option.value)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => togglePriority(option.value)}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contrainte budgétaire</Label>
                <Select
                  value={formData.budgetConstraint}
                  onValueChange={(value) => updateFormData({ budgetConstraint: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_CONSTRAINT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contrainte de temps</Label>
                <Select
                  value={formData.timeConstraint}
                  onValueChange={(value) => updateFormData({ timeConstraint: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_CONSTRAINT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.timeConstraint && formData.timeConstraint !== 'no_constraint' && (
              <div className="space-y-2">
                <Label htmlFor="timeConstraintDetails">Détails de la contrainte de temps</Label>
                <Input
                  id="timeConstraintDetails"
                  placeholder="Ex: Mariage dans 3 mois, voyage prévu..."
                  value={formData.timeConstraintDetails}
                  onChange={(e) => updateFormData({ timeConstraintDetails: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Anxiété dentaire</Label>
              <Select
                value={formData.dentalAnxiety}
                onValueChange={(value) => updateFormData({ dentalAnxiety: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {DENTAL_ANXIETY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 3: // Medical history + Risk factors
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Conditions médicales</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                {MEDICAL_CONDITIONS.map((condition) => (
                  <div key={condition.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={condition.id}
                      checked={formData.medicalConditions.includes(condition.id)}
                      onCheckedChange={() => toggleCondition(condition.id)}
                    />
                    <label
                      htmlFor={condition.id}
                      className="text-sm leading-none cursor-pointer"
                    >
                      {condition.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Allergies</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_ALLERGIES.map((allergy) => (
                  <Badge
                    key={allergy.id}
                    variant={formData.allergies.includes(allergy.id) ? 'destructive' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleAllergy(allergy.id)}
                  >
                    {allergy.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Risk Factors Section */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-4">Facteurs de risque</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tabagisme</Label>
                  <Select
                    value={formData.smokingStatus}
                    onValueChange={(value) => updateFormData({ smokingStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {SMOKING_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Diabète</Label>
                  <Select
                    value={formData.diabetesControl}
                    onValueChange={(value) => updateFormData({ diabetesControl: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIABETES_CONTROL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Bruxisme</Label>
                  <Select
                    value={formData.bruxism}
                    onValueChange={(value) => updateFormData({ bruxism: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRUXISM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Saignement au sondage (BOP)</Label>
                  <Select
                    value={formData.bopPercentage}
                    onValueChange={(value) => updateFormData({ bopPercentage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOP_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalNotes">Notes médicales</Label>
              <Textarea
                id="medicalNotes"
                placeholder="Informations médicales complémentaires..."
                rows={2}
                value={formData.medicalNotes}
                onChange={(e) => updateFormData({ medicalNotes: e.target.value })}
              />
            </div>
          </div>
        )

      case 4: // Dental status
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stade parodontal</Label>
                <Select
                  value={formData.perioStage}
                  onValueChange={(value) => updateFormData({ perioStage: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIO_STAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Grade parodontal</Label>
                <Select
                  value={formData.perioGrade}
                  onValueChange={(value) => updateFormData({ perioGrade: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIO_GRADE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="perioDiagnosis">Diagnostic parodontal</Label>
              <Input
                id="perioDiagnosis"
                placeholder="Ex: Parodontite chronique généralisée"
                value={formData.perioDiagnosis}
                onChange={(e) => updateFormData({ perioDiagnosis: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Dents absentes</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Sélectionnez les dents absentes du patient
              </p>
              <ToothSelector
                selectedTeeth={formData.missingTeeth}
                onSelectionChange={(teeth) => updateFormData({ missingTeeth: teeth })}
                size="sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Notes additionnelles</Label>
              <Textarea
                id="additionalNotes"
                placeholder="Autres informations cliniques pertinentes..."
                rows={3}
                value={formData.additionalNotes}
                onChange={(e) => updateFormData({ additionalNotes: e.target.value })}
              />
            </div>
          </div>
        )

      case 5: // Review
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Motif de consultation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><strong>Titre:</strong> {formData.title || '-'}</p>
                <p><strong>Motif:</strong> {formData.chiefComplaint || '-'}</p>
                {formData.chiefComplaintSymptoms.length > 0 && (
                  <p><strong>Symptômes:</strong> {formData.chiefComplaintSymptoms.join(', ')}</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Patient</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><strong>Âge:</strong> {AGE_RANGE_OPTIONS.find((o) => o.value === formData.patientAgeRange)?.label || '-'}</p>
                  <p><strong>Sexe:</strong> {SEX_OPTIONS.find((o) => o.value === formData.patientSex)?.label || '-'}</p>
                  <p><strong>Hygiène:</strong> {ORAL_HYGIENE_OPTIONS.find((o) => o.value === formData.patientOralHygiene)?.label || '-'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Contraintes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {formData.patientPriorities.length > 0 && (
                    <p><strong>Priorités:</strong> {formData.patientPriorities.map(p => PATIENT_PRIORITY_OPTIONS.find(o => o.value === p)?.label).join(', ')}</p>
                  )}
                  {formData.budgetConstraint && (
                    <p><strong>Budget:</strong> {BUDGET_CONSTRAINT_OPTIONS.find(o => o.value === formData.budgetConstraint)?.label}</p>
                  )}
                  {formData.dentalAnxiety && (
                    <p><strong>Anxiété:</strong> {DENTAL_ANXIETY_OPTIONS.find(o => o.value === formData.dentalAnxiety)?.label}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Facteurs de risque</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {formData.smokingStatus && (
                    <p><strong>Tabac:</strong> {SMOKING_STATUS_OPTIONS.find(o => o.value === formData.smokingStatus)?.label}</p>
                  )}
                  {formData.diabetesControl && (
                    <p><strong>Diabète:</strong> {DIABETES_CONTROL_OPTIONS.find(o => o.value === formData.diabetesControl)?.label}</p>
                  )}
                  {formData.bruxism && (
                    <p><strong>Bruxisme:</strong> {BRUXISM_OPTIONS.find(o => o.value === formData.bruxism)?.label}</p>
                  )}
                  {!formData.smokingStatus && !formData.diabetesControl && !formData.bruxism && (
                    <p className="text-muted-foreground">Non renseigné</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">État dentaire</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>
                    <strong>Parodonte:</strong>{' '}
                    {formData.perioStage
                      ? `${PERIO_STAGE_OPTIONS.find((o) => o.value === formData.perioStage)?.label} / ${PERIO_GRADE_OPTIONS.find((o) => o.value === formData.perioGrade)?.label}`
                      : 'Non renseigné'}
                  </p>
                  {formData.missingTeeth.length > 0 && (
                    <p><strong>Dents absentes:</strong> {formData.missingTeeth.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.title.trim() !== '' && formData.chiefComplaint.trim() !== ''
      case 1:
        return formData.patientAgeRange !== '' && formData.patientSex !== ''
      default:
        return true
    }
  }

  return (
    <>
      <Header title="Nouveau plan de traitement" />

      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back button */}
          <Button variant="ghost" asChild>
            <Link href="/cases">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux plans
            </Link>
          </Button>

          {/* Progress steps */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                      ${index < currentStep
                        ? 'bg-primary border-primary text-primary-foreground'
                        : index === currentStep
                          ? 'border-primary text-primary'
                          : 'border-muted text-muted-foreground'
                      }
                    `}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${
                    index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`
                    w-16 h-0.5 mx-2
                    ${index < currentStep ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>

          {/* Form content */}
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep].title}</CardTitle>
              <CardDescription>{STEPS[currentStep].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={nextStep} disabled={!canProceed()}>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Créer le plan
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
