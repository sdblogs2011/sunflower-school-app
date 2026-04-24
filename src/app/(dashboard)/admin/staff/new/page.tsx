import Link from 'next/link'
import { createStaff } from '../actions'

const DESIGNATIONS = [
  'Principal', 'Vice Principal', 'Class Teacher', 'Subject Teacher',
  'PE Teacher', 'Librarian', 'Admin Staff', 'Other',
]

export default function NewStaffPage() {
  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/staff" className="text-sm text-gray-500 hover:text-gray-700">← Staff</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Add Staff Member</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form action={createStaff} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Employee ID</label>
              <input name="employee_id" className={inputCls} placeholder="e.g. EMP001" />
            </div>
            <div>
              <label className={labelCls}>Designation <span className="text-red-400">*</span></label>
              <select name="designation" required className={inputCls}>
                <option value="">Select…</option>
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
            <input name="full_name" required className={inputCls} placeholder="Staff member's full name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Mobile Number</label>
              <input name="mobile_number" type="tel" className={inputCls} placeholder="10-digit mobile" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input name="email" type="email" className={inputCls} placeholder="Work email" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Department</label>
              <input name="department" className={inputCls} placeholder="e.g. Primary, Secondary" />
            </div>
            <div>
              <label className={labelCls}>Date of Joining</label>
              <input name="join_date" type="date" className={inputCls} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
              Save Staff Member
            </button>
            <Link href="/admin/staff"
              className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
