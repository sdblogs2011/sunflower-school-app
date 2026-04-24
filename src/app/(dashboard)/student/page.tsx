import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('full_name, school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id
  const today = new Date().toISOString().split('T')[0]

  const { data: session } = await admin
    .from('academic_sessions').select('id')
    .eq('school_id', schoolId).eq('is_active', true).single()

  // Find student — match by full_name + school (best we can without direct user_id link on students)
  const { data: studentRecord } = await admin
    .from('students').select('id, full_name, admission_number')
    .eq('school_id', schoolId).eq('full_name', profile.full_name).eq('status', 'active').single()

  const enrollment = studentRecord
    ? await admin.from('student_enrollments')
        .select('class_section_id, roll_number, class_sections(classes(name))')
        .eq('student_id', studentRecord.id).eq('academic_session_id', session?.id ?? '').single()
    : null

  const classSectionId = (enrollment?.data as any)?.class_section_id
  const className = (enrollment?.data as any)?.class_sections?.classes?.name ?? '—'

  const [
    { data: todayAtt },
    { data: upcomingHW },
    { data: recentMarks },
    { data: recentNotices },
  ] = await Promise.all([
    studentRecord
      ? admin.from('attendance_records')
          .select('status, attendance_sessions(attendance_date)')
          .eq('student_id', studentRecord.id)
          .order('created_at', { ascending: false }).limit(14)
      : Promise.resolve({ data: [] }),
    classSectionId
      ? admin.from('homework')
          .select('id, title, due_date, subjects(name)')
          .eq('class_section_id', classSectionId)
          .gte('due_date', today).order('due_date').limit(5)
      : Promise.resolve({ data: [] }),
    studentRecord
      ? admin.from('marks_records')
          .select('marks_obtained, is_absent, exam_subjects(max_marks, subjects(name), exams(name))')
          .eq('student_id', studentRecord.id)
          .order('created_at', { ascending: false }).limit(6)
      : Promise.resolve({ data: [] }),
    admin.from('notices')
      .select('id, title, body, published_at')
      .eq('school_id', schoolId).eq('publish_status', 'published')
      .order('published_at', { ascending: false }).limit(3),
  ])

  const todayStatus = (todayAtt ?? []).find((r: any) => r.attendance_sessions?.attendance_date === today)?.status as string | undefined

  // Attendance last 14 days
  const attDays = (todayAtt ?? []).slice(0, 14).map((r: any) => ({
    date: r.attendance_sessions?.attendance_date, status: r.status,
  }))

  const statusColor: Record<string, string> = {
    present: 'bg-green-500', absent: 'bg-red-400', late: 'bg-amber-400', excused: 'bg-blue-300',
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-0.5">{greeting}, {profile.full_name?.split(' ')[0]}</h1>
      <p className="text-sm text-gray-400 mb-7">
        {className !== '—' ? `${className} · ` : ''}{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      {!studentRecord ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-base font-medium text-gray-600 mb-1">Student record not linked</p>
          <p className="text-sm text-gray-400">Please contact the school admin to link your account.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Today status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 col-span-1">
              <p className="text-xs text-gray-500 uppercase font-medium tracking-wide mb-1">Today</p>
              {todayStatus ? (
                <p className={`text-lg font-bold capitalize ${todayStatus === 'present' ? 'text-green-700' : todayStatus === 'absent' ? 'text-red-600' : 'text-amber-700'}`}>
                  {todayStatus}
                </p>
              ) : (
                <p className="text-lg font-bold text-gray-400">Not marked</p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 col-span-2">
              <p className="text-xs text-gray-500 uppercase font-medium tracking-wide mb-2">Last 14 Days</p>
              <div className="flex gap-1 flex-wrap">
                {attDays.map((d: any, i: number) => (
                  <div key={i} title={`${d.date}: ${d.status}`}
                    className={`w-4 h-4 rounded-sm ${statusColor[d.status] ?? 'bg-gray-200'}`} />
                ))}
                {attDays.length === 0 && <p className="text-xs text-gray-400">No records yet.</p>}
              </div>
              <div className="flex gap-3 mt-2">
                {Object.entries({ present: 'Present', absent: 'Absent', late: 'Late' }).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-sm ${statusColor[k]}`} />
                    <span className="text-xs text-gray-400">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Upcoming homework */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Upcoming Homework</h2>
              {(upcomingHW ?? []).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No upcoming homework.</p>
              ) : (
                <div className="space-y-2">
                  {(upcomingHW ?? []).map((h: any) => (
                    <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm text-gray-700">{h.title}</p>
                        <p className="text-xs text-gray-400">{h.subjects?.name ?? 'General'}</p>
                      </div>
                      <span className="text-xs text-gray-400 ml-3 whitespace-nowrap">
                        {new Date(h.due_date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent marks */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Recent Marks</h2>
              {(recentMarks ?? []).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No marks recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {(recentMarks ?? []).map((m: any, i: number) => {
                    const obtained = m.marks_obtained
                    const max = m.exam_subjects?.max_marks ?? 100
                    const pct = obtained != null ? Math.round((obtained / max) * 100) : null
                    return (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm text-gray-700">{m.exam_subjects?.subjects?.name ?? 'Subject'}</p>
                          <p className="text-xs text-gray-400">{m.exam_subjects?.exams?.name ?? 'Exam'}</p>
                        </div>
                        {m.is_absent ? (
                          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Absent</span>
                        ) : obtained != null ? (
                          <span className={`text-sm font-bold ${pct! >= 50 ? 'text-green-700' : 'text-red-600'}`}>
                            {obtained}/{max}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Notices */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">School Notices</h2>
            {(recentNotices ?? []).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No notices.</p>
            ) : (
              <div className="space-y-3">
                {(recentNotices ?? []).map((n: any) => (
                  <div key={n.id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    {n.published_at && <p className="text-xs text-gray-400 mt-1">{new Date(n.published_at).toLocaleDateString('en-IN')}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
