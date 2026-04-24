import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import HomeworkClient from './HomeworkClient'

export default async function HomeworkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id

  const { data: session } = await admin
    .from('academic_sessions').select('id')
    .eq('school_id', schoolId).eq('is_active', true).single()

  const [{ data: classSections }, { data: subjects }] = await Promise.all([
    admin.from('class_sections')
      .select('id, classes(name)')
      .eq('school_id', schoolId)
      .eq('academic_session_id', session?.id ?? ''),
    admin.from('subjects').select('id, name').eq('school_id', schoolId).order('name'),
  ])

  const csIds = (classSections ?? []).map((cs: any) => cs.id)

  const { data: homeworkRaw } = csIds.length > 0
    ? await admin.from('homework')
        .select('id, title, description, due_date, created_at, class_section_id, subject_id')
        .in('class_section_id', csIds)
        .order('due_date', { ascending: true })
    : { data: [] }

  const csMap = new Map((classSections ?? []).map((cs: any) => [cs.id, cs.classes?.name ?? '']))
  const subMap = new Map((subjects ?? []).map((s: any) => [s.id, s.name]))

  const homework = (homeworkRaw ?? []).map((h: any) => ({
    id: h.id, title: h.title, description: h.description,
    due_date: h.due_date, created_at: h.created_at,
    class_section_id: h.class_section_id,
    class_name: csMap.get(h.class_section_id) ?? 'Unknown',
    subject_name: h.subject_id ? (subMap.get(h.subject_id) ?? null) : null,
  }))

  const csList = (classSections ?? []).map((cs: any) => ({
    id: cs.id, class_name: cs.classes?.name ?? 'Unknown',
  }))

  const subList = (subjects ?? []).map((s: any) => ({ id: s.id, name: s.name }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
      </div>
      <HomeworkClient classSections={csList} subjects={subList} homework={homework} />
    </div>
  )
}
