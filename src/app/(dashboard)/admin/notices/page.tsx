import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NoticeList from './NoticeList'

export default async function NoticesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()

  const { data: notices } = await admin
    .from('notices')
    .select(`
      id, title, publish_status, published_at, created_at,
      notice_audiences(audience_type, class_sections(classes(name)), role)
    `)
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })

  const rows = (notices ?? []).map((n: any) => {
    const aud = n.notice_audiences?.[0]
    let audience = 'All School'
    if (aud?.audience_type === 'class') audience = aud.class_sections?.classes?.name ?? 'Class'
    if (aud?.audience_type === 'role') audience = aud.role ? aud.role.charAt(0).toUpperCase() + aud.role.slice(1) + 's' : 'Role'
    return {
      id: n.id, title: n.title,
      publish_status: n.publish_status,
      published_at: n.published_at,
      created_at: n.created_at,
      audience,
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
        <Link href="/admin/notices/new"
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
          + New Notice
        </Link>
      </div>
      <NoticeList notices={rows} />
    </div>
  )
}
