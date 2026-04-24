'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createAccount, deactivateAccount, reactivateAccount, resetPassword } from './actions'

type Account = {
  userId: string; fullName: string; email: string; role: string
  isActive: boolean; createdAt: string; mobile: string | null
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'School Clerk / Admin', desc: 'Can manage students, fees, notices, homework, attendance, staff' },
  { value: 'teacher', label: 'Teacher', desc: 'Can view classes, mark attendance, assign homework' },
  { value: 'parent', label: 'Parent', desc: 'Can view child\'s attendance, fees, notices, homework' },
  { value: 'student', label: 'Student', desc: 'Can view own attendance, homework, marks, notices' },
]

const ROLE_BADGES: Record<string, string> = {
  admin: 'bg-amber-50 text-amber-700',
  teacher: 'bg-blue-50 text-blue-700',
  parent: 'bg-green-50 text-green-700',
  student: 'bg-purple-50 text-purple-700',
  principal: 'bg-gray-100 text-gray-700',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Clerk / Admin',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
  principal: 'Principal',
}

function CreateBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="px-5 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
      {pending ? 'Creating…' : 'Create Account'}
    </button>
  )
}

function PasswordBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="px-3 py-1.5 text-xs font-medium bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-lg transition-colors">
      {pending ? '…' : 'Set Password'}
    </button>
  )
}

export default function AccountsClient({ accounts }: { accounts: Account[] }) {
  const [showForm, setShowForm] = useState(false)
  const [selectedRole, setSelectedRole] = useState('admin')
  const [resetTarget, setResetTarget] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  const roleInfo = ROLE_OPTIONS.find(r => r.value === selectedRole)

  async function handleCreate(fd: FormData) {
    setError(null)
    try {
      await createAccount(fd)
      setShowForm(false)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => { setShowForm(!showForm); setError(null) }}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
          {showForm ? '✕ Cancel' : '+ New Account'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Create Login Account</h2>
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
          )}
          <form action={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input name="full_name" required className={inputCls} placeholder="e.g. Priya Sharma" />
              </div>
              <div>
                <label className={labelCls}>Email Address *</label>
                <input name="email" type="email" required className={inputCls} placeholder="e.g. priya@school.in" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Mobile Number</label>
                <input name="mobile_number" className={inputCls} placeholder="Optional" />
              </div>
              <div>
                <label className={labelCls}>Password *</label>
                <input name="password" type="password" required minLength={6} className={inputCls} placeholder="Min. 6 characters" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Role *</label>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map(r => (
                  <label key={r.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                      ${selectedRole === r.value ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="role" value={r.value} checked={selectedRole === r.value}
                      onChange={() => setSelectedRole(r.value)} className="mt-0.5 accent-amber-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <CreateBtn />
          </form>
        </div>
      )}

      {/* Account list */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">No additional accounts yet. Create one above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Name', 'Email', 'Role', 'Mobile', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-medium text-gray-500 uppercase text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.userId} className="border-t border-gray-50">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-800">{a.fullName}</p>
                    <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString('en-IN')}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{a.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGES[a.role] ?? 'bg-gray-100 text-gray-500'}`}>
                      {ROLE_LABELS[a.role] ?? a.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{a.mobile ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'}`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.role !== 'principal' && (
                        <>
                          <button onClick={() => setResetTarget(resetTarget === a.userId ? null : a.userId)}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors">
                            Reset Password
                          </button>
                          {a.isActive ? (
                            <form action={deactivateAccount.bind(null, a.userId)}>
                              <button type="submit"
                                className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                                onClick={e => { if (!confirm(`Deactivate ${a.fullName}?`)) e.preventDefault() }}>
                                Deactivate
                              </button>
                            </form>
                          ) : (
                            <form action={reactivateAccount.bind(null, a.userId)}>
                              <button type="submit" className="text-xs px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded transition-colors">
                                Reactivate
                              </button>
                            </form>
                          )}
                        </>
                      )}
                    </div>
                    {resetTarget === a.userId && (
                      <form action={async (fd) => { await resetPassword(a.userId, fd); setResetTarget(null) }}
                        className="mt-2 flex gap-2">
                        <input name="password" type="password" required minLength={6} placeholder="New password"
                          className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 w-32" />
                        <PasswordBtn />
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
