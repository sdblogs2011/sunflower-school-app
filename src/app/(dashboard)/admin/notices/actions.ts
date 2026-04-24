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
  return { schoolId: profile.school_id, admin: createAdminClient() }
}

export async function createNotice(formData: FormData) {
  const { schoolId, admin } = await getContext()

  const publishNow = formData.get('publish_now') === 'true'
  const audienceType = formData.get('audience_type') as string

  const { data: notice, error } = await admin.from('notices').insert({
    school_id: schoolId,
    title: (formData.get('title') as string).trim(),
    body: (formData.get('body') as string).trim(),
    publish_status: publishNow ? 'published' : 'draft',
    published_at: publishNow ? new Date().toISOString() : null,
  }).select('id').single()

  if (error) throw new Error(error.message)

  // Insert audience
  const audiencePayload: any = { notice_id: notice.id, audience_type: audienceType }
  if (audienceType === 'class') {
    audiencePayload.class_section_id = formData.get('class_section_id') as string
  } else if (audienceType === 'role') {
    audiencePayload.role = formData.get('role') as string
  }
  await admin.from('notice_audiences').insert(audiencePayload)

  revalidatePath('/admin/notices')
  redirect(`/admin/notices/${notice.id}`)
}

export async function publishNotice(id: string) {
  const { schoolId, admin } = await getContext()
  await admin.from('notices').update({
    publish_status: 'published',
    published_at: new Date().toISOString(),
  }).eq('id', id).eq('school_id', schoolId)
  revalidatePath('/admin/notices')
  revalidatePath(`/admin/notices/${id}`)
}

export async function archiveNotice(id: string) {
  const { schoolId, admin } = await getContext()
  await admin.from('notices').update({ publish_status: 'archived' })
    .eq('id', id).eq('school_id', schoolId)
  revalidatePath('/admin/notices')
  revalidatePath(`/admin/notices/${id}`)
}

export async function updateNotice(id: string, formData: FormData) {
  const { schoolId, admin } = await getContext()
  await admin.from('notices').update({
    title: (formData.get('title') as string).trim(),
    body: (formData.get('body') as string).trim(),
  }).eq('id', id).eq('school_id', schoolId).eq('publish_status', 'draft')
  revalidatePath(`/admin/notices/${id}`)
}
