'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SequenceReadView } from './sequence-read-view'
import { SequenceTimeline } from './sequence-timeline'
import { Eye, Pencil } from 'lucide-react'
import type { TreatmentCategory, OrderConstraint } from '@/types/database'

type Treatment = {
  id: string
  position: number
  treatment_type: string
  treatment_category: TreatmentCategory
  teeth: string[]
  rationale_treatment: string | null
  estimated_duration_minutes: number | null
  order_constraint: OrderConstraint
  order_rationale: string | null
  plan_item_ids: string[]
}

type Appointment = {
  id: string
  position: number
  title: string
  appointment_type: string
  objectives: string[] | null
  delay_value: number | null
  delay_unit: string
  delay_reason: string | null
  delay_rationale_text: string | null
  grouping_rationale: string | null
  estimated_duration_minutes: number | null
  treatments: Treatment[]
}

type PlanItem = {
  id: string
  treatment_description: string
  teeth: string[]
  category: TreatmentCategory
}

type SequenceContentProps = {
  sequenceId: string
  appointments: Appointment[]
  planItems?: PlanItem[]
}

export function SequenceContent({ sequenceId, appointments, planItems }: SequenceContentProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div>
      {/* Section header with mode toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Séances de traitement</h2>
        <Button
          variant={isEditing ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Voir la séquence
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier la séquence
            </>
          )}
        </Button>
      </div>

      {/* Content based on mode */}
      {isEditing ? (
        <SequenceTimeline
          sequenceId={sequenceId}
          appointments={appointments}
          planItems={planItems}
        />
      ) : (
        <SequenceReadView
          appointments={appointments}
          planItems={planItems}
        />
      )}
    </div>
  )
}
