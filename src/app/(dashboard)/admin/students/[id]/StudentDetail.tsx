'use client'

import { useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { updateStudent, updateEnrollment, addParent, setStudentStatus } from '../actions'

type ClassSection = { id: string; class_name: string }
type Parent = {
  id: string; full_name: string; mobile_number: string | null
  email: string | null; relation: string
}
type Student = {
  id: string; admission_number: string; full_name: string
  date_of_birth: string | null; gender: string | null
  address: string | null; blood_group: string | null; status: string
}
type Enrollment = { id: string; class_section_id: string; roll_number: number | null } | null

interface Props {
  student: Student
  enrollment: Enrollment
  classSections: ClassSection[]
  parents: Parent[]
}

function SaveBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
      {pending ? 'Saving…' : 'Save'}
    </button>
  )
}

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
const labelCls = 'block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide'

export default function StudentDetail({ student, enrollment, classSections, parents: initialParents }: Props) {
  const [editInfo, setEditInfo] = useState(false)
  const [editClass, setEditClass] = useState(false)
  const [showAddParent, setShowAddParent] = useState(false)
  const [, startTransition] = useTransition()

  function handleStatus(status: string) {
    if (!confirm(`Mark student as ${status}?`)) return
    startTransition(async () => { await setStudentStatus(student.id, status) })
  }

  return (
    <div className="space-y-5">

      {/* ── Student Info ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Student Information</h2>
          <div className="flex gap-2">
            {!editInfo && (
              <button onClick={() => setEditInfo(true)}
                className="text-xs text-amber-600 hover:text-amber-800 font-medium">Edit</button>
            )}
            {student.status === 'active' ? (
              <button onClick={() => handleStatus('inactive')}
                className="text-xs text-red-400 hover:text-red-600">Deactivate</button>
            ) : (
              <button onClick={() => handleStatus('active')}
                className="text-xs text-green-600 hover:text-green-800">Reactivate</button>
            )}
          </div>
        </div>

        {editInfo ? (
          <form action={async (fd) => { await updateStudent(student.id, fd); setEditInfo(false) }}
            className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input name="full_name" required defaultValue={student.full_name} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input name="date_of_birth" type="date" defaultValue={student.date_of_birth ?? ''} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Gender</label>
                <select name="gender" defaultValue={student.gender ?? ''} className={inputCls}>
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input name="address" defaultValue={student.address ?? ''} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2">
              <SaveBtn />
              <button type="button" onClick={() => setEditInfo(false)}
                className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Admission No', value: student.admission_number },
              { label: 'Full Name', value: student.full_name },
              { label: 'Status', value: student.status },
              { label: 'Date of Birth', value: student.date_of_birth ?? '—' },
              { label: 'Gender', value: student.gender ?? '—' },
              { label: 'Address', value: student.address ?? '—' },
            ].map(f => (
              <div key={f.label}>
                <p className={labelCls}>{f.label}</p>
                <p className="text-sm text-gray-800 font-medium capitalize">{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Class Enrollment ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Class Enrollment</h2>
          {!editClass && (
            <button onClick={() => setEditClass(true)}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium">
              {enrollment ? 'Change Class' : 'Enroll'}
            </button>
          )}
        </div>

        {editClass ? (
          <form action={async (fd) => { await updateEnrollment(student.id, fd); setEditClass(false) }}
            className="flex gap-3">
            <select name="class_section_id" required defaultValue={enrollment?.class_section_id ?? ''}
              className={inputCls}>
              <option value="">Select class…</option>
              {classSections.map(cs => (
                <option key={cs.id} value={cs.id}>{cs.class_name}</option>
              ))}
            </select>
            <input name="roll_number" type="number" placeholder="Roll No"
              defaultValue={enrollment?.roll_number ?? ''}
              className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <SaveBtn />
            <button type="button" onClick={() => setEditClass(false)}
              className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </form>
        ) : enrollment ? (
          <div className="flex gap-8">
            <div>
              <p className={labelCls}>Class</p>
              <p className="text-sm font-medium text-gray-800">
                {classSections.find(cs => cs.id === enrollment.class_section_id)?.class_name ?? '—'}
              </p>
            </div>
            <div>
              <p className={labelCls}>Roll Number</p>
              <p className="text-sm font-medium text-gray-800">{enrollment.roll_number ?? '—'}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Not enrolled in any class yet.</p>
        )}
      </div>

      {/* ── Parents / Guardians ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Parents / Guardians</h2>
          <button onClick={() => setShowAddParent(v => !v)}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium">
            {showAddParent ? 'Cancel' : '+ Add Parent'}
          </button>
        </div>

        {showAddParent && (
          <form action={async (fd) => { await addParent(student.id, fd); setShowAddParent(false) }}
            className="border border-gray-100 rounded-lg p-4 mb-4 space-y-3 bg-gray-50">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
                <input name="full_name" required className={inputCls} placeholder="Parent's name" />
              </div>
              <div>
                <label className={labelCls}>Relation <span className="text-red-400">*</span></label>
                <select name="relation" required className={inputCls}>
                  <option value="">Select…</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Mobile Number</label>
                <input name="mobile_number" type="tel" className={inputCls} placeholder="10-digit mobile" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input name="email" type="email" className={inputCls} placeholder="Optional" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Occupation</label>
              <input name="occupation" className={inputCls} placeholder="Optional" />
            </div>
            <SaveBtn />
          </form>
        )}

        {initialParents.length === 0 && !showAddParent ? (
          <p className="text-sm text-gray-400">No parents added yet.</p>
        ) : (
          <div className="space-y-3">
            {initialParents.map(p => (
              <div key={p.id} className="flex items-start justify-between py-3 border-t border-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.full_name}
                    <span className="ml-2 text-xs text-gray-400 capitalize">({p.relation})</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {p.mobile_number ?? '—'} {p.email ? `· ${p.email}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
