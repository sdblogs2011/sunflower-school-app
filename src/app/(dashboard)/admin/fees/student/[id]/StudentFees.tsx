'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { recordPayment } from '../../actions'

type Account = {
  id: string; total_amount: number; amount_paid: number; balance: number
  fee_structures: { id: string; name: string; due_date: string | null } | null
}
type Payment = {
  id: string; amount: number; payment_date: string; payment_mode: string
  reference_number: string | null; receipt_number: string; remarks: string | null
  student_fee_account_id: string
}

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`

function PayBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
      {pending ? 'Saving…' : 'Record Payment'}
    </button>
  )
}

export default function StudentFees({ studentId, accounts, payments }: { studentId: string; accounts: Account[]; payments: Payment[] }) {
  const [openPay, setOpenPay] = useState<string | null>(null)
  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide'

  const totalDue = accounts.reduce((s, a) => s + Number(a.total_amount), 0)
  const totalPaid = accounts.reduce((s, a) => s + Number(a.amount_paid), 0)
  const totalBalance = totalDue - totalPaid

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-600 font-medium">Total Billed</p>
          <p className="text-xl font-bold text-blue-700 mt-0.5">{fmt(totalDue)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-xs text-green-600 font-medium">Paid</p>
          <p className="text-xl font-bold text-green-700 mt-0.5">{fmt(totalPaid)}</p>
        </div>
        <div className={`rounded-xl p-4 text-center ${totalBalance > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
          <p className={`text-xs font-medium ${totalBalance > 0 ? 'text-red-600' : 'text-gray-500'}`}>Balance</p>
          <p className={`text-xl font-bold mt-0.5 ${totalBalance > 0 ? 'text-red-700' : 'text-gray-600'}`}>{fmt(totalBalance)}</p>
        </div>
      </div>

      {/* Fee accounts */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
          <p className="text-sm text-gray-400">No fee structures assigned to this student.</p>
          <p className="text-xs text-gray-400 mt-1">Go to Fee Structures and apply a structure to this student's class.</p>
        </div>
      ) : (
        accounts.map(a => {
          const balance = Number(a.total_amount) - Number(a.amount_paid)
          const pct = Math.min(100, Math.round((Number(a.amount_paid) / Number(a.total_amount)) * 100))
          return (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{a.fee_structures?.name}</p>
                  {a.fee_structures?.due_date && (
                    <p className="text-xs text-gray-400 mt-0.5">Due: {new Date(a.fee_structures.due_date).toLocaleDateString('en-IN')}</p>
                  )}
                </div>
                {balance > 0 && (
                  <button onClick={() => setOpenPay(openPay === a.id ? null : a.id)}
                    className="text-xs font-medium px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-lg transition-colors">
                    {openPay === a.id ? 'Cancel' : '+ Record Payment'}
                  </button>
                )}
                {balance === 0 && (
                  <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-full">✓ Paid</span>
                )}
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Paid: <span className="font-medium text-green-700">{fmt(Number(a.amount_paid))}</span></span>
                <span>Balance: <span className={`font-medium ${balance > 0 ? 'text-red-600' : 'text-gray-600'}`}>{fmt(balance)}</span></span>
                <span>Total: <span className="font-medium">{fmt(Number(a.total_amount))}</span></span>
              </div>

              {/* Payment form */}
              {openPay === a.id && (
                <form action={async (fd) => { await recordPayment(a.id, studentId, fd); setOpenPay(null) }}
                  className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Amount (₹) *</label>
                      <input name="amount" type="number" required min="1" max={balance} step="0.01"
                        defaultValue={balance} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Payment Date</label>
                      <input name="payment_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Payment Mode</label>
                      <select name="payment_mode" className={inputCls}>
                        <option value="cash">Cash</option>
                        <option value="online">Online Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="dd">DD</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Reference No.</label>
                      <input name="reference_number" className={inputCls} placeholder="Optional" />
                    </div>
                  </div>
                  <PayBtn />
                </form>
              )}
            </div>
          )
        })
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Payment History</h2>
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              {['Date', 'Amount', 'Mode', 'Receipt'].map(h => (
                <th key={h} className="pb-2 text-xs font-medium text-gray-500 uppercase text-left">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-t border-gray-50">
                  <td className="py-2.5 text-sm text-gray-600">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                  <td className="py-2.5 text-sm font-semibold text-green-700">{fmt(p.amount)}</td>
                  <td className="py-2.5 text-sm text-gray-500 capitalize">{p.payment_mode}</td>
                  <td className="py-2.5 text-xs font-mono text-gray-400">{p.receipt_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
