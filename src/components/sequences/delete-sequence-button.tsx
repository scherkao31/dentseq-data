'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Loader2 } from 'lucide-react'

type DeleteSequenceButtonProps = {
  sequenceId: string
  sequenceNumber?: string
  onDeleted?: () => void
  redirectTo?: string
  variant?: 'default' | 'ghost' | 'outline' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

export function DeleteSequenceButton({
  sequenceId,
  sequenceNumber,
  onDeleted,
  redirectTo,
  variant = 'ghost',
  size = 'sm',
  showLabel = true,
}: DeleteSequenceButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const supabase = createClient()

      // First, get all appointment groups for this sequence
      const { data: appointments } = await supabase
        .from('appointment_groups')
        .select('id')
        .eq('sequence_id', sequenceId)

      // Delete treatments for each appointment
      if (appointments && appointments.length > 0) {
        const appointmentIds = appointments.map(a => a.id)
        await supabase
          .from('treatments')
          .delete()
          .in('appointment_group_id', appointmentIds)
      }

      // Delete appointment groups
      await supabase
        .from('appointment_groups')
        .delete()
        .eq('sequence_id', sequenceId)

      // Delete sequence evaluations
      await supabase
        .from('sequence_evaluations')
        .delete()
        .eq('sequence_id', sequenceId)

      // Delete the sequence
      const { error } = await supabase
        .from('treatment_sequences')
        .delete()
        .eq('id', sequenceId)

      if (error) throw error

      toast({
        title: 'Séquence supprimée',
        description: sequenceNumber
          ? `La séquence ${sequenceNumber} a été supprimée`
          : 'La séquence a été supprimée',
      })

      setIsOpen(false)

      if (onDeleted) {
        onDeleted()
      }

      if (redirectTo) {
        router.push(redirectTo)
      }
    } catch (error) {
      console.error('Error deleting sequence:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer la séquence',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="text-destructive hover:text-destructive"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(true)
          }}
        >
          <Trash2 className={`h-4 w-4 ${showLabel ? 'mr-2' : ''}`} />
          {showLabel && 'Supprimer'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette séquence ?</AlertDialogTitle>
          <AlertDialogDescription>
            {sequenceNumber ? (
              <>
                Êtes-vous sûr de vouloir supprimer la séquence <strong>{sequenceNumber}</strong> ?
              </>
            ) : (
              'Êtes-vous sûr de vouloir supprimer cette séquence ?'
            )}
            <br />
            <br />
            Cette action est irréversible. Toutes les séances et traitements associés seront également supprimés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
