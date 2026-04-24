import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FeeReport from './FeeReport'

export default async function FeeReportPage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id
  const selectedClass = sp.class ?? ''

  const { data: session } = await admin
    .from('academic_sessions').select('id')
    .eq('school_id', schoolId).eq('is_active', true).single()

  const { data: classSections } = await admin
    .from('class_sections').select('id, classes(name)')
    .eq('school_id', schoolId).eq('academic_session_id', session?.id ?? '')

  const csList = (classSections ?? []).map((cs: any) => ({ id: cs.id, class_name: cs.classes?.name ?? '' }))

  // Get all fee accounts for session, with joins
  const query = admin
    .from('student_fee_accounts')
    .select(`
      student_id, total_amount, amount_paid, balance,
      fee_structures(name, applicable_class_id, classes(name)),
      students(full_name, admission_number)
    `)
    .eq('academic_session_id', session?.id ?? '')
    .order('students(full_name)')

  // If class filter: get student IDs enrolled in that class
  let filteredStudentIds: string[] | null = null
  if (selectedClass) {
    const { data: enr } = await admin
      .from('student_enrollments').select('student_id')
      .eq('class_section_id', selectedClass).eq('academic_session_id', session?.id ?? '')
    filteredStudentIds = (enr ?? []).map((e: any) => e.student_id)
  }

  const { data: accounts } = await query

  const rows = (accounts ?? [])
    .filter((a: any) => !filteredStudentIds || filteredStudentIds.includes(a.student_id))
    .map((a: any) => ({
      studentId: a.student_id,
      name: a.students?.full_name ?? '',
      admissionNumber: a.students?.admission_number ?? '',
      className: a.fee_structures?.classes?.name ?? '—',
      structureName: a.fee_structures?.name ?? '—',
      totalAmount: Number(a.total_amount),
      amountPaid: Number(a.amount_paid),
      balance: Number(a.balance),
    }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name))

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/reports" className="text-sm text-gray-500 hover:text-gray-700">← Reports</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Fee Collection Report</h1>
      </div>
      <FeeReport rows={rows} classSections={csList} currentClass={selectedClass} />
    </div>
  )
}
