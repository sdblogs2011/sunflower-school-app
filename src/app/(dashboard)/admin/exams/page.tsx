import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import ExamList from './ExamList'

export default async function ExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id

  const { data: session } = await admin
    .from('academic_sessions').select('id, name')
    .eq('school_id', schoolId).eq('is_active', true).single()

  const { data: examsRaw } = await admin
    .from('exams')
    .select('id, name, exam_type, start_date, end_date, exam_subjects(id)')
    .eq('school_id', schoolId)
    .eq('academic_session_id', session?.id ?? '')
    .order('created_at', { ascending: false })

  const exams = (examsRaw ?? []).map((e: any) => ({
    id: e.id, name: e.name, exam_type: e.exam_type,
    start_date: e.start_date, end_date: e.end_date,
    subject_count: e.exam_subjects?.length ?? 0,
  }))

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
        {session && <span className="text-sm text-gray-400">({session.name})</span>}
      </div>
      <ExamList exams={exams} />
    </div>
  )
}
