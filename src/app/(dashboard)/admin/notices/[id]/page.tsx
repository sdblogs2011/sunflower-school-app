import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import NoticeDetail from './NoticeDetail'

export default async function NoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const { data: n } = await admin
    .from('notices')
    .select('id, title, body, publish_status, published_at, created_at, notice_audiences(audience_type, class_sections(classes(name)), role)')
    .eq('id', id).eq('school_id', profile.school_id)
    .single()

  if (!n) notFound()

  const aud = (n as any).notice_audiences?.[0]
  let audience = 'All School'
  if (aud?.audience_type === 'class') audience = aud.class_sections?.classes?.name ?? 'Class'
  if (aud?.audience_type === 'role') audience = aud.role ? aud.role.charAt(0).toUpperCase() + aud.role.slice(1) + 's' : 'Role'

  const notice = {
    id: n.id, title: n.title, body: (n as any).body,
    publish_status: n.publish_status,
    published_at: n.published_at,
    created_at: n.created_at,
    audience,
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/notices" className="text-sm text-gray-500 hover:text-gray-700">← Notices</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900 truncate">{notice.title}</h1>
      </div>
      <NoticeDetail notice={notice} />
    </div>
  )
}
