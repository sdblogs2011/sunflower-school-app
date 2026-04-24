import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default async function AdminDashboard() {
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
    .from('academic_sessions').select('id, name')
    .eq('school_id', schoolId).eq('is_active', true).single()

  const { data: classSections } = await admin
    .from('class_sections').select('id').eq('school_id', schoolId)
  const csIds = (classSections ?? []).map((c: any) => c.id)

  const [
    { count: studentCount },
    { count: staffCount },
    { data: feeData },
    { data: attendanceSessions },
    { data: recentStudents },
    { data: recentPayments },
  ] = await Promise.all([
    admin.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    admin.from('staff').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
    admin.from('student_fee_accounts').select('total_amount, amount_paid, balance').eq('academic_session_id', session?.id ?? ''),
    csIds.length > 0
      ? admin.from('attendance_sessions').select('id, is_submitted').eq('attendance_date', today).in('class_section_id', csIds)
      : Promise.resolve({ data: [] }),
    admin.from('students').select('id, full_name, admission_number, created_at').eq('school_id', schoolId)
      .order('created_at', { ascending: false }).limit(5),
    admin.from('payment_records').select('id, amount, payment_date, students(full_name)')
      .order('created_at', { ascending: false }).limit(5),
  ])

  const totalBilled = (feeData ?? []).reduce((s: number, a: any) => s + Number(a.total_amount), 0)
  const totalPaid = (feeData ?? []).reduce((s: number, a: any) => s + Number(a.amount_paid), 0)
  const totalOutstanding = totalBilled - totalPaid
  const submittedCount = (attendanceSessions ?? []).filter((s: any) => s.is_submitted).length

  const quickLinks = [
    { label: 'Add Student', href: '/admin/students/new', icon: '➕' },
    { label: 'Mark Attendance', href: '/admin/attendance', icon: '✅' },
    { label: 'Record Payment', href: '/admin/fees', icon: '💳' },
    { label: 'New Notice', href: '/admin/notices/new', icon: '📢' },
    { label: 'Assign Homework', href: '/admin/homework', icon: '📚' },
    { label: 'New Exam', href: '/admin/exams', icon: '📝' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-0.5">Welcome, {profile.full_name?.split(' ')[0]}</h1>
      <p className="text-sm text-gray-400 mb-7">Admin workspace · {session?.name ?? ''}</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Students', value: studentCount ?? '—', icon: '🎓', color: 'bg-blue-50 text-blue-700', href: '/admin/students' },
          { label: 'Staff Members', value: staffCount ?? '—', icon: '👩‍🏫', color: 'bg-purple-50 text-purple-700', href: '/admin/staff' },
          { label: 'Attendance Today', value: csIds.length > 0 ? `${submittedCount}/${csIds.length}` : '—', icon: '✅', color: 'bg-green-50 text-green-700', href: '/admin/attendance' },
          { label: 'Fees Outstanding', value: totalBilled > 0 ? fmt(totalOutstanding) : '—', icon: '💰', color: 'bg-red-50 text-red-700', href: '/admin/fees' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick links */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-amber-50 hover:text-amber-700 text-sm text-gray-600 transition-colors">
                <span>{l.icon}</span> {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent students */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Recent Admissions</h2>
            <Link href="/admin/students" className="text-xs text-amber-600 hover:text-amber-700">View all →</Link>
          </div>
          {(recentStudents ?? []).length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No students yet.</p>
          ) : (
            <div className="space-y-2">
              {(recentStudents ?? []).map((s: any) => (
                <Link key={s.id} href={`/admin/students/${s.id}`}
                  className="flex items-center justify-between py-1.5 hover:bg-gray-50 -mx-1 px-1 rounded transition-colors">
                  <p className="text-sm text-gray-700">{s.full_name}</p>
                  <span className="text-xs font-mono text-gray-400">{s.admission_number}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Recent Payments</h2>
            <Link href="/admin/fees" className="text-xs text-amber-600 hover:text-amber-700">View all →</Link>
          </div>
          {(recentPayments ?? []).length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No payments yet.</p>
          ) : (
            <div className="space-y-2">
              {(recentPayments ?? []).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-sm text-gray-700">{p.students?.full_name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{new Date(p.payment_date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-700">{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
