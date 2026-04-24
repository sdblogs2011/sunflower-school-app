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

export async function createResource(formData: FormData) {
  const { schoolId, admin } = await getContext()

  const classSectionId = formData.get('class_section_id') as string
  const { data: cs } = await admin.from('class_sections').select('id').eq('id', classSectionId).eq('school_id', schoolId).single()
  if (!cs) throw new Error('Invalid class section')

  await admin.from('resources').insert({
    class_section_id: classSectionId,
    subject_id: (formData.get('subject_id') as string) || null,
    title: (formData.get('title') as string).trim(),
    description: (formData.get('description') as string).trim() || null,
    file_url: (formData.get('file_url') as string).trim() || null,
    resource_type: (formData.get('resource_type') as string) || 'link',
  })

  revalidatePath('/admin/resources')
}

export async function deleteResource(id: string) {
  const { schoolId, admin } = await getContext()

  const { data: res } = await admin
    .from('resources')
    .select('id, class_sections(school_id)')
    .eq('id', id)
    .single()

  if (!res || (res as any).class_sections?.school_id !== schoolId) throw new Error('Not found')

  await admin.from('resources').delete().eq('id', id)
  revalidatePath('/admin/resources')
}
