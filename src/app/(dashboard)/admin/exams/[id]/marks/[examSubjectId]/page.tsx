import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import MarksEntry from './MarksEntry'

export default async function MarksPage({ params }: { params: Promise<{ id: string; examSubjectId: string }> }) {
  const { id: examId, examSubjectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id

  // Verify exam belongs to school
  const { data: exam } = await admin
    .from('exams').select('id, name').eq('id', examId).eq('school_id', schoolId).single()
  if (!exam) notFound()

  const { data: es } = await admin
    .from('exam_subjects')
    .select('id, exam_id, class_section_id, subject_id, max_marks, pass_marks, subjects(name), class_sections(classes(name))')
    .eq('id', examSubjectId).eq('exam_id', examId).single()
  if (!es) notFound()

  // Get students enrolled in this class section
  const { data: enrollments } = await admin
    .from('student_enrollments')
    .select('student_id, roll_number, students(id, full_name)')
    .eq('class_section_id', (es as any).class_section_id)
    .order('roll_number')

  const students = (enrollments ?? []).map((e: any) => ({
    id: e.students?.id,
    full_name: e.students?.full_name ?? '',
    roll_number: e.roll_number,
  })).filter((s: any) => s.id)

  // Get existing marks
  const { data: existingMarks } = await admin
    .from('marks_records')
    .select('student_id, marks_obtained, is_absent')
    .eq('exam_subject_id', examSubjectId)

  const className = (es as any).class_sections?.classes?.name ?? 'Unknown'
  const subjectName = (es as any).subjects?.name ?? 'Unknown'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/admin/exams/${examId}`} className="text-sm text-gray-500 hover:text-gray-700">← {exam.name}</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Enter Marks</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {className} · {subjectName}
      </p>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">No students enrolled in this class.</p>
        </div>
      ) : (
        <MarksEntry
          examSubjectId={examSubjectId}
          students={students}
          existingMarks={(existingMarks ?? []) as any}
          maxMarks={Number((es as any).max_marks)}
          passMarks={(es as any).pass_marks ? Number((es as any).pass_marks) : null}
        />
      )}
    </div>
  )
}
