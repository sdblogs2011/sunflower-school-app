'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createHomework, deleteHomework } from './actions'

type ClassSection = { id: string; class_name: string }
type Subject = { id: string; name: string }
type HW = {
  id: string; title: string; description: string | null
  due_date: string | null; class_name: string; subject_name: string | null
  class_section_id: string; created_at: string
}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="px-5 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
      {pending ? 'Saving…' : 'Assign Homework'}
    </button>
  )
}

export default function HomeworkClient({
  classSections, subjects, homework,
}: { classSections: ClassSection[]; subjects: Subject[]; homework: HW[] }) {
  const [filterClass, setFilterClass] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide'

  const filtered = filterClass === 'all' ? homework : homework.filter(h => h.class_section_id === filterClass)

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setFilterClass('all')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors
              ${filterClass === 'all' ? 'bg-amber-400 text-gray-900' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            All Classes
          </button>
          {classSections.map(cs => (
            <button key={cs.id} onClick={() => setFilterClass(cs.id)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors
                ${filterClass === cs.id ? 'bg-amber-400 text-gray-900' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {cs.class_name}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
          {showForm ? '✕ Cancel' : '+ Assign Homework'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">New Homework Assignment</h2>
          <form action={async (fd) => { await createHomework(fd); setShowForm(false) }} className="space-y-4">
            <div>
              <label className={labelCls}>Title *</label>
              <input name="title" required className={inputCls} placeholder="e.g. Chapter 5 Exercise 1-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Class *</label>
                <select name="class_section_id" required className={inputCls}>
                  <option value="">Select class…</option>
                  {classSections.map(cs => <option key={cs.id} value={cs.id}>{cs.class_name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Subject</label>
                <select name="subject_id" className={inputCls}>
                  <option value="">All Subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Due Date</label>
                <input name="due_date" type="date" defaultValue={today} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description / Instructions</label>
              <textarea name="description" rows={3} className={inputCls} placeholder="Optional details…" />
            </div>
            <SubmitBtn />
          </form>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">No homework assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(h => {
            const overdue = h.due_date && h.due_date < today
            return (
              <div key={h.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{h.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium">{h.class_name}</span>
                      {h.subject_name && (
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{h.subject_name}</span>
                      )}
                      {h.due_date && (
                        <span className={`text-xs ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                          Due: {new Date(h.due_date).toLocaleDateString('en-IN')}
                          {overdue && ' (overdue)'}
                        </span>
                      )}
                    </div>
                    {h.description && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{h.description}</p>}
                  </div>
                  <form action={deleteHomework.bind(null, h.id)}>
                    <button type="submit"
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded"
                      onClick={e => { if (!confirm('Delete this homework?')) e.preventDefault() }}>
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
