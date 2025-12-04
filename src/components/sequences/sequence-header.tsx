'use client'

import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import Link from 'next/link'
import { StatusControl } from '@/components/status/status-control'
import { SEQUENCE_STATUS_OPTIONS } from '@/lib/constants'

type SequenceHeaderProps = {
  sequenceId: string
  sequenceNumber: string
  title: string
  status: string
  // New plan-based props
  planId?: string
  planNumber?: string
  planTitle?: string
  // Deprecated case props (kept for backward compat)
  caseId?: string
  caseNumber?: string
  caseTitle?: string
}

export function SequenceHeader({
  sequenceId,
  sequenceNumber,
  title,
  status,
  planId,
  planNumber,
  planTitle,
  // Deprecated
  caseId,
  caseNumber,
  caseTitle,
}: SequenceHeaderProps) {
  // Use plan props if available, fallback to case props
  const parentId = planId || caseId
  const parentNumber = planNumber || caseNumber
  const parentTitle = planTitle || caseTitle
  const parentRoute = planId ? 'plans' : 'cases'

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm text-muted-foreground">
            {sequenceNumber}
          </span>
          <StatusControl
            entityType="sequence"
            entityId={sequenceId}
            currentStatus={status}
            statusOptions={SEQUENCE_STATUS_OPTIONS}
          />
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {parentNumber && parentTitle && (
          <p className="text-sm text-muted-foreground">
            Plan:{' '}
            <Link href={`/${parentRoute}/${parentId}`} className="hover:underline">
              {parentNumber} - {parentTitle}
            </Link>
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href={`/sequences/${sequenceId}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Link>
        </Button>
      </div>
    </div>
  )
}
