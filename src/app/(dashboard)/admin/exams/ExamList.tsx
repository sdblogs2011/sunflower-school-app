'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createExam, deleteExam } from './actions'

type Exam = {
  id: string; name: string; exam_type: string | null
  start_date: string | null; end_date: string | null; subject_count: number
}

const TYPE_LABELS: Record<string, string> = {
  unit_test: 'Unit Test',
  half_yearly: 'Half Yearly',
  annual: 'Annual',
  terminal: 'Terminal',
  mock: 'Mock Test',
}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="px-5 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
      {pending ? 'Creating…' : 'Create Exam'}
    </button>
  )
}

export default function ExamList({ exams }: { exams: Exam[] }) {
  const [showForm, setShowForm] = useState(false)
  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide'

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
          {showForm ? '✕ Cancel' : '+ New Exam'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Create New Exam</h2>
          <form action={createExam} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Exam Name *</label>
                <input name="name" required className={inputCls} placeholder="e.g. Unit Test 1" />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select name="exam_type" className={inputCls}>
                  <option value="">Select type…</option>
                  <option value="unit_test">Unit Test</option>
                  <option value="half_yearly">Half Yearly</option>
                  <option value="terminal">Terminal</option>
                  <option value="annual">Annual</option>
                  <option value="mock">Mock Test</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Start Date</label>
                <input name="start_date" type="date" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <input name="end_date" type="date" className={inputCls} />
              </div>
            </div>
            <SubmitBtn />
          </form>
        </div>
      )}

      {exams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">No exams created yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exams.map(e => (
            <div key={e.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center justify-between">
              <Link href={`/admin/exams/${e.id}`} className="flex-1 min-w-0 group">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">{e.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {e.exam_type && (
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{TYPE_LABELS[e.exam_type] ?? e.exam_type}</span>
                  )}
                  {e.start_date && (
                    <span className="text-xs text-gray-400">
                      {new Date(e.start_date).toLocaleDateString('en-IN')}
                      {e.end_date && ` – ${new Date(e.end_date).toLocaleDateString('en-IN')}`}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{e.subject_count} subject{e.subject_count !== 1 ? 's' : ''} added</span>
                </div>
              </Link>
              <form action={deleteExam.bind(null, e.id)}>
                <button type="submit"
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 ml-3"
                  onClick={ev => { if (!confirm('Delete this exam and all marks?')) ev.preventDefault() }}>
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
