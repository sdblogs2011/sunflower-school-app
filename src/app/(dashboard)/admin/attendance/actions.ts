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

export async function saveAttendance(
  classSectionId: string,
  date: string,
  statuses: Record<string, string>
) {
  const { admin } = await getContext()

  // Get or create attendance session
  let { data: session } = await admin
    .from('attendance_sessions')
    .select('id')
    .eq('class_section_id', classSectionId)
    .eq('attendance_date', date)
    .maybeSingle()

  if (!session) {
    const { data: newSession } = await admin
      .from('attendance_sessions')
      .insert({ class_section_id: classSectionId, attendance_date: date, is_submitted: false })
      .select('id').single()
    session = newSession
  }

  if (!session) throw new Error('Failed to create attendance session')

  // Upsert all records
  const records = Object.entries(statuses).map(([studentId, status]) => ({
    attendance_session_id: session!.id,
    student_id: studentId,
    status,
  }))

  await admin.from('attendance_records').upsert(records, {
    onConflict: 'attendance_session_id,student_id',
  })

  // Mark as submitted
  await admin.from('attendance_sessions').update({
    is_submitted: true,
    submitted_at: new Date().toISOString(),
  }).eq('id', session.id)

  revalidatePath('/admin/attendance')
}
