'use client'

import { useRouter } from 'next/navigation'

type Row = {
  studentId: string; name: string; rollNumber: number | null
  present: number; absent: number; late: number; excused: number; total: number
}

function downloadCSV(rows: Row[], className: string, dateFrom: string, dateTo: string) {
  const headers = ['Roll', 'Student Name', 'Present', 'Absent', 'Late', 'Excused', 'Total Days', 'Attendance %']
  const lines = rows.map(r => [
    r.rollNumber ?? '',
    r.name,
    r.present, r.absent, r.late, r.excused, r.total,
    r.total > 0 ? Math.round((r.present / r.total) * 100) : 0,
  ])
  const csv = [headers, ...lines].map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `attendance_${className}_${dateFrom}_${dateTo}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

type Props = {
  rows: Row[]; classSections: { id: string; class_name: string }[]
  currentClass: string; dateFrom: string; dateTo: string; className: string
}

export default function AttendanceReport({ rows, classSections, currentClass, dateFrom, dateTo, className }: Props) {
  const router = useRouter()

  function applyFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const params = new URLSearchParams({
      class: fd.get('class') as string,
      from: fd.get('from') as string,
      to: fd.get('to') as string,
    })
    router.push(`/admin/reports/attendance?${params}`)
  }

  const inputCls = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'

  return (
    <div className="space-y-5">
      {/* Filters */}
      <form onSubmit={applyFilter} className="bg-white rounded-xl border border-gray-100 p-5 flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Class</label>
          <select name="class" defaultValue={currentClass} className={inputCls}>
            <option value="">Select class…</option>
            {classSections.map(cs => (
              <option key={cs.id} value={cs.id}>{cs.class_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">From</label>
          <input name="from" type="date" defaultValue={dateFrom} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">To</label>
          <input name="to" type="date" defaultValue={dateTo} className={inputCls} />
        </div>
        <button type="submit" className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
          Generate
        </button>
      </form>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">Select a class and date range to generate the report.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-800">{className}</p>
              <p className="text-xs text-gray-400">{dateFrom} to {dateTo} · {rows.length} students</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => downloadCSV(rows, className, dateFrom, dateTo)}
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
                {['Roll', 'Student Name', 'Present', 'Absent', 'Late', 'Excused', 'Total', '%'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const pct = r.total > 0 ? Math.round((r.present / r.total) * 100) : 0
                return (
                  <tr key={r.studentId} className={`border-t border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="px-4 py-2.5 text-sm text-gray-400">{r.rollNumber ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{r.name}</td>
                    <td className="px-4 py-2.5 text-sm text-green-700 font-medium">{r.present}</td>
                    <td className="px-4 py-2.5 text-sm text-red-600">{r.absent}</td>
                    <td className="px-4 py-2.5 text-sm text-amber-600">{r.late}</td>
                    <td className="px-4 py-2.5 text-sm text-blue-600">{r.excused}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{r.total}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                        ${pct >= 75 ? 'bg-green-50 text-green-700' : pct >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <td className="px-4 py-2.5 text-sm text-gray-600" colSpan={2}>Total</td>
                <td className="px-4 py-2.5 text-sm text-green-700">{rows.reduce((s, r) => s + r.present, 0)}</td>
                <td className="px-4 py-2.5 text-sm text-red-600">{rows.reduce((s, r) => s + r.absent, 0)}</td>
                <td className="px-4 py-2.5 text-sm text-amber-600">{rows.reduce((s, r) => s + r.late, 0)}</td>
                <td className="px-4 py-2.5 text-sm text-blue-600">{rows.reduce((s, r) => s + r.excused, 0)}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{rows.reduce((s, r) => s + r.total, 0)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
