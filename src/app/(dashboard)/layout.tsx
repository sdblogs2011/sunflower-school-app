import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Shell from '@/components/Shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  return <Shell profile={profile}>{children}</Shell>
}
