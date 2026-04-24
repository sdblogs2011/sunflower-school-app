import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StudentList from './StudentList'

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('school_id, role').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id

  const { data: session } = await admin
    .from('academic_sessions').select('id, name')
    .eq('school_id', schoolId).eq('is_active', true).single()

  const [{ data: students }, { data: enrollments }, { data: classes }] = await Promise.all([
    admin.from('students').select('id, admission_number, full_name, gender, status')
      .eq('school_id', schoolId).order('full_name'),
    admin.from('student_enrollments')
      .select('student_id, class_sections(classes(name))')
      .eq('academic_session_id', session?.id ?? ''),
    admin.from('classes').select('name').eq('school_id', schoolId).order('order_rank'),
  ])

  const enrollmentMap = new Map(
    (enrollments ?? []).map((e: any) => [e.student_id, e.class_sections?.classes?.name ?? null])
  )

  const rows = (students ?? []).map(s => ({
    ...s,
    class_name: enrollmentMap.get(s.id) ?? null,
  }))

  const classNames = (classes ?? []).map((c: any) => c.name)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">Session: <span className="font-medium text-gray-700">{session?.name}</span></p>
        </div>
        <Link href="/admin/students/new"
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
          + Add Student
        </Link>
      </div>

      <StudentList students={rows} classNames={classNames} />
    </div>
  )
}
