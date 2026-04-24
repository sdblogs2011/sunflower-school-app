'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) throw new Error('Profile not found')
  const admin = createAdminClient()
  const { data: session } = await admin
    .from('academic_sessions').select('id')
    .eq('school_id', profile.school_id).eq('is_active', true).single()
  return { schoolId: profile.school_id, sessionId: session?.id ?? null, admin }
}

export async function createStaff(formData: FormData) {
  const { schoolId, admin } = await getContext()

  const { data: staff, error } = await admin.from('staff').insert({
    school_id: schoolId,
    employee_id: (formData.get('employee_id') as string)?.trim() || null,
    full_name: (formData.get('full_name') as string).trim(),
    email: (formData.get('email') as string)?.trim() || null,
    mobile_number: (formData.get('mobile_number') as string)?.trim() || null,
    designation: (formData.get('designation') as string) || null,
    department: (formData.get('department') as string)?.trim() || null,
    join_date: (formData.get('join_date') as string) || null,
  }).select('id').single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/staff')
  redirect(`/admin/staff/${staff.id}`)
}

export async function updateStaff(id: string, formData: FormData) {
  const { schoolId, admin } = await getContext()
  await admin.from('staff').update({
    full_name: (formData.get('full_name') as string).trim(),
    email: (formData.get('email') as string)?.trim() || null,
    mobile_number: (formData.get('mobile_number') as string)?.trim() || null,
    designation: (formData.get('designation') as string) || null,
    department: (formData.get('department') as string)?.trim() || null,
    join_date: (formData.get('join_date') as string) || null,
  }).eq('id', id).eq('school_id', schoolId)
  revalidatePath(`/admin/staff/${id}`)
}

export async function setStaffStatus(id: string, isActive: boolean) {
  const { schoolId, admin } = await getContext()
  await admin.from('staff').update({ is_active: isActive }).eq('id', id).eq('school_id', schoolId)
  revalidatePath('/admin/staff')
  revalidatePath(`/admin/staff/${id}`)
}

export async function addAssignment(staffId: string, formData: FormData) {
  const { schoolId, sessionId, admin } = await getContext()
  if (!sessionId) throw new Error('No active session')
  await admin.from('teacher_assignments').insert({
    staff_id: staffId,
    class_section_id: formData.get('class_section_id') as string,
    subject_id: formData.get('subject_id') as string,
    academic_session_id: sessionId,
  })
  revalidatePath(`/admin/staff/${staffId}`)
}

export async function deleteAssignment(id: string, staffId: string) {
  const { admin } = await getContext()
  await admin.from('teacher_assignments').delete().eq('id', id)
  revalidatePath(`/admin/staff/${staffId}`)
}
