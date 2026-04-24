'use client'

import { useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { updateStaff, setStaffStatus, addAssignment, deleteAssignment } from '../actions'

const DESIGNATIONS = [
  'Principal', 'Vice Principal', 'Class Teacher', 'Subject Teacher',
  'PE Teacher', 'Librarian', 'Admin Staff', 'Other',
]

type Staff = {
  id: string; employee_id: string | null; full_name: string
  email: string | null; mobile_number: string | null
  designation: string | null; department: string | null
  join_date: string | null; is_active: boolean
}
type Assignment = {
  id: string; class_name: string; subject_name: string
  class_section_id: string; subject_id: string
}
type ClassSection = { id: string; class_name: string }
type Subject = { id: string; name: string }

interface Props {
  staff: Staff
  assignments: Assignment[]
  classSections: ClassSection[]
  subjects: Subject[]
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

export default function StaffDetail({ staff, assignments, classSections, subjects }: Props) {
  const [editInfo, setEditInfo] = useState(false)
  const [showAddAssign, setShowAddAssign] = useState(false)
  const [, startTransition] = useTransition()

  function handleStatus() {
    const msg = staff.is_active ? 'Deactivate this staff member?' : 'Reactivate this staff member?'
    if (!confirm(msg)) return
    startTransition(async () => { await setStaffStatus(staff.id, !staff.is_active) })
  }

  function handleDeleteAssignment(id: string) {
    if (!confirm('Remove this assignment?')) return
    startTransition(async () => { await deleteAssignment(id, staff.id) })
  }

  return (
    <div className="space-y-5">

      {/* ── Staff Info ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Staff Information</h2>
          <div className="flex gap-3">
            {!editInfo && (
              <button onClick={() => setEditInfo(true)} className="text-xs text-amber-600 hover:text-amber-800 font-medium">Edit</button>
            )}
            <button onClick={handleStatus}
              className={`text-xs font-medium ${staff.is_active ? 'text-red-400 hover:text-red-600' : 'text-green-600 hover:text-green-800'}`}>
              {staff.is_active ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        </div>

        {editInfo ? (
          <form action={async (fd) => { await updateStaff(staff.id, fd); setEditInfo(false) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input name="full_name" required defaultValue={staff.full_name} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Designation</label>
                <select name="designation" defaultValue={staff.designation ?? ''} className={inputCls}>
                  <option value="">—</option>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Mobile</label>
                <input name="mobile_number" defaultValue={staff.mobile_number ?? ''} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input name="email" type="email" defaultValue={staff.email ?? ''} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Department</label>
                <input name="department" defaultValue={staff.department ?? ''} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Date of Joining</label>
                <input name="join_date" type="date" defaultValue={staff.join_date ?? ''} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2">
              <SaveBtn />
              <button type="button" onClick={() => setEditInfo(false)} className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Employee ID', value: staff.employee_id ?? '—' },
              { label: 'Full Name', value: staff.full_name },
              { label: 'Designation', value: staff.designation ?? '—' },
              { label: 'Department', value: staff.department ?? '—' },
              { label: 'Mobile', value: staff.mobile_number ?? '—' },
              { label: 'Email', value: staff.email ?? '—' },
              { label: 'Date of Joining', value: staff.join_date ?? '—' },
              { label: 'Status', value: staff.is_active ? 'Active' : 'Inactive' },
            ].map(f => (
              <div key={f.label}>
                <p className={labelCls}>{f.label}</p>
                <p className="text-sm text-gray-800 font-medium">{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Teaching Assignments ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Teaching Assignments</h2>
          <button onClick={() => setShowAddAssign(v => !v)}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium">
            {showAddAssign ? 'Cancel' : '+ Add Assignment'}
          </button>
        </div>

        {showAddAssign && (
          <form action={async (fd) => { await addAssignment(staff.id, fd); setShowAddAssign(false) }}
            className="flex gap-3 mb-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <select name="class_section_id" required className={inputCls}>
              <option value="">Select class…</option>
              {classSections.map(cs => <option key={cs.id} value={cs.id}>{cs.class_name}</option>)}
            </select>
            <select name="subject_id" required className={inputCls}>
              <option value="">Select subject…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <SaveBtn />
          </form>
        )}

        {assignments.length === 0 ? (
          <p className="text-sm text-gray-400">No teaching assignments yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="text-left pb-2 text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="text-right pb-2 text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id} className="border-t border-gray-50">
                  <td className="py-2.5 text-sm text-gray-800 font-medium">{a.class_name}</td>
                  <td className="py-2.5 text-sm text-gray-600">{a.subject_name}</td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => handleDeleteAssignment(a.id)}
                      className="text-xs text-red-400 hover:text-red-600">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
