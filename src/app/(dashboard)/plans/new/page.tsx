'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Check,
  X,
  Edit2,
  Save,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { TREATMENT_CATEGORIES, getTreatmentById } from '@/lib/constants/treatments'
import type { TreatmentPlanItem, TreatmentCategory } from '@/types/database'

type ParsedItem = TreatmentPlanItem & {
  isEditing?: boolean
}

export default function NewPlanPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  // Form state
  const [title, setTitle] = useState('')
  const [rawInput, setRawInput] = useState('')
  const [notes, setNotes] = useState('')

  // Parsing state
  const [isParsing, setIsParsing] = useState(false)
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [parseConfidence, setParseConfidence] = useState<number | null>(null)
  const [parseNotes, setParseNotes] = useState<string>('')
  const [hasParsed, setHasParsed] = useState(false)

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Derived values
  const dentistryTypes = useMemo(() => {
    return Array.from(new Set(parsedItems.map(item => item.category)))
  }, [parsedItems])

  const teethInvolved = useMemo(() => {
    return Array.from(new Set(parsedItems.flatMap(item => item.teeth)))
  }, [parsedItems])

  const handleParse = async () => {
    if (!rawInput.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer un plan de traitement',
      })
      return
    }

    setIsParsing(true)
    try {
      const response = await fetch('/api/parse-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de parsing')
      }

      setParsedItems(data.items)
      setParseConfidence(data.confidence)
      setParseNotes(data.notes || '')
      setHasParsed(true)

      toast({
        title: 'Analyse terminée',
        description: `${data.items.length} élément(s) identifié(s)`,
      })
    } catch (error) {
      console.error('Parse error:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur d\'analyse',
        description: 'Impossible d\'analyser le plan de traitement',
      })
    } finally {
      setIsParsing(false)
    }
  }

  const updateParsedItem = (index: number, updates: Partial<ParsedItem>) => {
    setParsedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    ))
  }

  const removeParsedItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (parsedItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez d\'abord analyser le plan de traitement',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Vous devez être connecté',
        })
        return
      }

      const { data: dentist } = await supabase
        .from('dentists')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!dentist) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Profil dentiste non trouvé',
        })
        return
      }

      // Create the treatment plan
      const { data: plan, error } = await supabase
        .from('treatment_plans')
        .insert({
          created_by: dentist.id,
          last_modified_by: dentist.id,
          title: title || null,
          raw_input: rawInput,
          treatment_items: parsedItems.map(({ isEditing, ...item }) => item),
          dentistry_types: dentistryTypes,
          teeth_involved: teethInvolved,
          ai_parsed: true,
          ai_parsing_confidence: parseConfidence,
          user_confirmed: true,
          notes: notes || null,
          status: 'draft',
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating plan:', error)
        throw error
      }

      toast({
        title: 'Plan créé',
        description: 'Le plan de traitement a été créé avec succès',
      })

      router.push(`/plans/${plan.id}`)
    } catch (error) {
      console.error('Error:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer le plan',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header title="Nouveau plan de traitement" />

      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back button */}
          <Button variant="ghost" asChild>
            <Link href="/plans">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux plans
            </Link>
          </Button>

          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Entrez votre plan de traitement
              </CardTitle>
              <CardDescription>
                Écrivez le plan en notation clinique. L'IA va l'analyser et le structurer automatiquement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre (optionnel)</Label>
                <Input
                  id="title"
                  placeholder="Ex: Réhabilitation secteur postérieur droit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rawInput">Plan de traitement *</Label>
                <Textarea
                  id="rawInput"
                  placeholder="Ex: 46 démonter CC + prov, 36 impl, SRP Q1-Q2, 11-21 facettes céramiques"
                  rows={4}
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Utilisez la notation clinique standard. Séparez les éléments par des virgules ou des retours à la ligne.
                </p>
              </div>

              <Button
                onClick={handleParse}
                disabled={isParsing || !rawInput.trim()}
                className="w-full"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyser avec l'IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Parsed Results */}
          {hasParsed && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Résultat de l'analyse</CardTitle>
                    <CardDescription>
                      Vérifiez et corrigez si nécessaire avant de confirmer
                    </CardDescription>
                  </div>
                  {parseConfidence !== null && (
                    <Badge variant={parseConfidence > 0.8 ? 'default' : parseConfidence > 0.5 ? 'secondary' : 'destructive'}>
                      Confiance: {Math.round(parseConfidence * 100)}%
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {parseNotes && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p className="text-yellow-800 dark:text-yellow-200">{parseNotes}</p>
                  </div>
                )}

                {/* Parsed items */}
                <div className="space-y-3">
                  {parsedItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      {item.isEditing ? (
                        // Edit mode
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Dents (séparées par virgules)</Label>
                              <Input
                                value={item.teeth.join(', ')}
                                onChange={(e) => updateParsedItem(index, {
                                  teeth: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                                })}
                                placeholder="46, 47"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Catégorie</Label>
                              <Select
                                value={item.category}
                                onValueChange={(v) => updateParsedItem(index, { category: v as TreatmentCategory })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(TREATMENT_CATEGORIES).map(([key, cat]) => (
                                    <SelectItem key={key} value={key}>{cat.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={item.treatment_description}
                              onChange={(e) => updateParsedItem(index, { treatment_description: e.target.value })}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateParsedItem(index, { isEditing: false })}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={TREATMENT_CATEGORIES[item.category]?.color || ''}>
                                {TREATMENT_CATEGORIES[item.category]?.name || item.category}
                              </Badge>
                              {item.teeth.length > 0 && (
                                <span className="text-sm font-medium">
                                  Dent{item.teeth.length > 1 ? 's' : ''}: {item.teeth.join(', ')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm">{item.treatment_description}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              Original: "{item.raw_text}"
                            </p>
                            {item.treatment_type && (
                              <p className="text-xs text-muted-foreground">
                                Type: {getTreatmentById(item.treatment_type)?.name || item.treatment_type}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => updateParsedItem(index, { isEditing: true })}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeParsedItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {parsedItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun élément identifié. Modifiez votre entrée et réessayez.
                  </div>
                )}

                <Separator />

                {/* Summary */}
                {parsedItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-medium">Catégories:</span>
                      {dentistryTypes.map(cat => (
                        <Badge key={cat} variant="outline" className={TREATMENT_CATEGORIES[cat]?.color || ''}>
                          {TREATMENT_CATEGORIES[cat]?.name || cat}
                        </Badge>
                      ))}
                    </div>
                    {teethInvolved.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium">Dents:</span>
                        {teethInvolved.map(tooth => (
                          <Badge key={tooth} variant="secondary">{tooth}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes additionnelles (optionnel)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Notes ou contexte supplémentaire..."
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit button */}
          {hasParsed && parsedItems.length > 0 && (
            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href="/plans">Annuler</Link>
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Confirmer et créer le plan
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
