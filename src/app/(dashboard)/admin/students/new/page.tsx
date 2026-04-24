import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createStudent } from '../actions'

export default async function NewStudentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id

  const { data: session } = await admin
    .from('academic_sessions').select('id')
    .eq('school_id', schoolId).eq('is_active', true).single()

  const { data: classSections } = await admin
    .from('class_sections')
    .select('id, classes(name)')
    .eq('school_id', schoolId)
    .eq('academic_session_id', session?.id ?? '')
    .order('created_at')

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/students" className="text-sm text-gray-500 hover:text-gray-700">← Students</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Add Student</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form action={createStudent} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Admission Number <span className="text-red-400">*</span></label>
              <input name="admission_number" required className={inputCls} placeholder="e.g. 2025001" />
            </div>
            <div>
              <label className={labelCls}>Class <span className="text-red-400">*</span></label>
              <select name="class_section_id" required className={inputCls}>
                <option value="">Select class…</option>
                {(classSections ?? []).map((cs: any) => (
                  <option key={cs.id} value={cs.id}>{cs.classes?.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
            <input name="full_name" required className={inputCls} placeholder="Student's full name" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date of Birth</label>
              <input name="date_of_birth" type="date" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select name="gender" className={inputCls}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Roll Number</label>
              <input name="roll_number" type="number" className={inputCls} placeholder="Optional" />
            </div>
            <div>
              <label className={labelCls}>Blood Group</label>
              <input name="blood_group" className={inputCls} placeholder="e.g. O+" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Address</label>
            <textarea name="address" rows={2} className={inputCls} placeholder="Home address" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
              Save Student
            </button>
            <Link href="/admin/students"
              className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
