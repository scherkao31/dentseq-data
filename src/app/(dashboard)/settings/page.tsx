'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Save,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Check,
  Plus,
  Trash2,
  ListChecks,
  Target,
  Heart,
  Calendar,
  Clock,
  Stethoscope,
  AlertTriangle,
  GripVertical,
} from 'lucide-react'
import { DEFAULT_AI_SETTINGS } from '@/lib/constants/ai-defaults'
import { getDefaultFormOptions } from '@/lib/constants/form-options-defaults'
import { TREATMENT_CATEGORIES } from '@/lib/constants/treatments'
import type { AISettingConfig, FormOptionsConfig, FormOptionItem, FormOptionCategory, TreatmentCategory } from '@/types/database'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// Category metadata for display
const CATEGORY_META: Record<FormOptionCategory, {
  label: string
  description: string
  icon: typeof Target
  color: string
}> = {
  treatment_goals: {
    label: 'Objectifs de traitement',
    description: 'Les objectifs thérapeutiques que vous pouvez sélectionner lors de la création d\'une séquence',
    icon: Target,
    color: 'text-blue-600',
  },
  patient_priorities: {
    label: 'Priorités du patient',
    description: 'Ce qui compte le plus pour le patient (fonction, esthétique, coût, etc.)',
    icon: Heart,
    color: 'text-pink-600',
  },
  treatments: {
    label: 'Traitements',
    description: 'Taxonomie des traitements disponibles dans les séquences (activer/désactiver ou ajouter des traitements personnalisés)',
    icon: Stethoscope,
    color: 'text-green-600',
  },
  appointment_types: {
    label: 'Types de séances',
    description: 'Les types de rendez-vous disponibles (urgence, diagnostic, traitement, etc.)',
    icon: Calendar,
    color: 'text-purple-600',
  },
  delay_reasons: {
    label: 'Raisons de délai',
    description: 'Les raisons justifiant un délai entre deux séances',
    icon: Clock,
    color: 'text-orange-600',
  },
  medical_conditions: {
    label: 'Conditions médicales',
    description: 'Liste des conditions médicales à documenter',
    icon: Stethoscope,
    color: 'text-red-600',
  },
  allergies: {
    label: 'Allergies',
    description: 'Liste des allergies courantes',
    icon: AlertTriangle,
    color: 'text-yellow-600',
  },
}

export default function SettingsPage() {
  // AI Settings state
  const [aiConfig, setAiConfig] = useState<AISettingConfig>({
    abbreviations: '',
    custom_treatments: '',
    custom_instructions: '',
  })
  const [originalAiConfig, setOriginalAiConfig] = useState<AISettingConfig | null>(null)

  // Form Options state
  const [formOptions, setFormOptions] = useState<FormOptionsConfig | null>(null)
  const [originalFormOptions, setOriginalFormOptions] = useState<FormOptionsConfig | null>(null)

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('ai')

  // Dialog state for adding new items
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogCategory, setAddDialogCategory] = useState<FormOptionCategory | null>(null)
  const [newItemLabel, setNewItemLabel] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [newItemWeeks, setNewItemWeeks] = useState('')
  // Treatment-specific fields
  const [newItemTreatmentCategory, setNewItemTreatmentCategory] = useState<TreatmentCategory>('other')
  const [newItemDuration, setNewItemDuration] = useState('')
  const [newItemRequiresLab, setNewItemRequiresLab] = useState(false)

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const [aiRes, formRes] = await Promise.all([
          fetch('/api/ai-settings?key=plan_parser'),
          fetch('/api/form-options'),
        ])

        if (aiRes.ok) {
          const aiData = await aiRes.json()
          setAiConfig(aiData.config)
          setOriginalAiConfig(aiData.config)
        } else {
          const defaults = DEFAULT_AI_SETTINGS.plan_parser
          setAiConfig(defaults)
          setOriginalAiConfig(defaults)
        }

        if (formRes.ok) {
          const formData = await formRes.json()
          setFormOptions(formData.config)
          setOriginalFormOptions(formData.config)
        } else {
          const defaults = getDefaultFormOptions()
          setFormOptions(defaults)
          setOriginalFormOptions(defaults)
        }
      } catch (err) {
        console.error('Error loading settings:', err)
        setAiConfig(DEFAULT_AI_SETTINGS.plan_parser)
        setOriginalAiConfig(DEFAULT_AI_SETTINGS.plan_parser)
        setFormOptions(getDefaultFormOptions())
        setOriginalFormOptions(getDefaultFormOptions())
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Check for changes
  const hasAiChanges = originalAiConfig && (
    aiConfig.abbreviations !== originalAiConfig.abbreviations ||
    aiConfig.custom_treatments !== originalAiConfig.custom_treatments ||
    aiConfig.custom_instructions !== originalAiConfig.custom_instructions
  )

  const hasFormChanges = originalFormOptions && formOptions &&
    JSON.stringify(formOptions) !== JSON.stringify(originalFormOptions)

  const hasChanges = activeTab === 'ai' ? hasAiChanges : hasFormChanges

  // AI Config handlers
  const handleAiChange = useCallback((field: keyof AISettingConfig, value: string) => {
    setAiConfig(prev => ({ ...prev, [field]: value }))
    setSaveStatus('idle')
    setError(null)
  }, [])

  // Form Options handlers
  const toggleItemEnabled = useCallback((category: FormOptionCategory, itemId: string) => {
    if (!formOptions) return
    setFormOptions(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [category]: prev[category].map(item =>
          item.id === itemId ? { ...item, isEnabled: !item.isEnabled } : item
        ),
      }
    })
    setSaveStatus('idle')
    setError(null)
  }, [formOptions])

  const deleteItem = useCallback((category: FormOptionCategory, itemId: string) => {
    if (!formOptions) return
    setFormOptions(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [category]: prev[category].filter(item => item.id !== itemId),
      }
    })
    setSaveStatus('idle')
    setError(null)
  }, [formOptions])

  const updateItemDuration = useCallback((category: FormOptionCategory, itemId: string, duration: number) => {
    if (!formOptions) return
    setFormOptions(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [category]: prev[category].map(item =>
          item.id === itemId ? { ...item, typicalDuration: duration } : item
        ),
      }
    })
    setSaveStatus('idle')
    setError(null)
  }, [formOptions])

  const openAddDialog = (category: FormOptionCategory, defaultTreatmentCat?: TreatmentCategory) => {
    setAddDialogCategory(category)
    setNewItemLabel('')
    setNewItemDescription('')
    setNewItemWeeks('')
    setNewItemTreatmentCategory(defaultTreatmentCat || 'other')
    setNewItemDuration('')
    setNewItemRequiresLab(false)
    setAddDialogOpen(true)
  }

  const addNewItem = () => {
    if (!formOptions || !addDialogCategory || !newItemLabel.trim()) return

    const newItem: FormOptionItem = {
      id: `custom_${Date.now()}`,
      label: newItemLabel.trim(),
      description: newItemDescription.trim() || undefined,
      typicalWeeks: newItemWeeks ? parseInt(newItemWeeks) : undefined,
      // Treatment-specific fields
      ...(addDialogCategory === 'treatments' && {
        treatmentCategory: newItemTreatmentCategory,
        typicalDuration: newItemDuration ? parseInt(newItemDuration) : undefined,
        requiresLab: newItemRequiresLab,
      }),
      isCustom: true,
      isEnabled: true,
    }

    setFormOptions(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [addDialogCategory]: [...prev[addDialogCategory], newItem],
      }
    })

    setAddDialogOpen(false)
    setSaveStatus('idle')
    setError(null)
  }

  // Save handlers
  const handleSave = async () => {
    setSaveStatus('saving')
    setError(null)

    try {
      if (activeTab === 'ai') {
        const res = await fetch('/api/ai-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setting_key: 'plan_parser', config: aiConfig }),
        })
        if (!res.ok) throw new Error('Failed to save AI settings')
        setOriginalAiConfig(aiConfig)
      } else {
        const res = await fetch('/api/form-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: formOptions }),
        })
        if (!res.ok) throw new Error('Failed to save form options')
        setOriginalFormOptions(formOptions)
      }

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err: any) {
      console.error('Error saving settings:', err)
      setError(err.message || 'Failed to save settings')
      setSaveStatus('error')
    }
  }

  const handleReset = () => {
    if (activeTab === 'ai') {
      setAiConfig(DEFAULT_AI_SETTINGS.plan_parser)
    } else {
      setFormOptions(getDefaultFormOptions())
    }
    setSaveStatus('idle')
    setError(null)
  }

  const handleRevert = () => {
    if (activeTab === 'ai' && originalAiConfig) {
      setAiConfig(originalAiConfig)
    } else if (originalFormOptions) {
      setFormOptions(originalFormOptions)
    }
    setSaveStatus('idle')
    setError(null)
  }

  if (isLoading) {
    return (
      <>
        <Header title="Paramètres" />
        <div className="p-6 max-w-4xl space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Paramètres" />

      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Paramètres</h2>
            <p className="text-muted-foreground">
              Configurez l'IA et personnalisez les options de formulaires
            </p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleRevert}>
                Annuler
              </Button>
            )}
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saveStatus === 'saving'}>
              {saveStatus === 'saving' ? (
                <>Enregistrement...</>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Enregistré
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Configuration IA
            </TabsTrigger>
            <TabsTrigger value="forms" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Options de formulaires
            </TabsTrigger>
          </TabsList>

          {/* AI Settings Tab */}
          <TabsContent value="ai" className="space-y-4 mt-6">
            <Accordion type="single" collapsible defaultValue="abbreviations" className="space-y-4">
              {/* Abbreviations */}
              <AccordionItem value="abbreviations" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Abréviations</span>
                    <Badge variant="secondary">Plan Parser</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pt-0">
                      <CardDescription>
                        Liste des abréviations que l'IA reconnaît lors de l'analyse des plans de traitement.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <Textarea
                        value={aiConfig.abbreviations}
                        onChange={(e) => handleAiChange('abbreviations', e.target.value)}
                        rows={12}
                        className="font-mono text-sm"
                        placeholder="- CC = couronne céramique&#10;- impl = implant&#10;..."
                      />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Custom Treatments */}
              <AccordionItem value="treatments" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Traitements personnalisés (IA)</span>
                    <Badge variant="outline">Optionnel</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pt-0">
                      <CardDescription>
                        Traitements additionnels pour le parsing IA (différent des options de formulaires).
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <Textarea
                        value={aiConfig.custom_treatments}
                        onChange={(e) => handleAiChange('custom_treatments', e.target.value)}
                        rows={6}
                        className="font-mono text-sm"
                        placeholder="- Traitement laser gingival&#10;- Contention linguale collée&#10;..."
                      />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Custom Instructions */}
              <AccordionItem value="instructions" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Instructions supplémentaires</span>
                    <Badge variant="outline">Optionnel</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pt-0">
                      <CardDescription>
                        Instructions spécifiques pour guider l'IA dans l'analyse.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <Textarea
                        value={aiConfig.custom_instructions}
                        onChange={(e) => handleAiChange('custom_instructions', e.target.value)}
                        rows={6}
                        placeholder="Instructions personnalisées..."
                      />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* Form Options Tab */}
          <TabsContent value="forms" className="space-y-4 mt-6">
            {formOptions && (
              <Accordion type="single" collapsible defaultValue="treatment_goals" className="space-y-4">
                {(Object.keys(CATEGORY_META) as FormOptionCategory[]).map((category) => {
                  const meta = CATEGORY_META[category]
                  const items = formOptions[category] || []
                  const Icon = meta.icon
                  const enabledCount = items.filter(i => i.isEnabled).length

                  // Special handling for treatments - group by treatmentCategory
                  if (category === 'treatments') {
                    const groupedByCategory = items.reduce((acc, item) => {
                      const cat = item.treatmentCategory || 'other'
                      if (!acc[cat]) acc[cat] = []
                      acc[cat].push(item)
                      return acc
                    }, {} as Record<TreatmentCategory, FormOptionItem[]>)

                    return (
                      <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 flex-1">
                            <Icon className={`h-5 w-5 ${meta.color}`} />
                            <span className="font-semibold">{meta.label}</span>
                            <Badge variant="secondary" className="ml-auto mr-4">
                              {enabledCount}/{items.length} actifs
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <Card className="border-0 shadow-none">
                            <CardHeader className="px-0 pt-0">
                              <CardDescription>{meta.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="px-0 pb-0 space-y-4">
                              {/* Treatments grouped by category */}
                              {(Object.keys(TREATMENT_CATEGORIES) as TreatmentCategory[]).map((treatmentCat) => {
                                const catItems = groupedByCategory[treatmentCat] || []
                                if (catItems.length === 0) return null
                                const catMeta = TREATMENT_CATEGORIES[treatmentCat]
                                const catEnabledCount = catItems.filter(i => i.isEnabled).length

                                return (
                                  <div key={treatmentCat} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge className={catMeta.color}>{catMeta.name}</Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {catEnabledCount}/{catItems.length} actifs
                                        </span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs"
                                        onClick={() => openAddDialog('treatments', treatmentCat)}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Ajouter
                                      </Button>
                                    </div>
                                    <div className="space-y-1 pl-2 border-l-2 border-muted">
                                      {catItems.map((item) => (
                                        <div
                                          key={item.id}
                                          className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                                            item.isEnabled ? 'bg-background' : 'bg-muted/50 opacity-60'
                                          }`}
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-medium">{item.label}</span>
                                              {item.isCustom && (
                                                <Badge variant="outline" className="text-xs h-5">Perso.</Badge>
                                              )}
                                              {item.requiresLab && (
                                                <Badge variant="secondary" className="text-xs h-5">Labo</Badge>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {/* Editable duration */}
                                            <div className="flex items-center gap-1">
                                              <Input
                                                type="number"
                                                min={5}
                                                step={5}
                                                value={item.typicalDuration || ''}
                                                onChange={(e) => updateItemDuration(category, item.id, parseInt(e.target.value) || 0)}
                                                className="w-16 h-7 text-xs text-center"
                                                placeholder="--"
                                              />
                                              <span className="text-xs text-muted-foreground">min</span>
                                            </div>
                                            <Switch
                                              checked={item.isEnabled}
                                              onCheckedChange={() => toggleItemEnabled(category, item.id)}
                                              className="scale-90"
                                            />
                                            {item.isCustom && (
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive hover:text-destructive"
                                                onClick={() => deleteItem(category, item.id)}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })}
                            </CardContent>
                          </Card>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  }

                  // Default rendering for other categories
                  return (
                    <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <Icon className={`h-5 w-5 ${meta.color}`} />
                          <span className="font-semibold">{meta.label}</span>
                          <Badge variant="secondary" className="ml-auto mr-4">
                            {enabledCount}/{items.length} actifs
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Card className="border-0 shadow-none">
                          <CardHeader className="px-0 pt-0">
                            <CardDescription>{meta.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="px-0 pb-0 space-y-3">
                            {/* Items list */}
                            <div className="space-y-2">
                              {items.map((item) => (
                                <div
                                  key={item.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                    item.isEnabled ? 'bg-background' : 'bg-muted/50 opacity-60'
                                  }`}
                                >
                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{item.label}</span>
                                      {item.isCustom && (
                                        <Badge variant="outline" className="text-xs">Personnalisé</Badge>
                                      )}
                                      {item.typicalWeeks && (
                                        <Badge variant="secondary" className="text-xs">
                                          ~{item.typicalWeeks} sem.
                                        </Badge>
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-muted-foreground truncate">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={item.isEnabled}
                                      onCheckedChange={() => toggleItemEnabled(category, item.id)}
                                    />
                                    {item.isCustom && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => deleteItem(category, item.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Add button */}
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => openAddDialog(category)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter une option
                            </Button>
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Comment ça marche ?</p>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'ai'
                    ? "Ces paramètres sont injectés dans le prompt de l'IA lors de l'analyse des plans de traitement."
                    : "Ces options personnalisent les choix disponibles dans les formulaires de création de séquences. Désactivez une option pour la masquer sans la supprimer."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Ajouter une option
              {addDialogCategory && (
                <span className="text-muted-foreground font-normal ml-2">
                  - {CATEGORY_META[addDialogCategory].label}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Créez une nouvelle option personnalisée. Vous pourrez la modifier ou la supprimer plus tard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-label">Libellé *</Label>
              <Input
                id="new-label"
                placeholder="Ex: Stabiliser l'occlusion"
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-description">Description (optionnel)</Label>
              <Input
                id="new-description"
                placeholder="Ex: Équilibrer les contacts occlusaux"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
              />
            </div>

            {addDialogCategory === 'delay_reasons' && (
              <div className="space-y-2">
                <Label htmlFor="new-weeks">Délai typique en semaines (optionnel)</Label>
                <Input
                  id="new-weeks"
                  type="number"
                  min={1}
                  placeholder="Ex: 4"
                  value={newItemWeeks}
                  onChange={(e) => setNewItemWeeks(e.target.value)}
                />
              </div>
            )}

            {/* Treatment-specific fields */}
            {addDialogCategory === 'treatments' && (
              <>
                <div className="space-y-2">
                  <Label>Catégorie de traitement *</Label>
                  <Select
                    value={newItemTreatmentCategory}
                    onValueChange={(v) => setNewItemTreatmentCategory(v as TreatmentCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TREATMENT_CATEGORIES) as TreatmentCategory[]).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${TREATMENT_CATEGORIES[cat].color.split(' ')[0]}`} />
                            {TREATMENT_CATEGORIES[cat].name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-duration">Durée typique (min)</Label>
                    <Input
                      id="new-duration"
                      type="number"
                      min={5}
                      step={5}
                      placeholder="Ex: 30"
                      value={newItemDuration}
                      onChange={(e) => setNewItemDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nécessite laboratoire</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Switch
                        checked={newItemRequiresLab}
                        onCheckedChange={setNewItemRequiresLab}
                      />
                      <span className="text-sm text-muted-foreground">
                        {newItemRequiresLab ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={addNewItem} disabled={!newItemLabel.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
