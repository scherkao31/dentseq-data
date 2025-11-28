import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, FileText, GitBranch, Star } from 'lucide-react'
import Link from 'next/link'
import { COMPLEXITY_OPTIONS, CASE_STATUS_OPTIONS } from '@/lib/constants'
import { getCaseOverviews } from '@/lib/supabase/queries'
import { StatusBadge } from '@/components/status/status-control'

function getComplexityDots(complexity: string | null) {
  const levels: Record<string, number> = {
    simple: 1,
    moderate: 2,
    complex: 3,
    highly_complex: 4,
  }
  const level = complexity ? levels[complexity] || 0 : 0
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${
            i <= level ? 'bg-primary' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  )
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; complexity?: string; search?: string }>
}) {
  const params = await searchParams

  const cases = await getCaseOverviews({
    status: params.status,
    complexity: params.complexity,
  })

  return (
    <>
      <Header title="Plans de traitement" />

      <div className="p-6 space-y-6">
        {/* Actions bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un plan..."
                className="pl-9"
                defaultValue={params.search}
              />
            </div>
            <Select defaultValue={params.status || 'all'}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {CASE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue={params.complexity || 'all'}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Complexité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {COMPLEXITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button asChild>
            <Link href="/cases/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau plan
            </Link>
          </Button>
        </div>

        {/* Cases list */}
        {cases.length > 0 ? (
          <div className="grid gap-4">
            {cases.map((caseItem) => (
              <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-muted-foreground">
                            {caseItem.case_number}
                          </span>
                          <StatusBadge
                            status={caseItem.status || 'draft'}
                            options={CASE_STATUS_OPTIONS}
                          />
                        </div>
                        <h3 className="font-semibold truncate">{caseItem.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Créé par {caseItem.created_by_name || 'Inconnu'}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <GitBranch className="h-4 w-4" />
                            <span className="font-medium">{caseItem.sequence_count || 0}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">séquences</span>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Star className="h-4 w-4" />
                            <span className="font-medium">
                              {caseItem.avg_score ? Number(caseItem.avg_score).toFixed(1) : '-'}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">score</span>
                        </div>

                        <div className="text-center hidden md:block">
                          {getComplexityDots(caseItem.complexity)}
                          <span className="text-xs text-muted-foreground">complexité</span>
                        </div>
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
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-1">Aucun plan trouvé</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par créer votre premier plan de traitement
              </p>
              <Button asChild>
                <Link href="/cases/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un plan
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
