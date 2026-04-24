import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const REPORTS = [
  {
    href: '/admin/reports/attendance',
    icon: '✅',
    title: 'Attendance Report',
    desc: 'Student-wise attendance summary for any class and date range.',
    color: 'bg-green-50 text-green-700',
  },
  {
    href: '/admin/reports/fees',
    icon: '💰',
    title: 'Fee Collection Report',
    desc: 'Outstanding balances and payment status across all students.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    href: '/admin/reports/marks',
    icon: '📝',
    title: 'Exam Marks Report',
    desc: 'Class-wise results for any exam with subject-wise breakdown.',
    color: 'bg-blue-50 text-blue-700',
  },
]

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
      <p className="text-sm text-gray-400 mb-8">Generate, print, and export school data reports.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {REPORTS.map(r => (
          <Link key={r.href} href={r.href}
            className="bg-white rounded-xl border border-gray-100 p-6 hover:border-amber-300 hover:shadow-sm transition-all group">
            <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${r.color} mb-4`}>
              <span className="text-2xl">{r.icon}</span>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">{r.title}</h2>
            <p className="text-sm text-gray-500">{r.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
