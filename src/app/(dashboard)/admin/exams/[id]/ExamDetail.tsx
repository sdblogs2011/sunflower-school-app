'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { addExamSubject, deleteExamSubject } from '../actions'

type ClassSection = { id: string; class_name: string }
type Subject = { id: string; name: string }
type ExamSubject = {
  id: string; class_name: string; subject_name: string
  exam_date: string | null; max_marks: number; pass_marks: number | null
  marks_count: number; exam_id: string
}

function AddBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="px-4 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
      {pending ? 'Adding…' : 'Add'}
    </button>
  )
}

export default function ExamDetail({
  examId, examSubjects, classSections, subjects,
}: { examId: string; examSubjects: ExamSubject[]; classSections: ClassSection[]; subjects: Subject[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide'

  return (
    <div className="space-y-4">
      {/* Add subject row */}
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
          {showAdd ? '✕ Cancel' : '+ Add Class × Subject'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <form action={async (fd) => { await addExamSubject(examId, fd); setShowAdd(false) }}
            className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Class *</label>
              <select name="class_section_id" required className={inputCls}>
                <option value="">Select class…</option>
                {classSections.map(cs => <option key={cs.id} value={cs.id}>{cs.class_name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Subject *</label>
              <select name="subject_id" required className={inputCls}>
                <option value="">Select subject…</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Exam Date</label>
              <input name="exam_date" type="date" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Max Marks</label>
                <input name="max_marks" type="number" defaultValue={100} min={1} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Pass Marks</label>
                <input name="pass_marks" type="number" min={0} className={inputCls} placeholder="e.g. 33" />
              </div>
            </div>
            <div className="col-span-2 flex justify-end">
              <AddBtn />
            </div>
          </form>
        </div>
      )}

      {examSubjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">No subjects added yet. Add a class × subject combination to start entering marks.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Class', 'Subject', 'Date', 'Max', 'Pass', 'Marks Entered', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {examSubjects.map(es => (
                <tr key={es.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{es.class_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{es.subject_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {es.exam_date ? new Date(es.exam_date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{es.max_marks}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{es.pass_marks ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${es.marks_count > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {es.marks_count > 0 ? `${es.marks_count} entered` : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/exams/${es.exam_id}/marks/${es.id}`}
                        className="text-xs font-medium px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors">
                        {es.marks_count > 0 ? 'Edit Marks' : 'Enter Marks'}
                      </Link>
                      <form action={deleteExamSubject.bind(null, es.id, es.exam_id)}>
                        <button type="submit"
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors px-1"
                          onClick={ev => { if (!confirm('Remove this subject? All marks will be deleted.')) ev.preventDefault() }}>
                          ✕
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
