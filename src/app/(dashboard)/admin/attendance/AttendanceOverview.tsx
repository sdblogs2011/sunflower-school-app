'use client'

import { useState } from 'react'
import Link from 'next/link'

type ClassRow = {
  id: string
  class_name: string
  session: { id: string; is_submitted: boolean; present: number; total: number } | null
}

export default function AttendanceOverview({ classes, defaultDate }: { classes: ClassRow[]; defaultDate: string }) {
  const [date, setDate] = useState(defaultDate)

  const marked = classes.filter(c => c.session?.is_submitted).length
  const pending = classes.filter(c => !c.session).length

  return (
    <div>
      {/* Date picker + summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <div className="bg-green-50 px-4 py-2.5 rounded-lg">
            <p className="text-xs text-green-600 font-medium">Marked</p>
            <p className="text-2xl font-bold text-green-700">{marked}</p>
          </div>
          <div className="bg-amber-50 px-4 py-2.5 rounded-lg">
            <p className="text-xs text-amber-600 font-medium">Pending</p>
            <p className="text-2xl font-bold text-amber-700">{pending}</p>
          </div>
          <div className="bg-gray-50 px-4 py-2.5 rounded-lg">
            <p className="text-xs text-gray-500 font-medium">Total Classes</p>
            <p className="text-2xl font-bold text-gray-700">{classes.length}</p>
          </div>
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Class', 'Status', 'Present / Total', 'Action'].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map(c => (
              <tr key={c.id} className="border-t border-gray-50 hover:bg-amber-50/30 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.class_name}</td>
                <td className="px-4 py-3">
                  {c.session?.is_submitted ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">✓ Submitted</span>
                  ) : c.session ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">Draft</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Not Marked</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {c.session ? `${c.session.present} / ${c.session.total}` : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/attendance/mark?cs=${c.id}&date=${date}`}
                    className={`text-xs font-medium ${c.session?.is_submitted ? 'text-gray-500 hover:text-gray-700' : 'text-amber-600 hover:text-amber-800'}`}
                  >
                    {c.session?.is_submitted ? 'View / Edit' : 'Mark →'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
