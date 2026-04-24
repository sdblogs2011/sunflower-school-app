import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ExamDetail from './ExamDetail'

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id

  const { data: exam } = await admin
    .from('exams').select('id, name, exam_type, start_date, end_date')
    .eq('id', examId).eq('school_id', schoolId).single()
  if (!exam) notFound()

  const { data: session } = await admin
    .from('academic_sessions').select('id')
    .eq('school_id', schoolId).eq('is_active', true).single()

  const [{ data: classSections }, { data: subjects }, { data: examSubjectsRaw }] = await Promise.all([
    admin.from('class_sections')
      .select('id, classes(name)')
      .eq('school_id', schoolId)
      .eq('academic_session_id', session?.id ?? ''),
    admin.from('subjects').select('id, name').eq('school_id', schoolId).order('name'),
    admin.from('exam_subjects')
      .select('id, exam_id, class_section_id, subject_id, exam_date, max_marks, pass_marks, marks_records(id)')
      .eq('exam_id', examId)
      .order('created_at'),
  ])

  const csMap = new Map((classSections ?? []).map((cs: any) => [cs.id, cs.classes?.name ?? '']))
  const subMap = new Map((subjects ?? []).map((s: any) => [s.id, s.name]))

  const examSubjects = (examSubjectsRaw ?? []).map((es: any) => ({
    id: es.id, exam_id: es.exam_id,
    class_name: csMap.get(es.class_section_id) ?? 'Unknown',
    subject_name: subMap.get(es.subject_id) ?? 'Unknown',
    exam_date: es.exam_date,
    max_marks: Number(es.max_marks),
    pass_marks: es.pass_marks ? Number(es.pass_marks) : null,
    marks_count: es.marks_records?.length ?? 0,
  }))

  const csList = (classSections ?? []).map((cs: any) => ({ id: cs.id, class_name: cs.classes?.name ?? '' }))
  const subList = (subjects ?? []).map((s: any) => ({ id: s.id, name: s.name }))

  const TYPE_LABELS: Record<string, string> = {
    unit_test: 'Unit Test', half_yearly: 'Half Yearly', annual: 'Annual', terminal: 'Terminal', mock: 'Mock Test',
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/exams" className="text-sm text-gray-500 hover:text-gray-700">← Exams</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{exam.name}</h1>
        {exam.exam_type && (
          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
            {TYPE_LABELS[exam.exam_type] ?? exam.exam_type}
          </span>
        )}
      </div>
      {exam.start_date && (
        <p className="text-sm text-gray-400 mb-6">
          {new Date(exam.start_date).toLocaleDateString('en-IN')}
          {exam.end_date && ` – ${new Date(exam.end_date).toLocaleDateString('en-IN')}`}
        </p>
      )}
      <ExamDetail examId={examId} examSubjects={examSubjects} classSections={csList} subjects={subList} />
    </div>
  )
}
