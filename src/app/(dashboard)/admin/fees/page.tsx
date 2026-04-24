import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FeesOverview from './FeesOverview'

export default async function FeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id

  const { data: session } = await admin
    .from('academic_sessions').select('id, name')
    .eq('school_id', schoolId).eq('is_active', true).single()

  // Aggregate fee stats
  const { data: accounts } = await admin
    .from('student_fee_accounts')
    .select('total_amount, amount_paid, student_id, fee_structures(name), students(full_name, admission_number)')
    .eq('academic_session_id', session?.id ?? '')

  const totalDue = (accounts ?? []).reduce((sum, a: any) => sum + Number(a.total_amount), 0)
  const totalCollected = (accounts ?? []).reduce((sum, a: any) => sum + Number(a.amount_paid), 0)
  const totalPending = totalDue - totalCollected
  const studentsWithDues = new Set((accounts ?? []).filter((a: any) => Number(a.total_amount) - Number(a.amount_paid) > 0).map((a: any) => a.student_id)).size

  // Recent payments
  const { data: recentPayments } = await admin
    .from('payment_records')
    .select('id, amount, payment_date, payment_mode, receipt_number, students(full_name, admission_number)')
    .order('created_at', { ascending: false })
    .limit(10)

  // Student dues list
  const studentDues = Object.values(
    (accounts ?? []).reduce((acc: any, a: any) => {
      const sid = a.student_id
      if (!acc[sid]) acc[sid] = { student_id: sid, full_name: a.students?.full_name, admission_number: a.students?.admission_number, total: 0, paid: 0 }
      acc[sid].total += Number(a.total_amount)
      acc[sid].paid += Number(a.amount_paid)
      return acc
    }, {})
  ).map((s: any) => ({ ...s, balance: s.total - s.paid }))
    .filter((s: any) => s.balance > 0)
    .sort((a: any, b: any) => b.balance - a.balance)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees</h1>
          <p className="text-sm text-gray-500 mt-0.5">Session: <span className="font-medium text-gray-700">{session?.name}</span></p>
        </div>
        <Link href="/admin/fees/structures" className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
          Fee Structures
        </Link>
      </div>

      <FeesOverview
        totalDue={totalDue}
        totalCollected={totalCollected}
        totalPending={totalPending}
        studentsWithDues={studentsWithDues}
        studentDues={studentDues as any}
        recentPayments={(recentPayments ?? []) as any}
      />
    </div>
  )
}
