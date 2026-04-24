'use client'

import { useRouter } from 'next/navigation'

type SubjectCol = { id: string; name: string; maxMarks: number }
type StudentRow = {
  studentId: string; name: string; rollNumber: number | null
  marks: Record<string, { obtained: number | null; absent: boolean }>
  total: number; maxTotal: number; percentage: number; rank: number
}

function downloadCSV(rows: StudentRow[], subjects: SubjectCol[], examName: string, className: string) {
  const subHeaders = subjects.flatMap(s => [`${s.name} (/${s.maxMarks})`, `${s.name} %`])
  const headers = ['Rank', 'Roll', 'Student Name', ...subHeaders, 'Total', 'Max', 'Overall %']
  const lines = rows.map(r => [
    r.rank, r.rollNumber ?? '', r.name,
    ...subjects.flatMap(s => {
      const m = r.marks[s.id]
      return m?.absent ? ['Absent', ''] : [m?.obtained ?? '', m?.obtained != null ? Math.round((m.obtained / s.maxMarks) * 100) : '']
    }),
    r.total, r.maxTotal, r.percentage,
  ])
  const csv = [headers, ...lines].map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = `marks_${examName}_${className}.csv`.replace(/\s+/g, '_'); a.click()
}

type Props = {
  rows: StudentRow[]; subjects: SubjectCol[]
  exams: { id: string; name: string }[]; classSections: { id: string; class_name: string }[]
  currentExam: string; currentClass: string; examName: string; className: string
}

export default function MarksReport({ rows, subjects, exams, classSections, currentExam, currentClass, examName, className }: Props) {
  const router = useRouter()

  function updateFilter(examId: string, classId: string) {
    router.push(`/admin/reports/marks?exam=${examId}&class=${classId}`)
  }

  const inputCls = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Exam</label>
          <select defaultValue={currentExam} onChange={e => updateFilter(e.target.value, currentClass)} className={inputCls}>
            <option value="">Select exam…</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Class</label>
          <select defaultValue={currentClass} onChange={e => updateFilter(currentExam, e.target.value)} className={inputCls}>
            <option value="">Select class…</option>
            {classSections.map(cs => <option key={cs.id} value={cs.id}>{cs.class_name}</option>)}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">Select an exam and class to view results.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-800">{examName} · {className}</p>
              <p className="text-xs text-gray-400">{rows.length} students · {subjects.length} subjects</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => downloadCSV(rows, subjects, examName, className)}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                Export CSV
              </button>
              <button onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-medium bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-lg transition-colors">
                Print
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-left sticky left-0 bg-gray-50">Rank</th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-left">Roll</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">Student</th>
                  {subjects.map(s => (
                    <th key={s.id} className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-center whitespace-nowrap">
                      {s.name}<br /><span className="normal-case text-gray-400 font-normal">/{s.maxMarks}</span>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-center">Total</th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-center">%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.studentId} className={`border-t border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="px-3 py-2.5 text-sm font-bold text-amber-600 sticky left-0">{r.rank}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-400">{r.rollNumber ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-800 whitespace-nowrap">{r.name}</td>
                    {subjects.map(s => {
                      const m = r.marks[s.id]
                      return (
                        <td key={s.id} className="px-3 py-2.5 text-sm text-center">
                          {m?.absent
                            ? <span className="text-xs text-red-500">AB</span>
                            : m?.obtained != null
                              ? <span className={m.obtained / s.maxMarks >= 0.5 ? 'text-green-700 font-medium' : 'text-red-600'}>{m.obtained}</span>
                              : <span className="text-gray-300">—</span>}
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5 text-sm font-semibold text-gray-800 text-center">{r.total}/{r.maxTotal}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                        ${r.percentage >= 75 ? 'bg-green-50 text-green-700' : r.percentage >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                        {r.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
