'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { StatusControl } from '@/components/status/status-control'
import { SEQUENCE_STATUS_OPTIONS } from '@/lib/constants'

type SequenceHeaderProps = {
  sequenceId: string
  sequenceNumber: string
  title: string
  status: string
  caseId?: string
  caseNumber?: string
  caseTitle?: string
}

export function SequenceHeader({
  sequenceId,
  sequenceNumber,
  title,
  status,
  caseId,
  caseNumber,
  caseTitle,
}: SequenceHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={caseId ? `/cases/${caseId}` : '/sequences'}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
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
          {caseNumber && caseTitle && (
            <p className="text-sm text-muted-foreground">
              Plan:{' '}
              <Link href={`/cases/${caseId}`} className="hover:underline">
                {caseNumber} - {caseTitle}
              </Link>
            </p>
          )}
        </div>
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
