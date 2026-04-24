'use client'

import { useState } from 'react'
import Link from 'next/link'

type Student = {
  id: string; admission_number: string; full_name: string
  gender: string | null; status: string; class_name: string | null
}

export default function StudentList({ students, classNames }: { students: Student[]; classNames: string[] }) {
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const matchesSearch = !q || s.full_name.toLowerCase().includes(q) || s.admission_number.toLowerCase().includes(q)
    const matchesClass = !classFilter || s.class_name === classFilter
    return matchesSearch && matchesClass
  })

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 p-4 border-b border-gray-100">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or admission no."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="sm:w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">All Classes</option>
          {classNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      <div className="px-4 py-2 border-b border-gray-50">
        <p className="text-xs text-gray-400">{filtered.length} of {students.length} students</p>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No students found.</p>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="sm:hidden divide-y divide-gray-50">
            {filtered.map(s => (
              <Link key={s.id} href={`/admin/students/${s.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-amber-50/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.full_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.admission_number} · {s.class_name ?? '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.status}
                  </span>
                  <span className="text-gray-300">›</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['#', 'Adm. No', 'Name', 'Class', 'Status', ''].map(h => (
                    <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className="border-t border-gray-50 hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-400 w-8">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{s.admission_number}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.class_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/students/${s.id}`} className="text-xs text-amber-600 hover:text-amber-800 font-medium">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
