'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Plus } from 'lucide-react'
import Link from 'next/link'
import { StatusControl } from '@/components/status/status-control'
import { CASE_STATUS_OPTIONS } from '@/lib/constants'

type CaseHeaderProps = {
  caseId: string
  caseNumber: string
  title: string
  status: string
}

export function CaseHeader({ caseId, caseNumber, title, status }: CaseHeaderProps) {
  return (
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
              {caseNumber}
            </span>
            <StatusControl
              entityType="case"
              entityId={caseId}
              currentStatus={status}
              statusOptions={CASE_STATUS_OPTIONS}
            />
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href={`/cases/${caseId}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/sequences/new?caseId=${caseId}`}>
            <Plus className="h-4 w-4 mr-2" />
            Créer une séquence
          </Link>
        </Button>
      </div>
    </div>
  )
}
