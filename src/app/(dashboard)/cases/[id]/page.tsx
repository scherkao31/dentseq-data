import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Edit,
  Plus,
  GitBranch,
  Star,
  Clock,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import {
  AGE_RANGE_OPTIONS,
  SEX_OPTIONS,
  GENERAL_HEALTH_OPTIONS,
  COMPLEXITY_OPTIONS,
  ORAL_HYGIENE_OPTIONS,
  COMPLIANCE_OPTIONS,
  PERIO_STAGE_OPTIONS,
  PERIO_GRADE_OPTIONS,
} from '@/lib/constants'
import { getCaseById, getSequenceOverviewsByCaseId, getDentistById } from '@/lib/supabase/queries'

function getLabel(options: readonly { value: string; label: string }[], value: string | null) {
  if (!value) return '-'
  const option = options.find((o) => o.value === value)
  return option?.label || value
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Get case details
  const caseData = await getCaseById(id)

  if (!caseData) {
    notFound()
  }

  // Get creator name
  let creatorName = 'Inconnu'
  if (caseData.created_by) {
    const creator = await getDentistById(caseData.created_by)
    if (creator) creatorName = creator.full_name
  }

  // Get sequences for this case
  const sequences = await getSequenceOverviewsByCaseId(id)

  const medicalHistory = caseData.medical_history as {
    conditions?: string[]
    medications?: string[]
    allergies?: string[]
    notes?: string
  } | null

  return (
    <>
      <Header />

      <div className="p-6 space-y-6">
        {/* Back button and title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/cases">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">
                  {caseData.case_number}
                </span>
                <Badge variant={caseData.status === 'published' ? 'default' : 'secondary'}>
                  {caseData.status === 'published' ? 'Publié' : 'Brouillon'}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold">{caseData.title}</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/cases/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/sequences/new?caseId=${id}`}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une séquence
              </Link>
            </Button>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Créé par {creatorName}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDate(caseData.created_at)}
          </div>
          <div className="flex items-center gap-1">
            <GitBranch className="h-4 w-4" />
            {sequences.length} séquence(s)
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Détails du cas</TabsTrigger>
            <TabsTrigger value="sequences">
              Séquences ({sequences.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Chief complaint */}
            <Card>
              <CardHeader>
                <CardTitle>Motif de consultation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{caseData.chief_complaint}</p>
                {caseData.chief_complaint_symptoms && caseData.chief_complaint_symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {caseData.chief_complaint_symptoms.map((symptom: string) => (
                      <Badge key={symptom} variant="outline">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Patient info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations patient</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Âge</p>
                      <p className="font-medium">
                        {getLabel(AGE_RANGE_OPTIONS, caseData.patient_age_range)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sexe</p>
                      <p className="font-medium">
                        {getLabel(SEX_OPTIONS, caseData.patient_sex)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">État général</p>
                      <p className="font-medium">
                        {getLabel(GENERAL_HEALTH_OPTIONS, caseData.patient_general_health)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Complexité</p>
                      <p className="font-medium">
                        {getLabel(COMPLEXITY_OPTIONS, caseData.complexity)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical history */}
              <Card>
                <CardHeader>
                  <CardTitle>Antécédents médicaux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {medicalHistory?.conditions && medicalHistory.conditions.length > 0 ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Conditions</p>
                      <div className="flex flex-wrap gap-2">
                        {medicalHistory.conditions.map((condition: string) => (
                          <Badge key={condition} variant="outline">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun antécédent renseigné</p>
                  )}
                  {medicalHistory?.allergies && medicalHistory.allergies.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Allergies</p>
                      <div className="flex flex-wrap gap-2">
                        {medicalHistory.allergies.map((allergy: string) => (
                          <Badge key={allergy} variant="destructive">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Patient factors */}
              <Card>
                <CardHeader>
                  <CardTitle>Facteurs patient</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Hygiène orale</p>
                      <p className="font-medium">
                        {getLabel(ORAL_HYGIENE_OPTIONS, caseData.patient_oral_hygiene)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Compliance</p>
                      <p className="font-medium">
                        {getLabel(COMPLIANCE_OPTIONS, caseData.patient_compliance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Periodontal status */}
              <Card>
                <CardHeader>
                  <CardTitle>État parodontal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Stade</p>
                      <p className="font-medium">
                        {getLabel(PERIO_STAGE_OPTIONS, caseData.perio_stage)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Grade</p>
                      <p className="font-medium">
                        {getLabel(PERIO_GRADE_OPTIONS, caseData.perio_grade)}
                      </p>
                    </div>
                  </div>
                  {caseData.perio_diagnosis && (
                    <div>
                      <p className="text-sm text-muted-foreground">Diagnostic</p>
                      <p className="font-medium">{caseData.perio_diagnosis}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Missing teeth */}
            {caseData.missing_teeth && caseData.missing_teeth.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Dents absentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {caseData.missing_teeth.map((tooth: string) => (
                      <Badge key={tooth} variant="secondary">
                        {tooth}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional notes */}
            {caseData.additional_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes additionnelles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{caseData.additional_notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sequences" className="space-y-4">
            {sequences.length > 0 ? (
              <div className="grid gap-4">
                {sequences.map((sequence) => (
                  <Link key={sequence.id} href={`/sequences/${sequence.id}`}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-muted-foreground">
                                {sequence.sequence_number}
                              </span>
                              <Badge variant="secondary">
                                {sequence.status === 'draft' ? 'Brouillon' : sequence.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold">
                              {sequence.title || 'Séquence sans titre'}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Par {sequence.created_by_name || 'Inconnu'} •{' '}
                              {sequence.appointment_count || 0} séances •{' '}
                              {sequence.treatment_count || 0} traitements
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">
                              {sequence.avg_score
                                ? Number(sequence.avg_score).toFixed(1)
                                : '-'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold mb-1">Aucune séquence</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Soyez le premier à créer une séquence pour ce cas
                  </p>
                  <Button asChild>
                    <Link href={`/sequences/new?caseId=${id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une séquence
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
