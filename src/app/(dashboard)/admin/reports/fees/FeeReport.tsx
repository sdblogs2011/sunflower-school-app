'use client'

import { useRouter } from 'next/navigation'

type Row = {
  studentId: string; name: string; admissionNumber: string; className: string
  structureName: string; totalAmount: number; amountPaid: number; balance: number
}

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

function downloadCSV(rows: Row[]) {
  const headers = ['Student Name', 'Admission No', 'Class', 'Fee Structure', 'Total (₹)', 'Paid (₹)', 'Balance (₹)', 'Status']
  const lines = rows.map(r => [
    r.name, r.admissionNumber, r.className, r.structureName,
    r.totalAmount, r.amountPaid, r.balance,
    r.balance === 0 ? 'Paid' : r.amountPaid > 0 ? 'Partial' : 'Unpaid',
  ])
  const csv = [headers, ...lines].map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = 'fee_report.csv'; a.click()
}

type Props = {
  rows: Row[]; classSections: { id: string; class_name: string }[]
  currentClass: string
}

export default function FeeReport({ rows, classSections, currentClass }: Props) {
  const router = useRouter()

  const totalBilled = rows.reduce((s, r) => s + r.totalAmount, 0)
  const totalPaid = rows.reduce((s, r) => s + r.amountPaid, 0)
  const totalBalance = rows.reduce((s, r) => s + r.balance, 0)
  const paidCount = rows.filter(r => r.balance === 0).length
  const unpaidCount = rows.filter(r => r.amountPaid === 0 && r.balance > 0).length
  const partialCount = rows.filter(r => r.amountPaid > 0 && r.balance > 0).length

  const inputCls = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Filter by Class</label>
          <select defaultValue={currentClass} onChange={e => router.push(`/admin/reports/fees?class=${e.target.value}`)} className={inputCls}>
            <option value="">All Classes</option>
            {classSections.map(cs => <option key={cs.id} value={cs.id}>{cs.class_name}</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Billed', value: fmt(totalBilled), color: 'text-gray-900' },
            { label: 'Collected', value: fmt(totalPaid), color: 'text-green-700' },
            { label: 'Outstanding', value: fmt(totalBalance), color: 'text-red-600' },
            { label: 'Collection %', value: totalBilled > 0 ? `${Math.round((totalPaid / totalBilled) * 100)}%` : '—', color: 'text-amber-700' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">No fee data found for the current session.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <p className="text-xs text-gray-500">
              {rows.length} records · Paid: {paidCount} · Partial: {partialCount} · Unpaid: {unpaidCount}
            </p>
            <div className="flex gap-2">
              <button onClick={() => downloadCSV(rows)}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                Export CSV
              </button>
              <button onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-medium bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-lg transition-colors">
                Print
              </button>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Student', 'Adm. No', 'Class', 'Fee Structure', 'Total', 'Paid', 'Balance', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const status = r.balance === 0 ? 'Paid' : r.amountPaid > 0 ? 'Partial' : 'Unpaid'
                const statusCls = { Paid: 'bg-green-50 text-green-700', Partial: 'bg-amber-50 text-amber-700', Unpaid: 'bg-red-50 text-red-600' }[status]
                return (
                  <tr key={`${r.studentId}-${r.structureName}`} className={`border-t border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{r.name}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-400">{r.admissionNumber}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{r.className}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{r.structureName}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700">{fmt(r.totalAmount)}</td>
                    <td className="px-4 py-2.5 text-sm text-green-700 font-medium">{fmt(r.amountPaid)}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-red-600">{r.balance > 0 ? fmt(r.balance) : '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCls}`}>{status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <td className="px-4 py-2.5 text-sm text-gray-600" colSpan={4}>Total</td>
                <td className="px-4 py-2.5 text-sm text-gray-700">{fmt(totalBilled)}</td>
                <td className="px-4 py-2.5 text-sm text-green-700">{fmt(totalPaid)}</td>
                <td className="px-4 py-2.5 text-sm text-red-600">{fmt(totalBalance)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
