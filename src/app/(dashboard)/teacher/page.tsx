import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TeacherDashboard() {
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

  // Find linked staff record
  const { data: staffRecord } = await admin
    .from('staff').select('id').eq('user_id', user.id).eq('school_id', schoolId).single()

  // My assigned class sections
  let myAssignments: any[] = []
  if (staffRecord) {
    const { data } = await admin.from('teacher_assignments')
      .select('class_section_id, subjects(name), class_sections(classes(name))')
      .eq('staff_id', staffRecord.id)
      .eq('academic_session_id', session?.id ?? '')
    myAssignments = data ?? []
  }

  const myClassIds = [...new Set(myAssignments.map((a: any) => a.class_section_id))]

  // All class sections for school (fallback if no assignment)
  const { data: allCSSections } = await admin
    .from('class_sections').select('id').eq('school_id', schoolId)
  const allCsIds = (allCSSections ?? []).map((c: any) => c.id)
  const targetCsIds = myClassIds.length > 0 ? myClassIds : allCsIds

  const [
    { data: pendingAttendance },
    { data: upcomingHW },
    { data: recentNotices },
  ] = await Promise.all([
    targetCsIds.length > 0
      ? admin.from('class_sections')
          .select('id, classes(name)')
          .in('id', targetCsIds)
          .eq('school_id', schoolId)
      : Promise.resolve({ data: [] }),
    targetCsIds.length > 0
      ? admin.from('homework')
          .select('id, title, due_date, class_sections(classes(name)), subjects(name)')
          .in('class_section_id', targetCsIds)
          .gte('due_date', today)
          .order('due_date').limit(6)
      : Promise.resolve({ data: [] }),
    admin.from('notices')
      .select('id, title, published_at')
      .eq('school_id', schoolId).eq('publish_status', 'published')
      .order('published_at', { ascending: false }).limit(5),
  ])

  // Check which classes have attendance submitted today
  const { data: submittedToday } = targetCsIds.length > 0
    ? await admin.from('attendance_sessions')
        .select('class_section_id')
        .eq('attendance_date', today)
        .eq('is_submitted', true)
        .in('class_section_id', targetCsIds)
    : { data: [] }

  const submittedIds = new Set((submittedToday ?? []).map((s: any) => s.class_section_id))
  const pendingClasses = (pendingAttendance ?? []).filter((c: any) => !submittedIds.has(c.id))

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-0.5">{greeting}, {profile.full_name?.split(' ')[0]}</h1>
      <p className="text-sm text-gray-400 mb-7">
        {myClassIds.length > 0 ? `You teach ${myClassIds.length} class${myClassIds.length !== 1 ? 'es' : ''}` : 'Teacher workspace'}
        {' · '}{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'My Classes', value: myClassIds.length > 0 ? myClassIds.length : allCsIds.length, icon: '🏫', color: 'bg-blue-50 text-blue-700' },
          { label: 'Attendance Pending', value: pendingClasses.length, icon: '✅', color: pendingClasses.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700' },
          { label: 'Homework Due Soon', value: (upcomingHW ?? []).length, icon: '📚', color: 'bg-purple-50 text-purple-700' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${card.color} mb-3`}>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attendance pending */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Attendance — Today</h2>
            <Link href="/admin/attendance" className="text-xs text-amber-600 hover:text-amber-700">Mark →</Link>
          </div>
          {(pendingAttendance ?? []).length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No classes assigned.</p>
          ) : (
            <div className="space-y-1.5">
              {(pendingAttendance ?? []).map((c: any) => {
                const done = submittedIds.has(c.id)
                return (
                  <div key={c.id} className="flex items-center justify-between py-1.5">
                    <p className="text-sm text-gray-700">{c.classes?.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${done ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {done ? '✓ Submitted' : 'Pending'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming homework */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Upcoming Homework</h2>
            <Link href="/admin/homework" className="text-xs text-amber-600 hover:text-amber-700">Manage →</Link>
          </div>
          {(upcomingHW ?? []).length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No upcoming homework.</p>
          ) : (
            <div className="space-y-2">
              {(upcomingHW ?? []).map((h: any) => (
                <div key={h.id} className="flex items-center justify-between py-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700 truncate">{h.title}</p>
                    <p className="text-xs text-gray-400">{h.class_sections?.classes?.name} · {h.subjects?.name ?? 'General'}</p>
                  </div>
                  <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                    {h.due_date ? new Date(h.due_date).toLocaleDateString('en-IN') : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent notices */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Recent Notices</h2>
          </div>
          {(recentNotices ?? []).length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No notices published.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {(recentNotices ?? []).map((n: any) => (
                <div key={n.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-base">📢</span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate">{n.title}</p>
                    {n.published_at && <p className="text-xs text-gray-400">{new Date(n.published_at).toLocaleDateString('en-IN')}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
