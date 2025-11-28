import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  GitBranch,
  Stethoscope,
  Calendar,
  CheckCircle,
  Target,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { getDatasetStatistics } from '@/lib/supabase/queries'
import { StatCard } from '@/components/stats/stat-card'
import { DistributionBar } from '@/components/stats/distribution-bar'
import { TeethChart } from '@/components/stats/teeth-chart'
import { CoverageAlert } from '@/components/stats/coverage-alert'
import {
  COMPLEXITY_OPTIONS,
  AGE_RANGE_OPTIONS,
  SEX_OPTIONS,
  GENERAL_HEALTH_OPTIONS,
  ORAL_HYGIENE_OPTIONS,
  COMPLIANCE_OPTIONS,
  PERIO_STAGE_OPTIONS,
  PERIO_GRADE_OPTIONS,
  CASE_STATUS_OPTIONS,
  SEQUENCE_STATUS_OPTIONS,
  TREATMENT_GOALS,
} from '@/lib/constants'
import { TREATMENT_CATEGORIES, TREATMENTS } from '@/lib/constants/treatments'

// Helper to convert options array to labels object
function optionsToLabels(options: readonly { value: string; label: string }[]): Record<string, string> {
  return options.reduce((acc, opt) => {
    acc[opt.value] = opt.label
    return acc
  }, {} as Record<string, string>)
}

function goalsToLabels(goals: readonly { id: string; name: string }[]): Record<string, string> {
  return goals.reduce((acc, g) => {
    acc[g.id] = g.name
    return acc
  }, {} as Record<string, string>)
}

function treatmentTypeToLabel(typeId: string): string {
  const treatment = TREATMENTS.find(t => t.id === typeId)
  return treatment?.name || typeId
}

export default async function StatsPage() {
  const stats = await getDatasetStatistics()

  const approvalRate = stats.totals.cases > 0
    ? Math.round((stats.totals.approvedCases / stats.totals.cases) * 100)
    : 0

  const sequenceApprovalRate = stats.totals.sequences > 0
    ? Math.round((stats.totals.approvedSequences / stats.totals.sequences) * 100)
    : 0

  // Transform treatment types for labels
  const treatmentTypeLabels: Record<string, string> = {}
  Object.keys(stats.treatmentDistributions.byType).forEach(typeId => {
    treatmentTypeLabels[typeId] = treatmentTypeToLabel(typeId)
  })

  // Category labels
  const categoryLabels: Record<string, string> = {}
  Object.entries(TREATMENT_CATEGORIES).forEach(([key, value]) => {
    categoryLabels[key] = value.name
  })

  return (
    <>
      <Header title="Statistiques du Dataset" />

      <div className="p-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Plans de traitement"
            value={stats.totals.cases}
            subtitle={`${stats.totals.approvedCases} approuvé(s)`}
            icon={FileText}
          />
          <StatCard
            title="Séquences"
            value={stats.totals.sequences}
            subtitle={`${stats.totals.approvedSequences} approuvée(s)`}
            icon={GitBranch}
          />
          <StatCard
            title="Traitements"
            value={stats.totals.treatments}
            subtitle={`${stats.totals.appointments} séance(s)`}
            icon={Stethoscope}
          />
          <StatCard
            title="Taux d'approbation"
            value={`${approvalRate}%`}
            subtitle={`Plans: ${approvalRate}% | Séq: ${sequenceApprovalRate}%`}
            icon={CheckCircle}
          />
        </div>

        {/* Dataset Quality Alerts */}
        <div className="grid gap-4 md:grid-cols-2">
          <CoverageAlert
            title="Couverture des catégories de traitement"
            covered={stats.coverage.categoriesWithData}
            missing={stats.coverage.categoriesMissing}
            labels={categoryLabels}
            type={stats.coverage.categoriesMissing.length > 2 ? 'warning' : 'success'}
          />
          <CoverageAlert
            title="Couverture dentaire"
            covered={stats.coverage.teethWithData}
            missing={stats.coverage.teethWithoutData}
            type={stats.coverage.teethWithoutData.length > 16 ? 'warning' : 'info'}
          />
        </div>

        {/* Detailed Stats Tabs */}
        <Tabs defaultValue="cases" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="cases">Plans</TabsTrigger>
            <TabsTrigger value="sequences">Séquences</TabsTrigger>
            <TabsTrigger value="treatments">Traitements</TabsTrigger>
            <TabsTrigger value="teeth">Dents</TabsTrigger>
          </TabsList>

          {/* Cases Tab */}
          <TabsContent value="cases" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Complexity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Par complexité
                  </CardTitle>
                  <CardDescription>
                    Distribution des plans selon leur complexité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DistributionBar
                    data={stats.caseDistributions.byComplexity}
                    labels={optionsToLabels(COMPLEXITY_OPTIONS)}
                    orientation="vertical"
                  />
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Par statut
                  </CardTitle>
                  <CardDescription>
                    Progression de la validation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DistributionBar
                    data={stats.caseDistributions.byStatus}
                    labels={optionsToLabels(CASE_STATUS_OPTIONS)}
                    orientation="vertical"
                  />
                </CardContent>
              </Card>

              {/* Age Range */}
              <Card>
                <CardHeader>
                  <CardTitle>Par tranche d'âge</CardTitle>
                  <CardDescription>
                    Distribution démographique
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DistributionBar
                    data={stats.caseDistributions.byAgeRange}
                    labels={optionsToLabels(AGE_RANGE_OPTIONS)}
                    orientation="vertical"
                  />
                </CardContent>
              </Card>

              {/* Sex */}
              <Card>
                <CardHeader>
                  <CardTitle>Par sexe</CardTitle>
                  <CardDescription>
                    Répartition hommes/femmes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DistributionBar
                    data={stats.caseDistributions.bySex}
                    labels={optionsToLabels(SEX_OPTIONS)}
                  />
                </CardContent>
              </Card>

              {/* Oral Hygiene */}
              <Card>
                <CardHeader>
                  <CardTitle>Par hygiène orale</CardTitle>
                </CardHeader>
                <CardContent>
                  <DistributionBar
                    data={stats.caseDistributions.byOralHygiene}
                    labels={optionsToLabels(ORAL_HYGIENE_OPTIONS)}
                    orientation="vertical"
                  />
                </CardContent>
              </Card>

              {/* Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle>Par compliance patient</CardTitle>
                </CardHeader>
                <CardContent>
                  <DistributionBar
                    data={stats.caseDistributions.byCompliance}
                    labels={optionsToLabels(COMPLIANCE_OPTIONS)}
                    orientation="vertical"
                  />
                </CardContent>
              </Card>

              {/* Perio Stage */}
              <Card>
                <CardHeader>
                  <CardTitle>Par stade parodontal</CardTitle>
                  <CardDescription>
                    Classification parodontale 2017
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DistributionBar
                    data={stats.caseDistributions.byPerioStage}
                    labels={optionsToLabels(PERIO_STAGE_OPTIONS)}
                    orientation="vertical"
                  />
                </CardContent>
              </Card>

              {/* Perio Grade */}
              <Card>
                <CardHeader>
                  <CardTitle>Par grade parodontal</CardTitle>
                </CardHeader>
                <CardContent>
                  <DistributionBar
                    data={stats.caseDistributions.byPerioGrade}
                    labels={optionsToLabels(PERIO_GRADE_OPTIONS)}
                    orientation="vertical"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sequences Tab */}
          <TabsContent value="sequences" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Sequence Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Par statut
                  </CardTitle>
                  <CardDescription>
                    Progression de la validation des séquences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DistributionBar
                    data={stats.sequenceDistributions.byStatus}
                    labels={optionsToLabels(SEQUENCE_STATUS_OPTIONS)}
                    orientation="vertical"
                  />
                </CardContent>
              </Card>

              {/* Treatment Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Par objectif de traitement
                  </CardTitle>
                  <CardDescription>
                    Objectifs les plus fréquents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DistributionBar
                    data={stats.sequenceDistributions.byTreatmentGoals}
                    labels={goalsToLabels(TREATMENT_GOALS)}
                    orientation="vertical"
                    maxItems={10}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Treatments Tab */}
          <TabsContent value="treatments" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* By Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Par catégorie
                  </CardTitle>
                  <CardDescription>
                    Distribution des traitements par type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DistributionBar
                    data={stats.treatmentDistributions.byCategory}
                    labels={categoryLabels}
                    orientation="vertical"
                  />
                </CardContent>
              </Card>

              {/* Top Treatments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top 15 traitements
                  </CardTitle>
                  <CardDescription>
                    Traitements les plus fréquents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DistributionBar
                    data={stats.treatmentDistributions.byType}
                    labels={treatmentTypeLabels}
                    orientation="vertical"
                    maxItems={15}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Missing Categories Alert */}
            {stats.coverage.categoriesMissing.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-5 w-5" />
                    Catégories manquantes
                  </CardTitle>
                  <CardDescription className="text-yellow-700">
                    Ces catégories de traitement n'ont pas encore de données
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {stats.coverage.categoriesMissing.map(cat => (
                      <Badge key={cat} variant="outline" className="bg-white">
                        {categoryLabels[cat] || cat}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Teeth Tab */}
          <TabsContent value="teeth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Couverture dentaire</CardTitle>
                <CardDescription>
                  Distribution des traitements par dent (notation FDI)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeethChart
                  data={stats.treatmentDistributions.byTeeth}
                  missingTeeth={stats.coverage.teethWithoutData}
                />
              </CardContent>
            </Card>

            {/* Teeth without data */}
            {stats.coverage.teethWithoutData.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800">
                    Dents sans données ({stats.coverage.teethWithoutData.length}/32)
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Ces dents n'ont pas encore de traitements associés dans le dataset
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {stats.coverage.teethWithoutData.map(tooth => (
                      <Badge key={tooth} variant="outline" className="bg-white font-mono">
                        {tooth}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dataset Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommandations pour améliorer le dataset</CardTitle>
            <CardDescription>
              Suggestions basées sur l'analyse des données actuelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.totals.cases < 10 && (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <span>
                  <strong>Plus de plans nécessaires:</strong> Ajoutez au moins 10 plans de traitement pour avoir une base de données significative.
                </span>
              </div>
            )}
            {stats.coverage.categoriesMissing.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <span>
                  <strong>Catégories manquantes:</strong> Ajoutez des séquences avec des traitements de type{' '}
                  {stats.coverage.categoriesMissing.map(c => categoryLabels[c]).join(', ')}.
                </span>
              </div>
            )}
            {stats.coverage.teethWithoutData.length > 16 && (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <span>
                  <strong>Couverture dentaire faible:</strong> Plus de la moitié des dents n'ont pas de données. Variez les localisations des traitements.
                </span>
              </div>
            )}
            {approvalRate < 50 && stats.totals.cases > 5 && (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <span>
                  <strong>Taux d'approbation bas:</strong> Seulement {approvalRate}% des plans sont approuvés. Passez en revue les plans en attente.
                </span>
              </div>
            )}
            {Object.keys(stats.caseDistributions.byComplexity).length < 3 && stats.totals.cases > 5 && (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <span>
                  <strong>Diversité de complexité:</strong> Ajoutez des cas de complexités variées (simple, modéré, complexe, très complexe).
                </span>
              </div>
            )}
            {stats.totals.cases >= 10 && stats.coverage.categoriesMissing.length === 0 && approvalRate >= 50 && (
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>
                  <strong>Bon début!</strong> Le dataset progresse bien. Continuez à ajouter des cas variés pour améliorer la diversité.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
