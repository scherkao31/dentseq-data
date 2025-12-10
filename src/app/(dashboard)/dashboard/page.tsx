import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, GitBranch, Star, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { TreatmentPlan } from '@/types/database'

type PlanWithSequenceCount = TreatmentPlan & { sequence_count: number }

async function getPlansWithSequenceCounts(limit: number): Promise<PlanWithSequenceCount[]> {
  const supabase = await createClient()

  // Get recent plans
  const { data: plans, error } = await supabase
    .from('treatment_plans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !plans) return []

  // Get sequence counts
  const planIds = plans.map(p => p.id)
  const { data: sequences } = await supabase
    .from('treatment_sequences')
    .select('plan_id')
    .in('plan_id', planIds)

  const countMap: Record<string, number> = {}
  sequences?.forEach(seq => {
    if (seq.plan_id) {
      countMap[seq.plan_id] = (countMap[seq.plan_id] || 0) + 1
    }
  })

  return plans.map(plan => ({
    ...plan,
    sequence_count: countMap[plan.id] || 0,
  })) as PlanWithSequenceCount[]
}

async function getPlansWithoutSequences(limit: number): Promise<PlanWithSequenceCount[]> {
  const supabase = await createClient()

  // Get all plans with status active or draft
  const { data: plans, error } = await supabase
    .from('treatment_plans')
    .select('*')
    .in('status', ['active', 'draft'])
    .order('created_at', { ascending: false })

  if (error || !plans) return []

  // Get all sequences with plan_id
  const planIds = plans.map(p => p.id)
  const { data: sequences } = await supabase
    .from('treatment_sequences')
    .select('plan_id')
    .in('plan_id', planIds)

  const plansWithSequences = new Set(sequences?.map(s => s.plan_id) || [])

  return plans
    .filter(plan => !plansWithSequences.has(plan.id))
    .slice(0, limit)
    .map(plan => ({ ...plan, sequence_count: 0 })) as PlanWithSequenceCount[]
}

async function getStats() {
  const supabase = await createClient()

  const [plansResult, sequencesResult, evaluationsResult] = await Promise.all([
    supabase.from('treatment_plans').select('id', { count: 'exact', head: true }),
    supabase.from('treatment_sequences').select('id', { count: 'exact', head: true }),
    supabase.from('sequence_evaluations').select('id', { count: 'exact', head: true }),
  ])

  return {
    plans: plansResult.count || 0,
    sequences: sequencesResult.count || 0,
    evaluations: evaluationsResult.count || 0,
  }
}

export default async function DashboardPage() {
  const [stats, recentPlans, plansNeedingSequences] = await Promise.all([
    getStats(),
    getPlansWithSequenceCounts(5),
    getPlansWithoutSequences(3),
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
          <Button asChild>
            <Link href="/plans/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau plan
            </Link>
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plans de traitement</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.plans}</div>
              <p className="text-xs text-muted-foreground">
                plans enregistrés
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
          {/* Recent plans */}
          <Card>
            <CardHeader>
              <CardTitle>Plans récents</CardTitle>
              <CardDescription>Les derniers plans de traitement créés</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPlans && recentPlans.length > 0 ? (
                <div className="space-y-3">
                  {recentPlans.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/plans/${plan.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{plan.plan_number}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {plan.title || plan.raw_input.slice(0, 50)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="secondary">
                          {plan.sequence_count} séq.
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun plan pour le moment</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href="/plans/new">Créer votre premier plan</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plans needing sequences */}
          <Card>
            <CardHeader>
              <CardTitle>Plans sans séquence</CardTitle>
              <CardDescription>Ces plans attendent votre contribution</CardDescription>
            </CardHeader>
            <CardContent>
              {plansNeedingSequences && plansNeedingSequences.length > 0 ? (
                <div className="space-y-3">
                  {plansNeedingSequences.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{plan.plan_number}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {plan.title || plan.raw_input.slice(0, 50)}
                        </p>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/sequences/new?planId=${plan.id}`}>
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
                  <p>Tous les plans ont au moins une séquence</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
