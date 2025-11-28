'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  Loader2,
  Send,
  Archive,
  FileEdit,
} from 'lucide-react'

type StatusOption = {
  value: string
  label: string
  description?: string
  color?: string
}

type StatusControlProps = {
  entityType: 'case' | 'sequence'
  entityId: string
  currentStatus: string
  statusOptions: readonly StatusOption[]
  onStatusChange?: (newStatus: string) => void
}

const statusIcons: Record<string, React.ReactNode> = {
  draft: <FileEdit className="h-4 w-4" />,
  pending_review: <Clock className="h-4 w-4" />,
  submitted: <Send className="h-4 w-4" />,
  under_review: <Clock className="h-4 w-4" />,
  approved: <CheckCircle className="h-4 w-4" />,
  needs_revision: <XCircle className="h-4 w-4" />,
  archived: <Archive className="h-4 w-4" />,
}

function getBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'approved':
      return 'default'
    case 'needs_revision':
      return 'destructive'
    case 'archived':
      return 'outline'
    default:
      return 'secondary'
  }
}

export function StatusControl({
  entityType,
  entityId,
  currentStatus,
  statusOptions,
  onStatusChange,
}: StatusControlProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; status: string | null }>({
    open: false,
    status: null,
  })
  const { toast } = useToast()
  const supabase = createClient()

  const currentOption = statusOptions.find((s) => s.value === currentStatus)
  const tableName = entityType === 'case' ? 'clinical_cases' : 'treatment_sequences'

  const handleStatusChange = async (newStatus: string) => {
    // For approval/rejection, show confirmation
    if (newStatus === 'approved' || newStatus === 'needs_revision') {
      setConfirmDialog({ open: true, status: newStatus })
      return
    }

    await updateStatus(newStatus)
  }

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true)

    try {
      const { error } = await supabase
        .from(tableName)
        .update({ status: newStatus })
        .eq('id', entityId)

      if (error) throw error

      toast({
        title: 'Statut mis à jour',
        description: `Le statut a été changé en "${statusOptions.find(s => s.value === newStatus)?.label}"`,
      })

      onStatusChange?.(newStatus)

      // Reload the page to reflect changes
      window.location.reload()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
      })
    } finally {
      setIsUpdating(false)
      setConfirmDialog({ open: false, status: null })
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isUpdating} className="gap-2">
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              statusIcons[currentStatus]
            )}
            <Badge variant={getBadgeVariant(currentStatus)} className="font-normal">
              {currentOption?.label || currentStatus}
            </Badge>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {statusOptions.map((option, index) => (
            <div key={option.value}>
              {index > 0 && option.value === 'archived' && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => handleStatusChange(option.value)}
                disabled={option.value === currentStatus}
                className="flex items-start gap-2 py-2"
              >
                <span className="mt-0.5">{statusIcons[option.value]}</span>
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  )}
                </div>
                {option.value === currentStatus && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, status: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.status === 'approved' ? 'Approuver' : 'Demander une révision'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.status === 'approved'
                ? `Êtes-vous sûr de vouloir approuver ${entityType === 'case' ? 'ce plan de traitement' : 'cette séquence'} ? Cela indique qu'il est validé et prêt.`
                : `Êtes-vous sûr de vouloir demander une révision pour ${entityType === 'case' ? 'ce plan de traitement' : 'cette séquence'} ?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDialog.status && updateStatus(confirmDialog.status)}
              className={confirmDialog.status === 'needs_revision' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmDialog.status === 'approved' ? 'Approuver' : 'Demander révision'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Simple badge display for status (non-interactive)
export function StatusBadge({ status, options }: { status: string; options: readonly StatusOption[] }) {
  const option = options.find((o) => o.value === status)

  return (
    <Badge variant={getBadgeVariant(status)} className="gap-1">
      {statusIcons[status]}
      {option?.label || status}
    </Badge>
  )
}
