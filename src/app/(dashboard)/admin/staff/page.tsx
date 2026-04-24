import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StaffList from './StaffList'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: staff } = await createAdminClient()
    .from('staff')
    .select('id, employee_id, full_name, designation, department, mobile_number, is_active')
    .eq('school_id', profile.school_id)
    .order('full_name')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
        <Link href="/admin/staff/new"
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
          + Add Staff
        </Link>
      </div>
      <StaffList staff={staff ?? []} />
    </div>
  )
}
