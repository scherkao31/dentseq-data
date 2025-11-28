'use client'

import { cn } from '@/lib/utils'

type DistributionBarProps = {
  data: Record<string, number>
  labels?: Record<string, string>
  colors?: Record<string, string>
  showPercentage?: boolean
  maxItems?: number
  orientation?: 'horizontal' | 'vertical'
}

const defaultColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-teal-500',
]

export function DistributionBar({
  data,
  labels = {},
  colors = {},
  showPercentage = true,
  maxItems,
  orientation = 'horizontal',
}: DistributionBarProps) {
  const entries = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems)

  const total = entries.reduce((sum, [, count]) => sum + count, 0)

  if (total === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Aucune donnée
      </div>
    )
  }

  if (orientation === 'vertical') {
    return (
      <div className="space-y-2">
        {entries.map(([key, count], index) => {
          const percentage = Math.round((count / total) * 100)
          const label = labels[key] || key
          const color = colors[key] || defaultColors[index % defaultColors.length]

          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate" title={label}>{label}</span>
                <span className="text-muted-foreground ml-2 shrink-0">
                  {count} {showPercentage && `(${percentage}%)`}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Horizontal stacked bar
  return (
    <div className="space-y-3">
      <div className="h-6 bg-muted rounded-full overflow-hidden flex">
        {entries.map(([key, count], index) => {
          const percentage = (count / total) * 100
          const color = colors[key] || defaultColors[index % defaultColors.length]

          return (
            <div
              key={key}
              className={cn('h-full transition-all first:rounded-l-full last:rounded-r-full', color)}
              style={{ width: `${percentage}%` }}
              title={`${labels[key] || key}: ${count} (${Math.round(percentage)}%)`}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {entries.map(([key, count], index) => {
          const percentage = Math.round((count / total) * 100)
          const label = labels[key] || key
          const color = colors[key] || defaultColors[index % defaultColors.length]

          return (
            <div key={key} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-3 rounded-sm shrink-0', color)} />
              <span className="truncate" title={label}>
                {label}: {count} {showPercentage && `(${percentage}%)`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
