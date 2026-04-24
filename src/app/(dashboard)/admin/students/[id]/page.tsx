import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StudentDetail from './StudentDetail'

export default async function StudentPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id

  const [{ data: student }, { data: session }] = await Promise.all([
    admin.from('students').select('*').eq('id', params.id).eq('school_id', schoolId).single(),
    admin.from('academic_sessions').select('id').eq('school_id', schoolId).eq('is_active', true).single(),
  ])

  if (!student) notFound()

  const [{ data: enrollment }, { data: classSections }, { data: parentLinks }] = await Promise.all([
    admin.from('student_enrollments').select('id, class_section_id, roll_number')
      .eq('student_id', params.id).eq('academic_session_id', session?.id ?? '').maybeSingle(),
    admin.from('class_sections').select('id, classes(name)')
      .eq('school_id', schoolId).eq('academic_session_id', session?.id ?? ''),
    admin.from('parent_student_links')
      .select('relation, parents(id, full_name, mobile_number, email)')
      .eq('student_id', params.id),
  ])

  const classSectionList = (classSections ?? []).map((cs: any) => ({
    id: cs.id,
    class_name: cs.classes?.name ?? '—',
  }))

  const parentList = (parentLinks ?? []).map((pl: any) => ({
    id: pl.parents?.id,
    full_name: pl.parents?.full_name,
    mobile_number: pl.parents?.mobile_number,
    email: pl.parents?.email,
    relation: pl.relation,
  }))

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/students" className="text-sm text-gray-500 hover:text-gray-700">← Students</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{student.full_name}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          student.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>{student.status}</span>
      </div>

      <StudentDetail
        student={student}
        enrollment={enrollment ?? null}
        classSections={classSectionList}
        parents={parentList}
      />
    </div>
  )
}
