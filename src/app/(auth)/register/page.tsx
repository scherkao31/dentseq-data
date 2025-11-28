'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    title: '',
    institution: 'Université de Genève',
    consentResearch: false,
    consentDataProcessing: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
      })
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 6 caractères',
      })
      setIsLoading(false)
      return
    }

    if (!formData.consentDataProcessing) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Vous devez accepter le traitement des données pour créer un compte',
      })
      setIsLoading(false)
      return
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      })

      if (authError) {
        toast({
          variant: 'destructive',
          title: 'Erreur d\'inscription',
          description: authError.message,
        })
        return
      }

      if (authData.user) {
        // Update dentist profile with additional info
        const { error: profileError } = await supabase
          .from('dentists')
          .update({
            title: formData.title || null,
            institution: formData.institution,
            consent_research: formData.consentResearch,
            consent_data_processing: formData.consentDataProcessing,
          })
          .eq('auth_user_id', authData.user.id)

        if (profileError) {
          console.error('Profile update error:', profileError)
        }
      }

      toast({
        title: 'Compte créé',
        description: 'Votre compte a été créé avec succès. Vérifiez votre email pour confirmer votre inscription.',
      })

      router.push('/login')
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'inscription',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
              DS
            </div>
          </div>
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>
            Rejoignez la plateforme DentSeq
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Dr."
                  value={formData.title}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="col-span-3 space-y-2">
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Jean Dupont"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="vous@exemple.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                name="institution"
                placeholder="Université de Genève"
                value={formData.institution}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="consentDataProcessing"
                  name="consentDataProcessing"
                  checked={formData.consentDataProcessing}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, consentDataProcessing: checked as boolean }))
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="consentDataProcessing" className="text-sm leading-tight">
                  J'accepte le traitement de mes données personnelles conformément au RGPD *
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="consentResearch"
                  name="consentResearch"
                  checked={formData.consentResearch}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, consentResearch: checked as boolean }))
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="consentResearch" className="text-sm leading-tight">
                  J'accepte que mes contributions soient utilisées à des fins de recherche
                </Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer mon compte
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Déjà inscrit ?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
