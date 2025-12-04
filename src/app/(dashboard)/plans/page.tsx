'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  Search,
  FileText,
  GitBranch,
  Calendar,
  Sparkles,
  Check,
  Clock,
} from 'lucide-react'
import { TREATMENT_CATEGORIES, type TreatmentCategory } from '@/lib/constants/treatments'
import type { TreatmentPlan, PlanStatus } from '@/types/database'

const PLAN_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'active', label: 'Actif' },
  { value: 'completed', label: 'Terminé' },
  { value: 'archived', label: 'Archivé' },
]

const STATUS_BADGE_PROPS: Record<PlanStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof Clock }> = {
  draft: { variant: 'secondary', icon: Clock },
  active: { variant: 'default', icon: Sparkles },
  completed: { variant: 'outline', icon: Check },
  archived: { variant: 'outline', icon: FileText },
}

type PlanWithSequenceCount = TreatmentPlan & {
  sequence_count?: number
}

export default function PlansPage() {
  const supabase = useMemo(() => createClient(), [])
  const [plans, setPlans] = useState<PlanWithSequenceCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    async function loadPlans() {
      setIsLoading(true)

      // First get all plans
      const { data: plansData, error } = await supabase
        .from('treatment_plans')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading plans:', error)
        setIsLoading(false)
        return
      }

      // Then get sequence counts for each plan
      const { data: sequenceCounts } = await supabase
        .from('treatment_sequences')
        .select('plan_id')
        .not('plan_id', 'is', null)

      // Compute counts
      const countMap: Record<string, number> = {}
      sequenceCounts?.forEach(seq => {
        if (seq.plan_id) {
          countMap[seq.plan_id] = (countMap[seq.plan_id] || 0) + 1
        }
      })

      const plansWithCounts = (plansData || []).map(plan => ({
        ...plan,
        sequence_count: countMap[plan.id] || 0,
      })) as PlanWithSequenceCount[]

      setPlans(plansWithCounts)
      setIsLoading(false)
    }

    loadPlans()
  }, [supabase])

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesTitle = plan.title?.toLowerCase().includes(search)
        const matchesRaw = plan.raw_input.toLowerCase().includes(search)
        const matchesNumber = plan.plan_number?.toLowerCase().includes(search)
        if (!matchesTitle && !matchesRaw && !matchesNumber) return false
      }

      // Status filter
      if (statusFilter !== 'all' && plan.status !== statusFilter) return false

      // Category filter
      if (categoryFilter !== 'all') {
        if (!plan.dentistry_types?.includes(categoryFilter as TreatmentCategory)) return false
      }

      return true
    })
  }, [plans, searchTerm, statusFilter, categoryFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <>
      <Header title="Plans de traitement" />

      <div className="p-6 space-y-6">
        {/* Header with create button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Plans de traitement</h2>
            <p className="text-muted-foreground">
              {plans.length} plan{plans.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <Button asChild>
            <Link href="/plans/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau plan
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un plan..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {Object.entries(TREATMENT_CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Plans list */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">
                {plans.length === 0 ? 'Aucun plan de traitement' : 'Aucun résultat'}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                {plans.length === 0
                  ? 'Créez votre premier plan de traitement pour commencer à collecter des données.'
                  : 'Modifiez vos filtres pour afficher plus de résultats.'}
              </p>
              {plans.length === 0 && (
                <Button asChild>
                  <Link href="/plans/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un plan
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map(plan => {
              const statusProps = STATUS_BADGE_PROPS[plan.status]
              const StatusIcon = statusProps.icon

              return (
                <Link key={plan.id} href={`/plans/${plan.id}`}>
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="shrink-0">
                              {plan.plan_number}
                            </Badge>
                            <Badge variant={statusProps.variant} className="shrink-0">
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {PLAN_STATUS_OPTIONS.find(o => o.value === plan.status)?.label || plan.status}
                            </Badge>
                          </div>
                          <CardTitle className="text-base truncate">
                            {plan.title || plan.raw_input.slice(0, 50)}
                          </CardTitle>
                        </div>
                      </div>
                      {plan.title && (
                        <CardDescription className="line-clamp-2 font-mono text-xs">
                          {plan.raw_input}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Categories */}
                      {plan.dentistry_types && plan.dentistry_types.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {plan.dentistry_types.slice(0, 3).map(type => (
                            <Badge
                              key={type}
                              variant="secondary"
                              className={`text-xs ${TREATMENT_CATEGORIES[type]?.color || ''}`}
                            >
                              {TREATMENT_CATEGORIES[type]?.name || type}
                            </Badge>
                          ))}
                          {plan.dentistry_types.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{plan.dentistry_types.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Teeth */}
                      {plan.teeth_involved && plan.teeth_involved.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium">Dents:</span>
                          <span className="truncate">
                            {plan.teeth_involved.slice(0, 5).join(', ')}
                            {plan.teeth_involved.length > 5 && ` +${plan.teeth_involved.length - 5}`}
                          </span>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(plan.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          {plan.sequence_count || 0} séquence{(plan.sequence_count || 0) > 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* AI badge */}
                      {plan.user_confirmed && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Check className="h-3 w-3" />
                          Confirmé
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
