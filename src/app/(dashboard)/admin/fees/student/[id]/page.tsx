import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StudentFees from './StudentFees'

export default async function StudentFeesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id

  const [{ data: student }, { data: session }] = await Promise.all([
    admin.from('students').select('id, full_name, admission_number').eq('id', studentId).eq('school_id', schoolId).single(),
    admin.from('academic_sessions').select('id').eq('school_id', schoolId).eq('is_active', true).single(),
  ])
  if (!student) notFound()

  const { data: accounts } = await admin
    .from('student_fee_accounts')
    .select('id, total_amount, amount_paid, balance, fee_structures(id, name, due_date)')
    .eq('student_id', studentId)
    .eq('academic_session_id', session?.id ?? '')

  const { data: payments } = await admin
    .from('payment_records')
    .select('id, amount, payment_date, payment_mode, reference_number, receipt_number, remarks, student_fee_account_id')
    .eq('student_id', studentId)
    .order('payment_date', { ascending: false })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/fees" className="text-sm text-gray-500 hover:text-gray-700">← Fees</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{student.full_name}</h1>
        <span className="text-sm font-mono text-gray-400">{student.admission_number}</span>
      </div>

      <StudentFees
        studentId={studentId}
        accounts={(accounts ?? []) as any}
        payments={(payments ?? []) as any}
      />
    </div>
  )
}
