import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default async function ParentDashboard() {
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

  const { data: parentRecord } = await admin
    .from('parents').select('id').eq('user_id', user.id).eq('school_id', schoolId).single()

  let linkedStudents: any[] = []
  if (parentRecord) {
    const { data } = await admin.from('parent_student_links')
      .select('student_id, relation, students(id, full_name, admission_number)')
      .eq('parent_id', parentRecord.id)
    linkedStudents = data ?? []
  }

  const students = linkedStudents.map((l: any) => ({
    id: l.students?.id, name: l.students?.full_name, admission: l.students?.admission_number, relation: l.relation,
  })).filter((s: any) => s.id)

  const studentIds = students.map(s => s.id)

  const [
    { data: enrollments },
    { data: feeAccounts },
    { data: recentAttendance },
    { data: recentNotices },
    { data: upcomingHW },
  ] = await Promise.all([
    studentIds.length > 0
      ? admin.from('student_enrollments')
          .select('student_id, class_section_id, class_sections(classes(name))')
          .in('student_id', studentIds).eq('academic_session_id', session?.id ?? '')
      : Promise.resolve({ data: [] }),
    studentIds.length > 0
      ? admin.from('student_fee_accounts')
          .select('student_id, balance, total_amount, amount_paid, fee_structures(name)')
          .in('student_id', studentIds).eq('academic_session_id', session?.id ?? '')
      : Promise.resolve({ data: [] }),
    studentIds.length > 0
      ? admin.from('attendance_records')
          .select('student_id, status, attendance_sessions(attendance_date)')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false }).limit(30)
      : Promise.resolve({ data: [] }),
    admin.from('notices')
      .select('id, title, body, published_at')
      .eq('school_id', schoolId).eq('publish_status', 'published')
      .order('published_at', { ascending: false }).limit(4),
    studentIds.length > 0
      ? (async () => {
          const enrData = await admin.from('student_enrollments')
            .select('class_section_id').in('student_id', studentIds).eq('academic_session_id', session?.id ?? '')
          const csIds = [...new Set((enrData.data ?? []).map((e: any) => e.class_section_id))]
          return csIds.length > 0
            ? admin.from('homework').select('id, title, due_date, class_sections(classes(name)), subjects(name)')
                .in('class_section_id', csIds).gte('due_date', today).order('due_date').limit(5)
            : Promise.resolve({ data: [] })
        })()
      : Promise.resolve({ data: [] }),
  ])

  const enrollMap = new Map((enrollments ?? []).map((e: any) => [e.student_id, { csId: e.class_section_id, className: e.class_sections?.classes?.name ?? '' }]))
  const feeMap = new Map<string, any[]>()
  for (const f of (feeAccounts ?? [])) {
    const sid = (f as any).student_id
    if (!feeMap.has(sid)) feeMap.set(sid, [])
    feeMap.get(sid)!.push(f)
  }
  const todayAttMap = new Map<string, string>()
  for (const r of (recentAttendance ?? [])) {
    const date = (r as any).attendance_sessions?.attendance_date
    if (date === today && !todayAttMap.has((r as any).student_id)) {
      todayAttMap.set((r as any).student_id, (r as any).status)
    }
  }

  const statusColor: Record<string, string> = {
    present: 'bg-green-50 text-green-700',
    absent: 'bg-red-50 text-red-600',
    late: 'bg-amber-50 text-amber-700',
    excused: 'bg-blue-50 text-blue-600',
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-0.5">{greeting}, {profile.full_name?.split(' ')[0]}</h1>
      <p className="text-sm text-gray-400 mb-7">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-base font-medium text-gray-600 mb-1">No students linked to your account</p>
          <p className="text-sm text-gray-400">Please contact the school admin to link your child's account.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {students.map(s => {
            const fees = feeMap.get(s.id) ?? []
            const totalOutstanding = fees.reduce((sum: number, f: any) => sum + Number(f.balance), 0)
            const todayStatus = todayAttMap.get(s.id)
            const enr = enrollMap.get(s.id)
            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-base font-bold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{enr?.className ?? '—'} · {s.admission} · {s.relation}</p>
                  </div>
                  {todayStatus ? (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor[todayStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                      Today: {todayStatus}
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">Not marked yet</span>
                  )}
                </div>
                {fees.length > 0 && (
                  <div className="border-t border-gray-50 pt-3 space-y-1.5">
                    {fees.map((f: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{f.fee_structures?.name ?? 'Fee'}</span>
                        <span className={`font-medium ${Number(f.balance) > 0 ? 'text-red-600' : 'text-green-700'}`}>
                          {Number(f.balance) > 0 ? `${fmt(Number(f.balance))} due` : '✓ Paid'}
                        </span>
                      </div>
                    ))}
                    {totalOutstanding > 0 && (
                      <p className="text-xs text-red-500 mt-1 font-medium">Total: {fmt(totalOutstanding)} outstanding</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Upcoming homework */}
          {(upcomingHW as any[])?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Upcoming Homework</h2>
              <div className="space-y-2">
                {(upcomingHW as any[]).map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm text-gray-700">{h.title}</p>
                      <p className="text-xs text-gray-400">{h.subjects?.name ?? 'General'}</p>
                    </div>
                    <span className="text-xs text-gray-400 ml-3">{new Date(h.due_date).toLocaleDateString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
