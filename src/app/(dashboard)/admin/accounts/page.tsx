import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AccountsClient from './AccountsClient'

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id, role').eq('user_id', user.id).single()
  if (!profile || profile.role !== 'principal') redirect('/admin')

  const admin = createAdminClient()

  const { data: accounts } = await admin
    .from('user_profiles')
    .select('user_id, full_name, email, role, is_active, created_at, mobile_number')
    .eq('school_id', profile.school_id)
    .order('created_at')

  const rows = (accounts ?? []).map((a: any) => ({
    userId: a.user_id,
    fullName: a.full_name,
    email: a.email,
    role: a.role,
    isActive: a.is_active,
    createdAt: a.created_at,
    mobile: a.mobile_number,
  }))

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">School Accounts</h1>
        <p className="text-sm text-gray-400 mt-1">Create and manage login accounts for clerks, teachers, parents, and students.</p>
      </div>
      <AccountsClient accounts={rows} />
    </div>
  )
}
