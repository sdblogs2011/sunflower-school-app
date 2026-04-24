import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AttendanceOverview from './AttendanceOverview'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id
  const today = new Date().toISOString().split('T')[0]

  const { data: session } = await admin
    .from('academic_sessions').select('id')
    .eq('school_id', schoolId).eq('is_active', true).single()

  const { data: classSections } = await admin
    .from('class_sections')
    .select('id, classes(name)')
    .eq('school_id', schoolId)
    .eq('academic_session_id', session?.id ?? '')
    .order('created_at')

  const { data: attendanceSessions } = await admin
    .from('attendance_sessions')
    .select('id, class_section_id, is_submitted')
    .eq('attendance_date', today)
    .in('class_section_id', (classSections ?? []).map((cs: any) => cs.id))

  // Count present per session
  const sessionIds = (attendanceSessions ?? []).map((s: any) => s.id)
  const { data: presentCounts } = sessionIds.length > 0
    ? await admin.from('attendance_records')
        .select('attendance_session_id')
        .in('attendance_session_id', sessionIds)
        .eq('status', 'present')
    : { data: [] }

  // Count total enrolled per class
  const { data: enrollments } = await admin
    .from('student_enrollments')
    .select('class_section_id')
    .eq('academic_session_id', session?.id ?? '')

  const enrollmentMap = new Map<string, number>()
  for (const e of (enrollments ?? [])) {
    enrollmentMap.set(e.class_section_id, (enrollmentMap.get(e.class_section_id) ?? 0) + 1)
  }

  const presentMap = new Map<string, number>()
  for (const r of (presentCounts ?? [])) {
    presentMap.set(r.attendance_session_id, (presentMap.get(r.attendance_session_id) ?? 0) + 1)
  }

  const classes = (classSections ?? []).map((cs: any) => {
    const att = (attendanceSessions ?? []).find((a: any) => a.class_section_id === cs.id)
    return {
      id: cs.id,
      class_name: cs.classes?.name ?? '—',
      session: att ? {
        id: att.id,
        is_submitted: att.is_submitted,
        present: presentMap.get(att.id) ?? 0,
        total: enrollmentMap.get(cs.id) ?? 0,
      } : null,
    }
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Today: <span className="font-medium text-gray-700">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </p>
      </div>
      <AttendanceOverview classes={classes} defaultDate={today} />
    </div>
  )
}
