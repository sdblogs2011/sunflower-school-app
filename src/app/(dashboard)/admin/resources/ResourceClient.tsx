'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createResource, deleteResource } from './actions'

type ClassSection = { id: string; class_name: string }
type Subject = { id: string; name: string }
type Resource = {
  id: string; title: string; description: string | null
  file_url: string | null; resource_type: string | null
  class_name: string; subject_name: string | null
  class_section_id: string; created_at: string
}

const TYPE_BADGES: Record<string, string> = {
  pdf: 'bg-red-50 text-red-600',
  video: 'bg-purple-50 text-purple-600',
  link: 'bg-blue-50 text-blue-600',
  note: 'bg-yellow-50 text-yellow-700',
  image: 'bg-green-50 text-green-600',
}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="px-5 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
      {pending ? 'Saving…' : 'Add Resource'}
    </button>
  )
}

export default function ResourceClient({
  classSections, subjects, resources,
}: { classSections: ClassSection[]; subjects: Subject[]; resources: Resource[] }) {
  const [filterClass, setFilterClass] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide'

  const filtered = filterClass === 'all' ? resources : resources.filter(r => r.class_section_id === filterClass)

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
          {showForm ? '✕ Cancel' : '+ Add Resource'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Add New Resource</h2>
          <form action={async (fd) => { await createResource(fd); setShowForm(false) }} className="space-y-4">
            <div>
              <label className={labelCls}>Title *</label>
              <input name="title" required className={inputCls} placeholder="e.g. Chapter 3 Notes — Photosynthesis" />
            </div>
            <div className="grid grid-cols-3 gap-4">
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
              <div>
                <label className={labelCls}>Type</label>
                <select name="resource_type" className={inputCls}>
                  <option value="link">Link</option>
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                  <option value="note">Note</option>
                  <option value="image">Image</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>URL / Link</label>
              <input name="file_url" type="url" className={inputCls} placeholder="https://…" />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea name="description" rows={2} className={inputCls} placeholder="Optional notes…" />
            </div>
            <SubmitBtn />
          </form>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">No resources added yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {r.file_url ? (
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-blue-700 hover:underline truncate">
                        {r.title}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
                    )}
                    {r.resource_type && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_BADGES[r.resource_type] ?? 'bg-gray-100 text-gray-500'}`}>
                        {r.resource_type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium">{r.class_name}</span>
                    {r.subject_name && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{r.subject_name}</span>
                    )}
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  {r.description && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{r.description}</p>}
                </div>
                <form action={deleteResource.bind(null, r.id)}>
                  <button type="submit"
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded"
                    onClick={e => { if (!confirm('Delete this resource?')) e.preventDefault() }}>
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
