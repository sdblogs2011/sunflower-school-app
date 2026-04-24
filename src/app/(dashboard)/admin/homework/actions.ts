'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) throw new Error('Profile not found')
  return { schoolId: profile.school_id, admin: createAdminClient() }
}

export async function createHomework(formData: FormData) {
  const { schoolId, admin } = await getContext()

  const classSectionId = formData.get('class_section_id') as string
  const { data: cs } = await admin.from('class_sections').select('id').eq('id', classSectionId).eq('school_id', schoolId).single()
  if (!cs) throw new Error('Invalid class section')

  const dueDateRaw = formData.get('due_date') as string

  await admin.from('homework').insert({
    class_section_id: classSectionId,
    subject_id: (formData.get('subject_id') as string) || null,
    title: (formData.get('title') as string).trim(),
    description: (formData.get('description') as string).trim() || null,
    due_date: dueDateRaw || null,
  })

  revalidatePath('/admin/homework')
}

export async function deleteHomework(id: string) {
  const { schoolId, admin } = await getContext()

  // Verify ownership via join
  const { data: hw } = await admin
    .from('homework')
    .select('id, class_sections(school_id)')
    .eq('id', id)
    .single()

  if (!hw || (hw as any).class_sections?.school_id !== schoolId) throw new Error('Not found')

  await admin.from('homework').delete().eq('id', id)
  revalidatePath('/admin/homework')
}
