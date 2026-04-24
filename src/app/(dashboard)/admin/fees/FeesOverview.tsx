'use client'

import { useState } from 'react'
import Link from 'next/link'

type StudentDue = { student_id: string; full_name: string; admission_number: string; total: number; paid: number; balance: number }
type Payment = { id: string; amount: number; payment_date: string; payment_mode: string; receipt_number: string; students: { full_name: string; admission_number: string } | null }

interface Props {
  totalDue: number; totalCollected: number; totalPending: number; studentsWithDues: number
  studentDues: StudentDue[]; recentPayments: Payment[]
}

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`

export default function FeesOverview({ totalDue, totalCollected, totalPending, studentsWithDues, studentDues, recentPayments }: Props) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'dues' | 'payments'>('dues')

  const filtered = studentDues.filter(s =>
    !search || s.full_name.toLowerCase().includes(search.toLowerCase()) || s.admission_number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Billed', value: fmt(totalDue), color: 'bg-blue-50 text-blue-700' },
          { label: 'Collected', value: fmt(totalCollected), color: 'bg-green-50 text-green-700' },
          { label: 'Pending', value: fmt(totalPending), color: 'bg-red-50 text-red-700' },
          { label: 'Students with Dues', value: studentsWithDues.toString(), color: 'bg-amber-50 text-amber-700' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className={`text-xs font-medium mb-1 ${card.color.split(' ')[1]}`}>{card.label}</p>
            <p className={`text-2xl font-bold ${card.color.split(' ')[1]}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex border-b border-gray-100 px-4">
          {([['dues', 'Students with Dues'], ['payments', 'Recent Payments']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-amber-400 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === 'dues' && (
            <>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search student by name or admission no."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">{search ? 'No students found.' : 'No pending dues.'}</p>
              ) : (
                <table className="w-full">
                  <thead><tr className="border-b border-gray-100">
                    {['Student', 'Adm. No', 'Total Billed', 'Paid', 'Balance', ''].map((h, i) => (
                      <th key={h} className={`pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered.map(s => (
                      <tr key={s.student_id} className="border-t border-gray-50 hover:bg-amber-50/30">
                        <td className="py-3 text-sm font-medium text-gray-900">{s.full_name}</td>
                        <td className="py-3 text-sm font-mono text-gray-500">{s.admission_number}</td>
                        <td className="py-3 text-sm text-gray-600">{fmt(s.total)}</td>
                        <td className="py-3 text-sm text-green-700">{fmt(s.paid)}</td>
                        <td className="py-3 text-sm font-semibold text-red-600">{fmt(s.balance)}</td>
                        <td className="py-3 text-right">
                          <Link href={`/admin/fees/student/${s.student_id}`} className="text-xs text-amber-600 hover:text-amber-800 font-medium">Pay →</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {tab === 'payments' && (
            recentPayments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No payments recorded yet.</p>
            ) : (
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  {['Student', 'Amount', 'Date', 'Mode', 'Receipt'].map(h => (
                    <th key={h} className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-left">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {recentPayments.map(p => (
                    <tr key={p.id} className="border-t border-gray-50">
                      <td className="py-3 text-sm font-medium text-gray-900">{p.students?.full_name ?? '—'}</td>
                      <td className="py-3 text-sm font-semibold text-green-700">{fmt(p.amount)}</td>
                      <td className="py-3 text-sm text-gray-600">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 text-sm text-gray-500 capitalize">{p.payment_mode}</td>
                      <td className="py-3 text-xs font-mono text-gray-400">{p.receipt_number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  )
}
