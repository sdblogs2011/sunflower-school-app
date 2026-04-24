'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getSchoolId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('school_id')
    .eq('user_id', user.id)
    .single()
  if (!profile) throw new Error('Profile not found')
  return profile.school_id
}

// ── Classes ─────────────────────────────────────────────────
export async function addClass(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  if (!name) return
  const schoolId = await getSchoolId()
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('classes').select('order_rank').eq('school_id', schoolId)
    .order('order_rank', { ascending: false }).limit(1)
  const orderRank = (existing?.[0]?.order_rank ?? 0) + 1
  await admin.from('classes').insert({ school_id: schoolId, name, order_rank: orderRank })
  revalidatePath('/admin/academic')
}

export async function deleteClass(id: string) {
  const schoolId = await getSchoolId()
  await createAdminClient().from('classes').delete().eq('id', id).eq('school_id', schoolId)
  revalidatePath('/admin/academic')
}

// ── Sections ─────────────────────────────────────────────────
export async function addSection(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  if (!name) return
  const schoolId = await getSchoolId()
  await createAdminClient().from('sections').insert({ school_id: schoolId, name })
  revalidatePath('/admin/academic')
}

export async function deleteSection(id: string) {
  const schoolId = await getSchoolId()
  await createAdminClient().from('sections').delete().eq('id', id).eq('school_id', schoolId)
  revalidatePath('/admin/academic')
}

// ── Subjects ─────────────────────────────────────────────────
export async function addSubject(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const code = (formData.get('code') as string)?.trim()
  if (!name) return
  const schoolId = await getSchoolId()
  await createAdminClient().from('subjects').insert({
    school_id: schoolId,
    name,
    code: code || null,
  })
  revalidatePath('/admin/academic')
}

export async function deleteSubject(id: string) {
  const schoolId = await getSchoolId()
  await createAdminClient().from('subjects').delete().eq('id', id).eq('school_id', schoolId)
  revalidatePath('/admin/academic')
}

// ── Class-Sections ────────────────────────────────────────────
export async function addClassSection(formData: FormData) {
  const classId = formData.get('class_id') as string
  const sectionId = formData.get('section_id') as string
  const sessionId = formData.get('session_id') as string
  if (!classId || !sectionId || !sessionId) return
  const schoolId = await getSchoolId()
  await createAdminClient().from('class_sections').insert({
    school_id: schoolId,
    academic_session_id: sessionId,
    class_id: classId,
    section_id: sectionId,
  })
  revalidatePath('/admin/academic')
}

export async function deleteClassSection(id: string) {
  const schoolId = await getSchoolId()
  await createAdminClient().from('class_sections').delete().eq('id', id).eq('school_id', schoolId)
  revalidatePath('/admin/academic')
}
