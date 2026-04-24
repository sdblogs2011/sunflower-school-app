import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createFeeStructure, applyStructureToClass } from '../actions'

export default async function StructuresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id

  const { data: session } = await admin
    .from('academic_sessions').select('id, name')
    .eq('school_id', schoolId).eq('is_active', true).single()

  const [{ data: structures }, { data: classes }] = await Promise.all([
    admin.from('fee_structures')
      .select('id, name, total_amount, due_date, applicable_class_id, classes(name)')
      .eq('school_id', schoolId).eq('academic_session_id', session?.id ?? '')
      .order('created_at', { ascending: false }),
    admin.from('classes').select('id, name').eq('school_id', schoolId).order('order_rank'),
  ])

  // Count accounts per structure
  const { data: accountCounts } = await admin
    .from('student_fee_accounts')
    .select('fee_structure_id')
    .eq('academic_session_id', session?.id ?? '')

  const countMap = new Map<string, number>()
  for (const a of (accountCounts ?? [])) {
    countMap.set(a.fee_structure_id, (countMap.get(a.fee_structure_id) ?? 0) + 1)
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/fees" className="text-sm text-gray-500 hover:text-gray-700">← Fees</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Fee Structures</h1>
        <span className="text-sm text-gray-400">({session?.name})</span>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Create New Structure</h2>
        <form action={createFeeStructure} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Structure Name <span className="text-red-400">*</span></label>
              <input name="name" required className={inputCls} placeholder="e.g. Annual Fee 2025-26" />
            </div>
            <div>
              <label className={labelCls}>Applicable Class <span className="text-red-400">*</span></label>
              <select name="applicable_class_id" required className={inputCls}>
                <option value="">Select class…</option>
                {(classes ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Total Amount (₹) <span className="text-red-400">*</span></label>
              <input name="total_amount" type="number" required min="1" step="0.01" className={inputCls} placeholder="e.g. 12000" />
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input name="due_date" type="date" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Line Items (optional)</label>
            <div className="space-y-2" id="line-items">
              <div className="flex gap-2">
                <input name="item_name" className={inputCls} placeholder="e.g. Tuition Fee" />
                <input name="item_amount" type="number" min="0" step="0.01" className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Amount" />
              </div>
              <div className="flex gap-2">
                <input name="item_name" className={inputCls} placeholder="e.g. Library Fee" />
                <input name="item_amount" type="number" min="0" step="0.01" className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Amount" />
              </div>
              <div className="flex gap-2">
                <input name="item_name" className={inputCls} placeholder="e.g. Sports Fee" />
                <input name="item_amount" type="number" min="0" step="0.01" className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Amount" />
              </div>
            </div>
          </div>
          <button type="submit" className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
            Create Structure
          </button>
        </form>
      </div>

      {/* Existing structures */}
      {(structures ?? []).length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No fee structures yet.</p>
      ) : (
        <div className="space-y-3">
          {(structures ?? []).map((s: any) => {
            const count = countMap.get(s.id) ?? 0
            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{s.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {s.classes?.name ?? 'All classes'} · {fmt(s.total_amount)}
                      {s.due_date && ` · Due ${new Date(s.due_date).toLocaleDateString('en-IN')}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{count} student accounts created</p>
                  </div>
                  <form action={applyStructureToClass.bind(null, s.id)}>
                    <button type="submit"
                      className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors whitespace-nowrap">
                      {count > 0 ? '↻ Re-apply to Class' : '→ Apply to Class'}
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
