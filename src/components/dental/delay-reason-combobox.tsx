'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DelayReason {
  id: string
  label: string
  typicalWeeks?: number
}

interface DelayReasonComboboxProps {
  reasons: DelayReason[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DelayReasonCombobox({
  reasons,
  value,
  onValueChange,
  placeholder = 'Raison du délai...',
  className,
}: DelayReasonComboboxProps) {
  const [open, setOpen] = React.useState(false)

  // Add custom option to the list
  const allReasons = React.useMemo(() => [
    ...reasons,
    { id: 'custom', label: 'Autre (personnalisé)', typicalWeeks: undefined }
  ], [reasons])

  const selectedReason = allReasons.find(r => r.label === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal h-8 text-sm', className)}
        >
          <span className="truncate">
            {selectedReason ? (
              <span className="flex items-center gap-2">
                <span>{selectedReason.label}</span>
                {selectedReason.typicalWeeks && (
                  <span className="text-xs text-muted-foreground">
                    (~{selectedReason.typicalWeeks} sem.)
                  </span>
                )}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher une raison..." />
          <CommandList>
            <CommandEmpty>Aucune raison trouvée.</CommandEmpty>
            <CommandGroup>
              {allReasons.map((reason) => (
                <CommandItem
                  key={reason.id}
                  value={reason.label}
                  onSelect={() => {
                    onValueChange(reason.label)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === reason.label ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="flex-1">{reason.label}</span>
                  {reason.typicalWeeks && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ~{reason.typicalWeeks} sem.
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
