import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, GitBranch, Star, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { SEQUENCE_STATUS_OPTIONS } from '@/lib/constants'
import { getSequenceOverviews } from '@/lib/supabase/queries'
import { formatDate } from '@/lib/utils'

function getStatusBadgeVariant(status: string | null) {
  switch (status) {
    case 'approved':
      return 'success' as const
    case 'submitted':
    case 'under_review':
      return 'default' as const
    case 'needs_revision':
      return 'destructive' as const
    case 'draft':
    default:
      return 'secondary' as const
  }
}

function getStatusLabel(status: string | null) {
  if (!status) return '-'
  const option = SEQUENCE_STATUS_OPTIONS.find((o) => o.value === status)
  return option?.label || status
}

export default async function SequencesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams

  const sequences = await getSequenceOverviews({
    status: params.status,
  })

  return (
    <>
      <Header title="Séquences de traitement" />

      <div className="p-6 space-y-6">
        {/* Actions bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher une séquence..."
                className="pl-9"
                defaultValue={params.search}
              />
            </div>
            <Select defaultValue={params.status || 'all'}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {SEQUENCE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button asChild>
            <Link href="/sequences/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle séquence
            </Link>
          </Button>
        </div>

        {/* Sequences list */}
        {sequences.length > 0 ? (
          <div className="grid gap-4">
            {sequences.map((sequence) => (
              <Link key={sequence.id} href={`/sequences/${sequence.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-muted-foreground">
                            {sequence.sequence_number}
                          </span>
                          <Badge variant={getStatusBadgeVariant(sequence.status)}>
                            {getStatusLabel(sequence.status)}
                          </Badge>
                        </div>
                        <h3 className="font-semibold truncate">
                          {sequence.title || 'Séquence sans titre'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Plan: {sequence.case_number} • {sequence.case_title}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {sequence.created_by_name || 'Inconnu'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {sequence.created_at ? formatDate(sequence.created_at) : '-'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <GitBranch className="h-4 w-4" />
                            <span className="font-medium">{sequence.appointment_count || 0}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">séances</span>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="font-medium">{sequence.treatment_count || 0}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">traitements</span>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="h-4 w-4" />
                            <span className="font-medium">
                              {sequence.avg_score ? Number(sequence.avg_score).toFixed(1) : '-'}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">score</span>
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
              <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-1">Aucune séquence trouvée</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par créer une séquence de traitement
              </p>
              <Button asChild>
                <Link href="/sequences/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une séquence
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
