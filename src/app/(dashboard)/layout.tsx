import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { getDentistByAuthId } from '@/lib/supabase/queries'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get dentist profile using query helper
  const dentist = await getDentistByAuthId(user.id)

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar
        user={dentist ? {
          email: dentist.email,
          full_name: dentist.full_name
        } : {
          email: user.email || '',
          full_name: user.email?.split('@')[0] || 'Utilisateur'
        }}
      />
      <main className="md:pl-64">
        {children}
      </main>
    </div>
  )
}
