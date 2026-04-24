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

export async function createStudent(formData: FormData) {
  const { schoolId, sessionId, admin } = await getContext()

  const { data: student, error } = await admin.from('students').insert({
    school_id: schoolId,
    admission_number: (formData.get('admission_number') as string).trim(),
    full_name: (formData.get('full_name') as string).trim(),
    date_of_birth: (formData.get('date_of_birth') as string) || null,
    gender: (formData.get('gender') as string) || null,
    address: (formData.get('address') as string) || null,
    admission_date: new Date().toISOString().split('T')[0],
  }).select('id').single()

  if (error) throw new Error(error.message)

  const classSectionId = formData.get('class_section_id') as string
  const rollNumber = formData.get('roll_number') as string

  if (classSectionId && sessionId) {
    await admin.from('student_enrollments').insert({
      student_id: student.id,
      class_section_id: classSectionId,
      academic_session_id: sessionId,
      roll_number: rollNumber ? parseInt(rollNumber) : null,
    })
  }

  revalidatePath('/admin/students')
  redirect(`/admin/students/${student.id}`)
}

export async function updateStudent(id: string, formData: FormData) {
  const { schoolId, admin } = await getContext()
  await admin.from('students').update({
    full_name: (formData.get('full_name') as string).trim(),
    date_of_birth: (formData.get('date_of_birth') as string) || null,
    gender: (formData.get('gender') as string) || null,
    address: (formData.get('address') as string) || null,
  }).eq('id', id).eq('school_id', schoolId)
  revalidatePath(`/admin/students/${id}`)
}

export async function updateEnrollment(studentId: string, formData: FormData) {
  const { schoolId, sessionId, admin } = await getContext()
  if (!sessionId) return
  const classSectionId = formData.get('class_section_id') as string
  const rollNumber = formData.get('roll_number') as string

  const { data: existing } = await admin
    .from('student_enrollments').select('id')
    .eq('student_id', studentId).eq('academic_session_id', sessionId).single()

  if (existing) {
    await admin.from('student_enrollments').update({
      class_section_id: classSectionId,
      roll_number: rollNumber ? parseInt(rollNumber) : null,
    }).eq('id', existing.id)
  } else {
    await admin.from('student_enrollments').insert({
      student_id: studentId,
      class_section_id: classSectionId,
      academic_session_id: sessionId,
      roll_number: rollNumber ? parseInt(rollNumber) : null,
    })
  }
  revalidatePath(`/admin/students/${studentId}`)
}

export async function addParent(studentId: string, formData: FormData) {
  const { schoolId, admin } = await getContext()

  const { data: parent, error } = await admin.from('parents').insert({
    school_id: schoolId,
    full_name: (formData.get('full_name') as string).trim(),
    mobile_number: (formData.get('mobile_number') as string) || null,
    email: (formData.get('email') as string) || null,
    occupation: (formData.get('occupation') as string) || null,
  }).select('id').single()

  if (error) throw new Error(error.message)

  await admin.from('parent_student_links').insert({
    parent_id: parent.id,
    student_id: studentId,
    relation: formData.get('relation') as string,
    is_primary_contact: !formData.get('not_primary'),
  })

  revalidatePath(`/admin/students/${studentId}`)
}

export async function setStudentStatus(id: string, status: string) {
  const { schoolId, admin } = await getContext()
  await admin.from('students').update({ status }).eq('id', id).eq('school_id', schoolId)
  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${id}`)
}
