'use client'

import { useFormStatus } from 'react-dom'
import { saveMarks } from '../../../actions'

type Student = { id: string; full_name: string; roll_number: number | null }
type ExistingMark = { student_id: string; marks_obtained: number | null; is_absent: boolean }

function SaveBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="px-6 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
      {pending ? 'Saving…' : 'Save All Marks'}
    </button>
  )
}

export default function MarksEntry({
  examSubjectId, students, existingMarks, maxMarks, passMarks,
}: {
  examSubjectId: string
  students: Student[]
  existingMarks: ExistingMark[]
  maxMarks: number
  passMarks: number | null
}) {
  const marksMap = new Map(existingMarks.map(m => [m.student_id, m]))
  const inputCls = 'w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400'

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
      <form action={saveMarks.bind(null, examSubjectId)}>
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase text-left w-10">Roll</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase text-left">Student Name</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase text-center">
                Marks <span className="normal-case text-gray-400">(out of {maxMarks}{passMarks ? `, pass ${passMarks}` : ''})</span>
              </th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase text-center">Absent</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const existing = marksMap.get(s.id)
              return (
                <tr key={s.id} className={`border-t border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                  <td className="px-5 py-3 text-sm text-gray-400">{s.roll_number ?? '—'}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{s.full_name}</td>
                  <td className="px-5 py-3 text-center">
                    <input
                      name={`marks_${s.id}`}
                      type="number"
                      min={0}
                      max={maxMarks}
                      step="0.5"
                      defaultValue={existing?.marks_obtained ?? ''}
                      className={inputCls}
                      placeholder="—"
                    />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <input
                      name={`absent_${s.id}`}
                      type="checkbox"
                      defaultChecked={existing?.is_absent ?? false}
                      className="w-4 h-4 accent-amber-400"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">{students.length} students · Mark absent overrides marks</p>
          <SaveBtn />
        </div>
      </form>
    </div>
  )
}
