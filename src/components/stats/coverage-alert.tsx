import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type CoverageAlertProps = {
  title: string
  covered: string[]
  missing: string[]
  labels?: Record<string, string>
  type?: 'warning' | 'info' | 'success'
}

export function CoverageAlert({
  title,
  covered,
  missing,
  labels = {},
  type = 'info',
}: CoverageAlertProps) {
  const coveragePercent = Math.round(
    (covered.length / (covered.length + missing.length)) * 100
  )

  const Icon = type === 'warning' ? AlertTriangle : type === 'success' ? CheckCircle : Info
  const borderColor = type === 'warning' ? 'border-yellow-500' : type === 'success' ? 'border-green-500' : 'border-blue-500'
  const bgColor = type === 'warning' ? 'bg-yellow-50' : type === 'success' ? 'bg-green-50' : 'bg-blue-50'
  const iconColor = type === 'warning' ? 'text-yellow-500' : type === 'success' ? 'text-green-500' : 'text-blue-500'

  return (
    <div className={cn('rounded-lg border-l-4 p-4', borderColor, bgColor)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', iconColor)} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Couverture: {coveragePercent}% ({covered.length}/{covered.length + missing.length})
          </p>

          {missing.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Non couvert ({missing.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white border"
                  >
                    {labels[item] || item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
