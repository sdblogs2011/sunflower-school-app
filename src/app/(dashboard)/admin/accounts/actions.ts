'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id, role').eq('user_id', user.id).single()
  if (!profile || profile.role !== 'principal') throw new Error('Only principal can manage accounts')
  return { schoolId: profile.school_id, admin: createAdminClient() }
}

export async function createAccount(formData: FormData) {
  const { schoolId, admin } = await getContext()

  const email = (formData.get('email') as string).trim().toLowerCase()
  const fullName = (formData.get('full_name') as string).trim()
  const role = formData.get('role') as string
  const password = formData.get('password') as string
  const mobile = (formData.get('mobile_number') as string).trim() || null

  // Create auth user
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) throw new Error(authError.message)

  // Create profile
  const { error: profileError } = await admin.from('user_profiles').insert({
    user_id: authUser.user.id,
    school_id: schoolId,
    role,
    full_name: fullName,
    email,
    mobile_number: mobile,
    is_active: true,
  })

  if (profileError) {
    // Rollback auth user if profile insert fails
    await admin.auth.admin.deleteUser(authUser.user.id)
    throw new Error(profileError.message)
  }

  revalidatePath('/admin/accounts')
}

export async function deactivateAccount(userId: string) {
  const { schoolId, admin } = await getContext()

  // Verify account belongs to this school
  const { data: profile } = await admin
    .from('user_profiles').select('role').eq('user_id', userId).eq('school_id', schoolId).single()
  if (!profile) throw new Error('Account not found')
  if (profile.role === 'principal') throw new Error('Cannot deactivate principal account')

  await admin.from('user_profiles').update({ is_active: false }).eq('user_id', userId)
  await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' })
  revalidatePath('/admin/accounts')
}

export async function reactivateAccount(userId: string) {
  const { schoolId, admin } = await getContext()
  const { data: profile } = await admin
    .from('user_profiles').select('role').eq('user_id', userId).eq('school_id', schoolId).single()
  if (!profile) throw new Error('Account not found')

  await admin.from('user_profiles').update({ is_active: true }).eq('user_id', userId)
  revalidatePath('/admin/accounts')
}

export async function resetPassword(userId: string, formData: FormData) {
  const { schoolId, admin } = await getContext()
  const { data: profile } = await admin
    .from('user_profiles').select('id').eq('user_id', userId).eq('school_id', schoolId).single()
  if (!profile) throw new Error('Account not found')

  const newPassword = formData.get('password') as string
  if (!newPassword || newPassword.length < 6) throw new Error('Password must be at least 6 characters')

  await admin.auth.admin.updateUserById(userId, { password: newPassword })
  revalidatePath('/admin/accounts')
}
