import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NewNoticeForm from './NewNoticeForm'

export default async function NewNoticePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const { data: classSections } = await admin
    .from('class_sections')
    .select('id, classes(name)')
    .eq('school_id', profile.school_id)

  const sections = (classSections ?? []).map((cs: any) => ({
    id: cs.id,
    class_name: cs.classes?.name ?? 'Unknown',
  }))

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/notices" className="text-sm text-gray-500 hover:text-gray-700">← Notices</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">New Notice</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <NewNoticeForm classSections={sections} />
      </div>
    </div>
  )
}
