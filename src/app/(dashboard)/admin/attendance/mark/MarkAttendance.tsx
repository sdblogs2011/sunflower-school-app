'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveAttendance } from '../actions'

type Student = { id: string; full_name: string; roll_number: number | null }

const STATUSES = [
  { key: 'present', label: 'P', active: 'bg-green-500 text-white border-green-500', inactive: 'border-gray-200 text-gray-400 hover:border-green-300' },
  { key: 'absent',  label: 'A', active: 'bg-red-500 text-white border-red-500',   inactive: 'border-gray-200 text-gray-400 hover:border-red-300'   },
  { key: 'late',    label: 'L', active: 'bg-amber-400 text-white border-amber-400', inactive: 'border-gray-200 text-gray-400 hover:border-amber-300' },
  { key: 'excused', label: 'E', active: 'bg-gray-400 text-white border-gray-400',  inactive: 'border-gray-200 text-gray-400 hover:border-gray-400'  },
]

export default function MarkAttendance({
  classSectionId, className, date, students, existingStatuses,
}: {
  classSectionId: string
  className: string
  date: string
  students: Student[]
  existingStatuses: Record<string, string>
}) {
  const router = useRouter()
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(students.map(s => [s.id, existingStatuses[s.id] ?? 'present']))
  )
  const [saving, setSaving] = useState(false)

  const counts = STATUSES.reduce((acc, s) => {
    acc[s.key] = Object.values(statuses).filter(v => v === s.key).length
    return acc
  }, {} as Record<string, number>)

  function markAll(status: string) {
    setStatuses(Object.fromEntries(students.map(s => [s.id, status])))
  }

  async function handleSubmit() {
    setSaving(true)
    await saveAttendance(classSectionId, date, statuses)
    setSaving(false)
    router.push('/admin/attendance')
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="flex gap-3 mb-5">
        <div className="bg-green-50 px-4 py-2.5 rounded-lg flex-1 text-center">
          <p className="text-xs text-green-600 font-medium">Present</p>
          <p className="text-2xl font-bold text-green-700">{counts.present}</p>
        </div>
        <div className="bg-red-50 px-4 py-2.5 rounded-lg flex-1 text-center">
          <p className="text-xs text-red-600 font-medium">Absent</p>
          <p className="text-2xl font-bold text-red-700">{counts.absent}</p>
        </div>
        <div className="bg-amber-50 px-4 py-2.5 rounded-lg flex-1 text-center">
          <p className="text-xs text-amber-600 font-medium">Late</p>
          <p className="text-2xl font-bold text-amber-700">{counts.late}</p>
        </div>
        <div className="bg-gray-50 px-4 py-2.5 rounded-lg flex-1 text-center">
          <p className="text-xs text-gray-500 font-medium">Total</p>
          <p className="text-2xl font-bold text-gray-700">{students.length}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => markAll('present')}
          className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors">
          ✓ Mark All Present
        </button>
        <button onClick={() => markAll('absent')}
          className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors">
          Mark All Absent
        </button>
      </div>

      {/* Student list */}
      <div className="bg-white rounded-xl border border-gray-100 mb-5">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">{className} — {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          <p className="text-xs text-gray-400">{students.length} students</p>
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No students enrolled in this class.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {students.map((student, i) => (
              <div key={student.id} className="flex items-center px-4 py-3 gap-4">
                <span className="w-7 text-xs text-gray-400 text-right">{student.roll_number ?? i + 1}</span>
                <span className="flex-1 text-sm font-medium text-gray-900">{student.full_name}</span>
                <div className="flex gap-1">
                  {STATUSES.map(s => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setStatuses(prev => ({ ...prev, [student.id]: s.key }))}
                      className={`w-8 h-8 rounded-lg text-xs font-bold border-2 transition-all ${
                        statuses[student.id] === s.key ? s.active : s.inactive
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={saving || students.length === 0}
        className="w-full py-3 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-900 font-semibold rounded-xl text-sm transition-colors"
      >
        {saving ? 'Saving…' : 'Submit Attendance'}
      </button>
    </div>
  )
}
