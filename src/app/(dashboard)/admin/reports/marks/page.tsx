import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MarksReport from './MarksReport'

export default async function MarksReportPage({ searchParams }: { searchParams: Promise<{ exam?: string; class?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id
  const currentExam = sp.exam ?? ''
  const currentClass = sp.class ?? ''

  const { data: session } = await admin
    .from('academic_sessions').select('id')
    .eq('school_id', schoolId).eq('is_active', true).single()

  const [{ data: exams }, { data: classSections }] = await Promise.all([
    admin.from('exams').select('id, name').eq('school_id', schoolId)
      .eq('academic_session_id', session?.id ?? '').order('created_at'),
    admin.from('class_sections').select('id, classes(name)')
      .eq('school_id', schoolId).eq('academic_session_id', session?.id ?? ''),
  ])

  const examList = (exams ?? []).map((e: any) => ({ id: e.id, name: e.name }))
  const csList = (classSections ?? []).map((cs: any) => ({ id: cs.id, class_name: cs.classes?.name ?? '' }))

  let subjects: any[] = []
  let rows: any[] = []
  let examName = ''
  let className = ''

  if (currentExam && currentClass) {
    examName = examList.find(e => e.id === currentExam)?.name ?? ''
    className = csList.find(cs => cs.id === currentClass)?.class_name ?? ''

    // Get exam subjects for this class
    const { data: examSubjects } = await admin
      .from('exam_subjects')
      .select('id, subject_id, max_marks, subjects(name)')
      .eq('exam_id', currentExam)
      .eq('class_section_id', currentClass)

    subjects = (examSubjects ?? []).map((es: any) => ({
      id: es.subject_id, examSubjectId: es.id,
      name: es.subjects?.name ?? '', maxMarks: Number(es.max_marks),
    }))

    if (subjects.length > 0) {
      // Get enrolled students
      const { data: enrollments } = await admin
        .from('student_enrollments')
        .select('student_id, roll_number, students(id, full_name)')
        .eq('class_section_id', currentClass)
        .eq('academic_session_id', session?.id ?? '')
        .order('roll_number')

      // Get all marks for these exam subjects
      const examSubjectIds = (examSubjects ?? []).map((es: any) => es.id)
      const { data: allMarks } = await admin
        .from('marks_records')
        .select('exam_subject_id, student_id, marks_obtained, is_absent')
        .in('exam_subject_id', examSubjectIds)

      // Build marks map: subjectId -> studentId -> mark
      const marksMap = new Map<string, Map<string, { obtained: number | null; absent: boolean }>>()
      for (const es of (examSubjects ?? [])) {
        marksMap.set(es.subject_id, new Map())
      }
      for (const m of (allMarks ?? [])) {
        const es = (examSubjects ?? []).find((e: any) => e.id === (m as any).exam_subject_id)
        if (es) {
          marksMap.get(es.subject_id)?.set((m as any).student_id, {
            obtained: (m as any).marks_obtained,
            absent: (m as any).is_absent,
          })
        }
      }

      // Build rows
      const rawRows = (enrollments ?? []).map((e: any) => {
        const marks: Record<string, { obtained: number | null; absent: boolean }> = {}
        let total = 0
        let maxTotal = 0
        for (const s of subjects) {
          const m = marksMap.get(s.id)?.get(e.student_id)
          marks[s.id] = m ?? { obtained: null, absent: false }
          if (m && !m.absent && m.obtained != null) total += m.obtained
          maxTotal += s.maxMarks
        }
        const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0
        return { studentId: e.student_id, name: e.students?.full_name ?? '', rollNumber: e.roll_number, marks, total, maxTotal, percentage, rank: 0 }
      })

      // Assign ranks (sort by total desc)
      rawRows.sort((a, b) => b.total - a.total)
      rawRows.forEach((r, i) => { r.rank = i + 1 })
      // Re-sort by roll number for display
      rows = rawRows.sort((a, b) => (a.rollNumber ?? 999) - (b.rollNumber ?? 999))
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/reports" className="text-sm text-gray-500 hover:text-gray-700">← Reports</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Exam Marks Report</h1>
      </div>
      <MarksReport
        rows={rows} subjects={subjects} exams={examList} classSections={csList}
        currentExam={currentExam} currentClass={currentClass}
        examName={examName} className={className}
      />
    </div>
  )
}
