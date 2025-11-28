'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { UPPER_RIGHT, UPPER_LEFT, LOWER_LEFT, LOWER_RIGHT, getToothFullName, isValidFDI } from '@/lib/constants/teeth'

interface ToothSelectorProps {
  selectedTeeth: string[]
  onSelectionChange: (teeth: string[]) => void
  disabledTeeth?: string[]
  multiSelect?: boolean
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const TOOTH_SIZE = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
}

function ToothButton({
  tooth,
  isSelected,
  isDisabled,
  onClick,
  size,
}: {
  tooth: string
  isSelected: boolean
  isDisabled: boolean
  onClick: () => void
  size: 'sm' | 'md' | 'lg'
}) {
  const fullName = getToothFullName(tooth)

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            disabled={isDisabled}
            className={cn(
              TOOTH_SIZE[size],
              'rounded-md border-2 font-mono transition-all',
              'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isSelected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary/50',
              isDisabled && 'opacity-50 cursor-not-allowed hover:scale-100',
            )}
          >
            {tooth}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="font-medium">
          <p>{fullName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function ToothSelector({
  selectedTeeth,
  onSelectionChange,
  disabledTeeth = [],
  multiSelect = true,
  showLabels = true,
  size = 'md',
  className,
}: ToothSelectorProps) {
  const handleToothClick = useCallback(
    (tooth: string) => {
      if (disabledTeeth.includes(tooth)) return

      if (multiSelect) {
        if (selectedTeeth.includes(tooth)) {
          onSelectionChange(selectedTeeth.filter((t) => t !== tooth))
        } else {
          onSelectionChange([...selectedTeeth, tooth])
        }
      } else {
        if (selectedTeeth.includes(tooth)) {
          onSelectionChange([])
        } else {
          onSelectionChange([tooth])
        }
      }
    },
    [selectedTeeth, onSelectionChange, disabledTeeth, multiSelect]
  )

  const selectQuadrant = (quadrant: readonly string[]) => {
    const quadrantTeeth = [...quadrant].filter((t) => !disabledTeeth.includes(t))
    const allSelected = quadrantTeeth.every((t) => selectedTeeth.includes(t))

    if (allSelected) {
      onSelectionChange(selectedTeeth.filter((t) => !quadrantTeeth.includes(t)))
    } else {
      const newSelection = new Set([...selectedTeeth, ...quadrantTeeth])
      onSelectionChange(Array.from(newSelection))
    }
  }

  const selectAll = () => {
    const allTeeth = [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_LEFT, ...LOWER_RIGHT] as string[]
    const filteredTeeth = allTeeth.filter((t) => !disabledTeeth.includes(t))
    const allSelected = filteredTeeth.every((t) => selectedTeeth.includes(t))

    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(filteredTeeth)
    }
  }

  const selectUpperArch = () => {
    const upperTeeth = [...UPPER_RIGHT, ...UPPER_LEFT] as string[]
    const filteredTeeth = upperTeeth.filter((t) => !disabledTeeth.includes(t))
    const allSelected = filteredTeeth.every((t) => selectedTeeth.includes(t))

    if (allSelected) {
      onSelectionChange(selectedTeeth.filter((t) => !filteredTeeth.includes(t)))
    } else {
      const newSelection = new Set([...selectedTeeth, ...filteredTeeth])
      onSelectionChange(Array.from(newSelection))
    }
  }

  const selectLowerArch = () => {
    const lowerTeeth = [...LOWER_LEFT, ...LOWER_RIGHT] as string[]
    const filteredTeeth = lowerTeeth.filter((t) => !disabledTeeth.includes(t))
    const allSelected = filteredTeeth.every((t) => selectedTeeth.includes(t))

    if (allSelected) {
      onSelectionChange(selectedTeeth.filter((t) => !filteredTeeth.includes(t)))
    } else {
      const newSelection = new Set([...selectedTeeth, ...filteredTeeth])
      onSelectionChange(Array.from(newSelection))
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Quick selection buttons */}
      {multiSelect && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAll}
          >
            Toutes
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectUpperArch}
          >
            Arcade supérieure
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectLowerArch}
          >
            Arcade inférieure
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => selectQuadrant(UPPER_RIGHT)}
          >
            Q1
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => selectQuadrant(UPPER_LEFT)}
          >
            Q2
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => selectQuadrant(LOWER_LEFT)}
          >
            Q3
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => selectQuadrant(LOWER_RIGHT)}
          >
            Q4
          </Button>
          {selectedTeeth.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
            >
              Effacer
            </Button>
          )}
        </div>
      )}

      {/* Dental chart */}
      <div className="inline-block p-4 bg-muted/30 rounded-lg border">
        {/* Upper arch labels */}
        {showLabels && (
          <div className="flex justify-center gap-8 mb-2 text-xs text-muted-foreground font-medium">
            <span>Quadrant 1 (sup. droit)</span>
            <span>Quadrant 2 (sup. gauche)</span>
          </div>
        )}

        {/* Upper arch */}
        <div className="flex justify-center gap-1">
          {/* Upper right (Q1) - right to left: 18-11 */}
          <div className="flex gap-1">
            {UPPER_RIGHT.map((tooth) => (
              <ToothButton
                key={tooth}
                tooth={tooth}
                isSelected={selectedTeeth.includes(tooth)}
                isDisabled={disabledTeeth.includes(tooth)}
                onClick={() => handleToothClick(tooth)}
                size={size}
              />
            ))}
          </div>

          {/* Midline separator */}
          <div className="w-px bg-border mx-2" />

          {/* Upper left (Q2) - left to right: 21-28 */}
          <div className="flex gap-1">
            {UPPER_LEFT.map((tooth) => (
              <ToothButton
                key={tooth}
                tooth={tooth}
                isSelected={selectedTeeth.includes(tooth)}
                isDisabled={disabledTeeth.includes(tooth)}
                onClick={() => handleToothClick(tooth)}
                size={size}
              />
            ))}
          </div>
        </div>

        {/* Midline horizontal */}
        <div className="h-4 flex items-center justify-center my-2">
          <div className="w-full max-w-md h-px bg-border" />
        </div>

        {/* Lower arch */}
        <div className="flex justify-center gap-1">
          {/* Lower left (Q3) - left to right: 31-38 */}
          <div className="flex gap-1">
            {LOWER_LEFT.map((tooth) => (
              <ToothButton
                key={tooth}
                tooth={tooth}
                isSelected={selectedTeeth.includes(tooth)}
                isDisabled={disabledTeeth.includes(tooth)}
                onClick={() => handleToothClick(tooth)}
                size={size}
              />
            ))}
          </div>

          {/* Midline separator */}
          <div className="w-px bg-border mx-2" />

          {/* Lower right (Q4) - right to left: 48-41 */}
          <div className="flex gap-1">
            {LOWER_RIGHT.map((tooth) => (
              <ToothButton
                key={tooth}
                tooth={tooth}
                isSelected={selectedTeeth.includes(tooth)}
                isDisabled={disabledTeeth.includes(tooth)}
                onClick={() => handleToothClick(tooth)}
                size={size}
              />
            ))}
          </div>
        </div>

        {/* Lower arch labels */}
        {showLabels && (
          <div className="flex justify-center gap-8 mt-2 text-xs text-muted-foreground font-medium">
            <span>Quadrant 3 (inf. gauche)</span>
            <span>Quadrant 4 (inf. droit)</span>
          </div>
        )}
      </div>

      {/* Selected teeth display */}
      {selectedTeeth.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{selectedTeeth.length} dent(s) sélectionnée(s): </span>
          <span className="font-mono">
            {selectedTeeth.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}
          </span>
        </div>
      )}
    </div>
  )
}

// Compact version for inline use
export function ToothSelectorCompact({
  selectedTeeth,
  onSelectionChange,
  disabledTeeth = [],
  className,
}: Omit<ToothSelectorProps, 'showLabels' | 'size'>) {
  return (
    <ToothSelector
      selectedTeeth={selectedTeeth}
      onSelectionChange={onSelectionChange}
      disabledTeeth={disabledTeeth}
      showLabels={false}
      size="sm"
      className={className}
    />
  )
}

// Single tooth selector for treatment targeting
export function SingleToothSelector({
  selectedTooth,
  onSelectionChange,
  disabledTeeth = [],
  className,
}: {
  selectedTooth: string | null
  onSelectionChange: (tooth: string | null) => void
  disabledTeeth?: string[]
  className?: string
}) {
  return (
    <ToothSelector
      selectedTeeth={selectedTooth ? [selectedTooth] : []}
      onSelectionChange={(teeth) => onSelectionChange(teeth[0] || null)}
      disabledTeeth={disabledTeeth}
      multiSelect={false}
      showLabels={false}
      size="sm"
      className={className}
    />
  )
}
