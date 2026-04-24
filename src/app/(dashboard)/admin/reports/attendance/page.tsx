import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AttendanceReport from './AttendanceReport'

export default async function AttendanceReportPage({ searchParams }: { searchParams: Promise<{ class?: string; from?: string; to?: string }> }) {
  const sp = await searchParams
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

  const { data: classSections } = await admin
    .from('class_sections')
    .select('id, classes(name)')
    .eq('school_id', schoolId)
    .eq('academic_session_id', session?.id ?? '')

  const csList = (classSections ?? []).map((cs: any) => ({ id: cs.id, class_name: cs.classes?.name ?? '' }))

  // Date range defaults: current month
  const now = new Date()
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const defaultTo = now.toISOString().split('T')[0]
  const selectedClass = sp.class ?? ''
  const dateFrom = sp.from ?? defaultFrom
  const dateTo = sp.to ?? defaultTo

  let rows: any[] = []
  let className = ''

  if (selectedClass) {
    const cs = csList.find(c => c.id === selectedClass)
    className = cs?.class_name ?? ''

    // Get enrolled students
    const { data: enrollments } = await admin
      .from('student_enrollments')
      .select('student_id, roll_number, students(id, full_name)')
      .eq('class_section_id', selectedClass)
      .eq('academic_session_id', session?.id ?? '')
      .order('roll_number')

    // Get attendance sessions in date range
    const { data: sessions } = await admin
      .from('attendance_sessions')
      .select('id')
      .eq('class_section_id', selectedClass)
      .gte('attendance_date', dateFrom)
      .lte('attendance_date', dateTo)

    const sessionIds = (sessions ?? []).map((s: any) => s.id)

    // Get all attendance records
    const { data: records } = sessionIds.length > 0
      ? await admin.from('attendance_records')
          .select('student_id, status')
          .in('attendance_session_id', sessionIds)
      : { data: [] }

    // Tally per student
    const tally = new Map<string, { present: number; absent: number; late: number; excused: number }>()
    for (const r of (records ?? [])) {
      const t = tally.get((r as any).student_id) ?? { present: 0, absent: 0, late: 0, excused: 0 }
      t[(r as any).status as 'present' | 'absent' | 'late' | 'excused']++
      tally.set((r as any).student_id, t)
    }

    rows = (enrollments ?? []).map((e: any) => {
      const t = tally.get(e.student_id) ?? { present: 0, absent: 0, late: 0, excused: 0 }
      const total = t.present + t.absent + t.late + t.excused
      return {
        studentId: e.student_id,
        name: e.students?.full_name ?? '',
        rollNumber: e.roll_number,
        ...t, total,
      }
    })
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/reports" className="text-sm text-gray-500 hover:text-gray-700">← Reports</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Attendance Report</h1>
      </div>
      <AttendanceReport
        rows={rows} classSections={csList}
        currentClass={selectedClass} dateFrom={dateFrom} dateTo={dateTo} className={className}
      />
    </div>
  )
}
