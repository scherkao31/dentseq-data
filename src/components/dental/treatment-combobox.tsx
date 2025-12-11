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
import { TREATMENT_CATEGORIES, type TreatmentCategory } from '@/lib/constants/treatments'

interface Treatment {
  id: string
  label: string
  treatmentCategory?: TreatmentCategory
}

interface TreatmentComboboxProps {
  treatments: Treatment[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TreatmentCombobox({
  treatments,
  value,
  onValueChange,
  placeholder = 'Sélectionner un traitement...',
  className,
}: TreatmentComboboxProps) {
  const [open, setOpen] = React.useState(false)

  // Group treatments by category
  const groupedTreatments = React.useMemo(() => {
    const grouped: Record<TreatmentCategory, Treatment[]> = {
      diagnostic: [],
      preventive: [],
      restorative: [],
      endodontic: [],
      periodontal: [],
      surgical: [],
      implant: [],
      prosthetic: [],
      orthodontic: [],
      other: [],
    }

    treatments.forEach(treatment => {
      const category = treatment.treatmentCategory || 'other'
      if (grouped[category]) {
        grouped[category].push(treatment)
      }
    })

    // Remove empty categories
    return Object.fromEntries(
      Object.entries(grouped).filter(([, items]) => items.length > 0)
    ) as Record<TreatmentCategory, Treatment[]>
  }, [treatments])

  const selectedTreatment = treatments.find(t => t.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="truncate">
            {selectedTreatment ? selectedTreatment.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un traitement..." />
          <CommandList>
            <CommandEmpty>Aucun traitement trouvé.</CommandEmpty>
            {Object.entries(groupedTreatments).map(([category, items]) => (
              <CommandGroup
                key={category}
                heading={TREATMENT_CATEGORIES[category as TreatmentCategory]?.name || category}
              >
                {items.map((treatment) => (
                  <CommandItem
                    key={treatment.id}
                    value={treatment.label}
                    onSelect={() => {
                      onValueChange(treatment.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === treatment.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {treatment.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
