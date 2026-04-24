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

export async function createFeeStructure(formData: FormData) {
  const { schoolId, sessionId, admin } = await getContext()
  if (!sessionId) throw new Error('No active session')

  const { data: structure, error } = await admin.from('fee_structures').insert({
    school_id: schoolId,
    academic_session_id: sessionId,
    name: (formData.get('name') as string).trim(),
    applicable_class_id: (formData.get('applicable_class_id') as string) || null,
    total_amount: parseFloat(formData.get('total_amount') as string),
    due_date: (formData.get('due_date') as string) || null,
  }).select('id').single()

  if (error) throw new Error(error.message)

  // Add line items if provided
  const itemNames = formData.getAll('item_name') as string[]
  const itemAmounts = formData.getAll('item_amount') as string[]
  const items = itemNames
    .map((name, i) => ({ name: name.trim(), amount: parseFloat(itemAmounts[i]) }))
    .filter(item => item.name && !isNaN(item.amount))

  if (items.length > 0) {
    await admin.from('fee_structure_items').insert(
      items.map(item => ({ fee_structure_id: structure.id, item_name: item.name, amount: item.amount }))
    )
  }

  revalidatePath('/admin/fees/structures')
  redirect('/admin/fees/structures')
}

export async function applyStructureToClass(structureId: string) {
  const { schoolId, sessionId, admin } = await getContext()
  if (!sessionId) throw new Error('No active session')

  const { data: structure } = await admin
    .from('fee_structures').select('applicable_class_id, total_amount')
    .eq('id', structureId).single()
  if (!structure) throw new Error('Structure not found')

  // Find class-section for this class in active session
  const { data: classSections } = await admin
    .from('class_sections').select('id')
    .eq('school_id', schoolId)
    .eq('academic_session_id', sessionId)
    .eq('class_id', structure.applicable_class_id)

  if (!classSections?.length) throw new Error('No class section found')

  // Get all enrolled students for this class
  const { data: enrollments } = await admin
    .from('student_enrollments').select('student_id')
    .in('class_section_id', classSections.map(cs => cs.id))
    .eq('academic_session_id', sessionId)

  if (!enrollments?.length) return

  // Create fee accounts (skip if already exists)
  await admin.from('student_fee_accounts').upsert(
    enrollments.map(e => ({
      student_id: e.student_id,
      fee_structure_id: structureId,
      academic_session_id: sessionId,
      total_amount: structure.total_amount,
      amount_paid: 0,
    })),
    { onConflict: 'student_id,fee_structure_id', ignoreDuplicates: true }
  )

  revalidatePath('/admin/fees/structures')
  revalidatePath('/admin/fees')
}

export async function recordPayment(feeAccountId: string, studentId: string, formData: FormData) {
  const { admin } = await getContext()
  const amount = parseFloat(formData.get('amount') as string)
  if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount')

  const receiptNumber = `RCP-${Date.now()}`

  await admin.from('payment_records').insert({
    student_fee_account_id: feeAccountId,
    student_id: studentId,
    amount,
    payment_date: (formData.get('payment_date') as string) || new Date().toISOString().split('T')[0],
    payment_mode: (formData.get('payment_mode') as string) || 'cash',
    reference_number: (formData.get('reference_number') as string) || null,
    receipt_number: receiptNumber,
    remarks: (formData.get('remarks') as string) || null,
  })

  // Update amount_paid on fee account
  const { data: account } = await admin
    .from('student_fee_accounts').select('amount_paid').eq('id', feeAccountId).single()
  if (account) {
    await admin.from('student_fee_accounts')
      .update({ amount_paid: Number(account.amount_paid) + amount })
      .eq('id', feeAccountId)
  }

  revalidatePath(`/admin/fees/student/${studentId}`)
  revalidatePath('/admin/fees')
}
