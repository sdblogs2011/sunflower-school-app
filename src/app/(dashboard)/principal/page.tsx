import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default async function PrincipalDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('full_name, school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id
  const today = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const { data: session } = await admin
    .from('academic_sessions').select('id, name')
    .eq('school_id', schoolId).eq('is_active', true).single()

  const { data: classSections } = await admin
    .from('class_sections').select('id').eq('school_id', schoolId)
  const csIds = (classSections ?? []).map((c: any) => c.id)

  const [
    { count: studentCount },
    { count: staffCount },
    { count: noticeCount },
    { data: feeData },
    { data: attendanceSessions },
    { data: recentNotices },
    { data: upcomingHW },
  ] = await Promise.all([
    admin.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    admin.from('staff').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
    admin.from('notices').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('publish_status', 'published'),
    admin.from('student_fee_accounts').select('total_amount, amount_paid, balance').eq('academic_session_id', session?.id ?? ''),
    csIds.length > 0
      ? admin.from('attendance_sessions').select('id, is_submitted').eq('attendance_date', today).in('class_section_id', csIds)
      : Promise.resolve({ data: [] }),
    admin.from('notices').select('id, title, publish_status, published_at').eq('school_id', schoolId)
      .order('created_at', { ascending: false }).limit(5),
    csIds.length > 0
      ? admin.from('homework').select('id, title, due_date, class_section_id, subjects(name), class_sections(classes(name))')
          .in('class_section_id', csIds).gte('due_date', today).order('due_date').limit(5)
      : Promise.resolve({ data: [] }),
  ])

  const totalBilled = (feeData ?? []).reduce((s: number, a: any) => s + Number(a.total_amount), 0)
  const totalPaid = (feeData ?? []).reduce((s: number, a: any) => s + Number(a.amount_paid), 0)
  const totalOutstanding = totalBilled - totalPaid

  const sessionIds = (attendanceSessions ?? []).map((s: any) => s.id)
  let presentCount = 0
  if (sessionIds.length > 0) {
    const { count } = await admin.from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .in('attendance_session_id', sessionIds).eq('status', 'present')
    presentCount = count ?? 0
  }
  const submittedCount = (attendanceSessions ?? []).filter((s: any) => s.is_submitted).length

  const statusBadge: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-500',
    published: 'bg-green-50 text-green-700',
    archived: 'bg-red-50 text-red-500',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-0.5">{greeting}, {profile.full_name?.split(' ')[0]}</h1>
      <p className="text-sm text-gray-400 mb-7">School overview for {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Students', value: studentCount ?? '—', icon: '🎓', color: 'bg-blue-50 text-blue-700', href: '/admin/students' },
          { label: 'Staff Members', value: staffCount ?? '—', icon: '👩‍🏫', color: 'bg-purple-50 text-purple-700', href: '/admin/staff' },
          { label: 'Classes Marked Today', value: csIds.length > 0 ? `${submittedCount}/${csIds.length}` : '—', icon: '✅', color: 'bg-green-50 text-green-700', href: '/admin/attendance' },
          { label: 'Fees Outstanding', value: totalBilled > 0 ? fmt(totalOutstanding) : '—', icon: '💰', color: 'bg-amber-50 text-amber-700', href: '/admin/fees' },
        ].map(card => (
          <Link key={card.label} href={card.href}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:border-amber-300 transition-colors">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${card.color} mb-3`}>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Notices */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Recent Notices</h2>
            <Link href="/admin/notices" className="text-xs text-amber-600 hover:text-amber-700">View all →</Link>
          </div>
          {(recentNotices ?? []).length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No notices yet.</p>
          ) : (
            <div className="space-y-2">
              {(recentNotices ?? []).map((n: any) => (
                <Link key={n.id} href={`/admin/notices/${n.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-1 px-1 rounded transition-colors">
                  <p className="text-sm text-gray-700 truncate flex-1">{n.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-2 capitalize ${statusBadge[n.publish_status]}`}>{n.publish_status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Homework + Fee Summary */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Upcoming Homework</h2>
              <Link href="/admin/homework" className="text-xs text-amber-600 hover:text-amber-700">View all →</Link>
            </div>
            {(upcomingHW ?? []).length === 0 ? (
              <p className="text-xs text-gray-400 py-2 text-center">No upcoming homework.</p>
            ) : (
              <div className="space-y-2">
                {(upcomingHW ?? []).map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700 truncate">{h.title}</p>
                      <p className="text-xs text-gray-400">{(h as any).class_sections?.classes?.name} · {(h as any).subjects?.name ?? 'General'}</p>
                    </div>
                    <span className="text-xs text-gray-400 ml-3 whitespace-nowrap">
                      {h.due_date ? new Date(h.due_date).toLocaleDateString('en-IN') : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalBilled > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Fee Collection</h2>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, Math.round((totalPaid / totalBilled) * 100))}%` }} />
                </div>
                <span className="text-xs text-gray-500">{Math.round((totalPaid / totalBilled) * 100)}%</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Collected: <span className="text-green-700 font-medium">{fmt(totalPaid)}</span></span>
                <span>Outstanding: <span className="text-red-600 font-medium">{fmt(totalOutstanding)}</span></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
