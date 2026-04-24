'use client'

import { useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import {
  addClass, deleteClass,
  addSection, deleteSection,
  addSubject, deleteSubject,
  addClassSection, deleteClassSection,
} from './actions'

type ClassItem = { id: string; name: string; order_rank: number }
type SectionItem = { id: string; name: string }
type SubjectItem = { id: string; name: string; code: string | null }
type ClassSectionItem = {
  id: string
  class_id: string
  section_id: string
  classes: { name: string } | null
  sections: { name: string } | null
}

interface Props {
  sessionId: string
  classes: ClassItem[]
  sections: SectionItem[]
  subjects: SubjectItem[]
  classSections: ClassSectionItem[]
}

const TABS = ['Classes', 'Sections', 'Subjects', 'Class-Sections'] as const
type Tab = (typeof TABS)[number]

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-900 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
    >
      {pending ? 'Adding…' : label}
    </button>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 text-center py-8">{text}</p>
}

export default function AcademicClient({ sessionId, classes, sections, subjects, classSections }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Classes')
  const [, startTransition] = useTransition()

  function handleDelete(action: () => Promise<void>) {
    if (!confirm('Delete this item? This cannot be undone.')) return
    startTransition(async () => { await action() })
  }

  const inputCls = 'flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const thCls = 'text-left pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide'

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 px-4 gap-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-amber-400 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
            <span className="ml-1.5 text-xs text-gray-400">
              {tab === 'Classes' && `(${classes.length})`}
              {tab === 'Sections' && `(${sections.length})`}
              {tab === 'Subjects' && `(${subjects.length})`}
              {tab === 'Class-Sections' && `(${classSections.length})`}
            </span>
          </button>
        ))}
      </div>

      <div className="p-6">

        {/* ── CLASSES ── */}
        {activeTab === 'Classes' && (
          <div>
            <form action={addClass} className="flex gap-3 mb-6">
              <input name="name" required placeholder="e.g. Class 1" className={inputCls} />
              <SubmitButton label="Add Class" />
            </form>
            {classes.length === 0 ? <EmptyRow text="No classes yet. Add your first class above." /> : (
              <table className="w-full">
                <thead><tr>
                  <th className={thCls}>#</th>
                  <th className={thCls}>Class Name</th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                </tr></thead>
                <tbody>
                  {classes.map((cls, i) => (
                    <tr key={cls.id} className="border-t border-gray-50">
                      <td className="py-3 text-sm text-gray-400 w-8">{i + 1}</td>
                      <td className="py-3 text-sm text-gray-800 font-medium">{cls.name}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDelete(() => deleteClass(cls.id))}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── SECTIONS ── */}
        {activeTab === 'Sections' && (
          <div>
            <form action={addSection} className="flex gap-3 mb-6">
              <input name="name" required placeholder="e.g. A" className={inputCls} />
              <SubmitButton label="Add Section" />
            </form>
            {sections.length === 0 ? <EmptyRow text="No sections yet. Add your first section above." /> : (
              <table className="w-full">
                <thead><tr>
                  <th className={thCls}>#</th>
                  <th className={thCls}>Section Name</th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                </tr></thead>
                <tbody>
                  {sections.map((sec, i) => (
                    <tr key={sec.id} className="border-t border-gray-50">
                      <td className="py-3 text-sm text-gray-400 w-8">{i + 1}</td>
                      <td className="py-3 text-sm text-gray-800 font-medium">{sec.name}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDelete(() => deleteSection(sec.id))}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── SUBJECTS ── */}
        {activeTab === 'Subjects' && (
          <div>
            <form action={addSubject} className="flex gap-3 mb-6">
              <input name="name" required placeholder="e.g. Mathematics" className={inputCls} />
              <input name="code" placeholder="Code (optional)" className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              <SubmitButton label="Add Subject" />
            </form>
            {subjects.length === 0 ? <EmptyRow text="No subjects yet. Add your first subject above." /> : (
              <table className="w-full">
                <thead><tr>
                  <th className={thCls}>#</th>
                  <th className={thCls}>Subject</th>
                  <th className={thCls}>Code</th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                </tr></thead>
                <tbody>
                  {subjects.map((sub, i) => (
                    <tr key={sub.id} className="border-t border-gray-50">
                      <td className="py-3 text-sm text-gray-400 w-8">{i + 1}</td>
                      <td className="py-3 text-sm text-gray-800 font-medium">{sub.name}</td>
                      <td className="py-3 text-sm text-gray-500">{sub.code ?? '—'}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDelete(() => deleteSubject(sub.id))}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── CLASS-SECTIONS ── */}
        {activeTab === 'Class-Sections' && (
          <div>
            {(classes.length === 0 || sections.length === 0) ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 px-4 py-3 rounded-lg mb-6">
                Add at least one class and one section first, then come back here.
              </p>
            ) : (
              <form action={addClassSection} className="flex gap-3 mb-6">
                <input type="hidden" name="session_id" value={sessionId} />
                <select name="class_id" required className={inputCls}>
                  <option value="">Select class…</option>
                  {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
                <select name="section_id" required className={inputCls}>
                  <option value="">Select section…</option>
                  {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                </select>
                <SubmitButton label="Add" />
              </form>
            )}
            {classSections.length === 0 ? <EmptyRow text="No class-sections yet." /> : (
              <table className="w-full">
                <thead><tr>
                  <th className={thCls}>#</th>
                  <th className={thCls}>Class — Section</th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                </tr></thead>
                <tbody>
                  {classSections.map((cs, i) => (
                    <tr key={cs.id} className="border-t border-gray-50">
                      <td className="py-3 text-sm text-gray-400 w-8">{i + 1}</td>
                      <td className="py-3 text-sm text-gray-800 font-medium">
                        {cs.classes?.name} — {cs.sections?.name}
                      </td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDelete(() => deleteClassSection(cs.id))}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
