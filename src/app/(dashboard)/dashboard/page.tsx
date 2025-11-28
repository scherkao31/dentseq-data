import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, GitBranch, Star, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getStats, getCaseOverviews, getCasesWithoutSequences } from '@/lib/supabase/queries'

export default async function DashboardPage() {
  // Get all data using query helpers
  const [stats, recentCases, casesNeedingSequences] = await Promise.all([
    getStats(),
    getCaseOverviews({ limit: 5 }),
    getCasesWithoutSequences(3),
  ])

  return (
    <>
      <Header title="Tableau de bord" />

      <div className="p-6 space-y-6">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Bienvenue sur DentSeq</h2>
            <p className="text-muted-foreground">
              Plateforme collaborative de séquences de traitement dentaire
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/cases/new">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau cas
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/sequences/new">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle séquence
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cas cliniques</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cases}</div>
              <p className="text-xs text-muted-foreground">
                cas enregistrés
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Séquences</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sequences}</div>
              <p className="text-xs text-muted-foreground">
                séquences créées
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Évaluations</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.evaluations}</div>
              <p className="text-xs text-muted-foreground">
                évaluations soumises
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent cases */}
          <Card>
            <CardHeader>
              <CardTitle>Cas récents</CardTitle>
              <CardDescription>Les derniers cas cliniques créés</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCases && recentCases.length > 0 ? (
                <div className="space-y-3">
                  {recentCases.map((caseItem) => (
                    <Link
                      key={caseItem.id}
                      href={`/cases/${caseItem.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{caseItem.case_number}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {caseItem.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="secondary">
                          {caseItem.sequence_count} séq.
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun cas pour le moment</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href="/cases/new">Créer votre premier cas</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cases needing sequences */}
          <Card>
            <CardHeader>
              <CardTitle>Cas sans séquence</CardTitle>
              <CardDescription>Ces cas attendent votre contribution</CardDescription>
            </CardHeader>
            <CardContent>
              {casesNeedingSequences && casesNeedingSequences.length > 0 ? (
                <div className="space-y-3">
                  {casesNeedingSequences.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{caseItem.case_number}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {caseItem.title}
                        </p>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/sequences/new?caseId=${caseItem.id}`}>
                          <Plus className="h-4 w-4 mr-1" />
                          Séquencer
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Tous les cas ont au moins une séquence</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
