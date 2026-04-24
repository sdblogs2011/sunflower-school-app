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

export async function createExam(formData: FormData) {
  const { schoolId, admin } = await getContext()
  const { data: session } = await admin
    .from('academic_sessions').select('id').eq('school_id', schoolId).eq('is_active', true).single()

  const { data: exam, error } = await admin.from('exams').insert({
    school_id: schoolId,
    academic_session_id: session?.id,
    name: (formData.get('name') as string).trim(),
    exam_type: (formData.get('exam_type') as string) || null,
    start_date: (formData.get('start_date') as string) || null,
    end_date: (formData.get('end_date') as string) || null,
  }).select('id').single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/exams')
  redirect(`/admin/exams/${exam.id}`)
}

export async function deleteExam(id: string) {
  const { schoolId, admin } = await getContext()
  await admin.from('exams').delete().eq('id', id).eq('school_id', schoolId)
  revalidatePath('/admin/exams')
}

export async function addExamSubject(examId: string, formData: FormData) {
  const { schoolId, admin } = await getContext()
  const { data: exam } = await admin.from('exams').select('id').eq('id', examId).eq('school_id', schoolId).single()
  if (!exam) throw new Error('Exam not found')

  await admin.from('exam_subjects').insert({
    exam_id: examId,
    class_section_id: formData.get('class_section_id') as string,
    subject_id: formData.get('subject_id') as string,
    exam_date: (formData.get('exam_date') as string) || null,
    max_marks: Number(formData.get('max_marks')) || 100,
    pass_marks: Number(formData.get('pass_marks')) || null,
  })

  revalidatePath(`/admin/exams/${examId}`)
}

export async function deleteExamSubject(examSubjectId: string, examId: string) {
  const { admin } = await getContext()
  await admin.from('exam_subjects').delete().eq('id', examSubjectId)
  revalidatePath(`/admin/exams/${examId}`)
}

export async function saveMarks(examSubjectId: string, formData: FormData) {
  const { admin } = await getContext()

  const entries: { exam_subject_id: string; student_id: string; marks_obtained: number | null; is_absent: boolean }[] = []

  for (const [key, value] of formData.entries()) {
    if (key.startsWith('marks_')) {
      const studentId = key.replace('marks_', '')
      const isAbsent = formData.get(`absent_${studentId}`) === 'on'
      entries.push({
        exam_subject_id: examSubjectId,
        student_id: studentId,
        marks_obtained: isAbsent ? null : (value !== '' ? Number(value) : null),
        is_absent: isAbsent,
      })
    }
  }

  if (entries.length > 0) {
    await admin.from('marks_records').upsert(entries, {
      onConflict: 'exam_subject_id,student_id',
    })
  }

  revalidatePath(`/admin/exams`)
  redirect(`/admin/exams/${(await admin.from('exam_subjects').select('exam_id').eq('id', examSubjectId).single()).data?.exam_id}`)
}
