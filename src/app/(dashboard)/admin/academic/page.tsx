import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AcademicClient from './AcademicClient'

export default async function AcademicPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || !['principal', 'admin'].includes(profile.role)) redirect('/admin')

  const admin = createAdminClient()
  const schoolId = profile.school_id

  const [
    { data: classes },
    { data: sections },
    { data: subjects },
    { data: session },
  ] = await Promise.all([
    admin.from('classes').select('id, name, order_rank').eq('school_id', schoolId).order('order_rank'),
    admin.from('sections').select('id, name').eq('school_id', schoolId).order('name'),
    admin.from('subjects').select('id, name, code').eq('school_id', schoolId).order('name'),
    admin.from('academic_sessions').select('id, name').eq('school_id', schoolId).eq('is_active', true).single(),
  ])

  const { data: classSections } = await admin
    .from('class_sections')
    .select('id, class_id, section_id, classes(name), sections(name)')
    .eq('school_id', schoolId)
    .eq('academic_session_id', session?.id ?? '')
    .order('created_at')

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Structure</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Session:{' '}
            <span className="font-medium text-gray-700">{session?.name ?? 'No active session'}</span>
          </p>
        </div>
      </div>

      <AcademicClient
        sessionId={session?.id ?? ''}
        classes={classes ?? []}
        sections={sections ?? []}
        subjects={subjects ?? []}
        classSections={(classSections ?? []) as any}
      />
    </div>
  )
}
