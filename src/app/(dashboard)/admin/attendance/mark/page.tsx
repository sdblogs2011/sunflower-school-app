import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MarkAttendance from './MarkAttendance'

export default async function MarkAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ cs?: string; date?: string }>
}) {
  const { cs: classSectionId, date } = await searchParams

  if (!classSectionId || !date) redirect('/admin/attendance')

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

  // Get class name
  const { data: cs } = await admin
    .from('class_sections')
    .select('id, classes(name)')
    .eq('id', classSectionId).single()

  // Get enrolled students
  const { data: enrollments } = await admin
    .from('student_enrollments')
    .select('student_id, roll_number, students(id, full_name)')
    .eq('class_section_id', classSectionId)
    .eq('academic_session_id', session?.id ?? '')
    .order('roll_number')

  const students = (enrollments ?? []).map((e: any) => ({
    id: e.students?.id,
    full_name: e.students?.full_name ?? '—',
    roll_number: e.roll_number,
  })).filter(s => s.id)

  // Get existing attendance session + records
  const { data: attSession } = await admin
    .from('attendance_sessions')
    .select('id')
    .eq('class_section_id', classSectionId)
    .eq('attendance_date', date)
    .maybeSingle()

  const existingStatuses: Record<string, string> = {}
  if (attSession) {
    const { data: records } = await admin
      .from('attendance_records')
      .select('student_id, status')
      .eq('attendance_session_id', attSession.id)
    for (const r of (records ?? [])) {
      existingStatuses[r.student_id] = r.status
    }
  }

  const className = (cs as any)?.classes?.name ?? '—'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/attendance" className="text-sm text-gray-500 hover:text-gray-700">← Attendance</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{className}</h1>
        <span className="text-sm text-gray-500">{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>

      <MarkAttendance
        classSectionId={classSectionId}
        className={className}
        date={date}
        students={students}
        existingStatuses={existingStatuses}
      />
    </div>
  )
}
