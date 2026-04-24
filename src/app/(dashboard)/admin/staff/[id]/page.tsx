import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StaffDetail from './StaffDetail'

export default async function StaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id

  const [{ data: staff }, { data: session }] = await Promise.all([
    admin.from('staff').select('*').eq('id', id).eq('school_id', schoolId).single(),
    admin.from('academic_sessions').select('id').eq('school_id', schoolId).eq('is_active', true).single(),
  ])
  if (!staff) notFound()

  const [{ data: assignments }, { data: classSections }, { data: subjects }] = await Promise.all([
    admin.from('teacher_assignments')
      .select('id, class_section_id, subject_id, class_sections(classes(name)), subjects(name)')
      .eq('staff_id', id).eq('academic_session_id', session?.id ?? ''),
    admin.from('class_sections').select('id, classes(name)')
      .eq('school_id', schoolId).eq('academic_session_id', session?.id ?? ''),
    admin.from('subjects').select('id, name').eq('school_id', schoolId).order('name'),
  ])

  const assignmentList = (assignments ?? []).map((a: any) => ({
    id: a.id,
    class_section_id: a.class_section_id,
    subject_id: a.subject_id,
    class_name: a.class_sections?.classes?.name ?? '—',
    subject_name: a.subjects?.name ?? '—',
  }))

  const classSectionList = (classSections ?? []).map((cs: any) => ({
    id: cs.id, class_name: cs.classes?.name ?? '—',
  }))

  const subjectList = (subjects ?? []).map((s: any) => ({ id: s.id, name: s.name }))

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/staff" className="text-sm text-gray-500 hover:text-gray-700">← Staff</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{staff.full_name}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${staff.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {staff.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <StaffDetail
        staff={staff}
        assignments={assignmentList}
        classSections={classSectionList}
        subjects={subjectList}
      />
    </div>
  )
}
