'use client'

import { useState } from 'react'
import Link from 'next/link'

type StaffRow = {
  id: string
  employee_id: string | null
  full_name: string
  designation: string | null
  department: string | null
  mobile_number: string | null
  is_active: boolean
}

export default function StaffList({ staff }: { staff: StaffRow[] }) {
  const [search, setSearch] = useState('')

  const filtered = staff.filter(s => {
    const q = search.toLowerCase()
    return !q || s.full_name.toLowerCase().includes(q) ||
      s.designation?.toLowerCase().includes(q) ||
      s.employee_id?.toLowerCase().includes(q)
  })

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="flex gap-3 p-4 border-b border-gray-100">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, designation, or employee ID"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div className="px-4 py-2 border-b border-gray-50">
        <p className="text-xs text-gray-400">{filtered.length} of {staff.length} staff members</p>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No staff found.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['#', 'Emp. ID', 'Name', 'Designation', 'Department', 'Mobile', 'Status', ''].map(h => (
                <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} className="border-t border-gray-50 hover:bg-amber-50/30 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-600">{s.employee_id ?? '—'}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.full_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{s.designation ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{s.department ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{s.mobile_number ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/staff/${s.id}`} className="text-xs text-amber-600 hover:text-amber-800 font-medium">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
