'use client'

import { cn } from '@/lib/utils'

type TeethChartProps = {
  data: Record<string, number>
  missingTeeth?: string[]
}

// FDI tooth notation layout
const UPPER_TEETH = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28',
]

const LOWER_TEETH = [
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38',
]

function getToothColor(count: number, maxCount: number): string {
  if (count === 0) return 'bg-muted'
  const intensity = Math.min(count / Math.max(maxCount, 1), 1)
  if (intensity < 0.25) return 'bg-blue-200'
  if (intensity < 0.5) return 'bg-blue-300'
  if (intensity < 0.75) return 'bg-blue-400'
  return 'bg-blue-500'
}

export function TeethChart({ data, missingTeeth = [] }: TeethChartProps) {
  const maxCount = Math.max(...Object.values(data), 1)
  const totalTreatments = Object.values(data).reduce((sum, c) => sum + c, 0)

  const renderTooth = (tooth: string) => {
    const count = data[tooth] || 0
    const isMissing = missingTeeth.includes(tooth)

    return (
      <div
        key={tooth}
        className={cn(
          'w-7 h-9 rounded-sm flex items-center justify-center text-xs font-medium transition-colors cursor-default',
          isMissing
            ? 'bg-red-100 text-red-600 border border-red-200'
            : getToothColor(count, maxCount),
          count > 0 && !isMissing && 'text-white'
        )}
        title={`Dent ${tooth}: ${count} traitement(s)`}
      >
        {tooth}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upper arch */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 text-center">Maxillaire</p>
        <div className="flex justify-center gap-0.5">
          {UPPER_TEETH.map(renderTooth)}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed" />

      {/* Lower arch */}
      <div>
        <div className="flex justify-center gap-0.5">
          {LOWER_TEETH.map(renderTooth)}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">Mandibule</p>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-muted" />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-200" />
          <span>1-2</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-300" />
          <span>3-4</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span>5+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
          <span>Sans données</span>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {totalTreatments} traitement(s) sur {Object.keys(data).length} dent(s) différente(s)
      </p>
    </div>
  )
}
