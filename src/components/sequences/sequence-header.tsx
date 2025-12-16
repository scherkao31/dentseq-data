'use client'

import Link from 'next/link'
import { StatusControl } from '@/components/status/status-control'
import { DeleteSequenceButton } from '@/components/sequences/delete-sequence-button'
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

  // Redirect to plan page if available, otherwise to sequences list
  const redirectAfterDelete = parentId ? `/${parentRoute}/${parentId}` : '/sequences'

  return (
    <div className="flex items-start justify-between gap-4">
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
      <DeleteSequenceButton
        sequenceId={sequenceId}
        sequenceNumber={sequenceNumber}
        redirectTo={redirectAfterDelete}
        variant="outline"
        showLabel={true}
      />
    </div>
  )
}
