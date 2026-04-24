import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import ResourceClient from './ResourceClient'

export default async function ResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('school_id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const schoolId = profile.school_id

  const { data: session } = await admin
    .from('academic_sessions').select('id')
    .eq('school_id', schoolId).eq('is_active', true).single()

  const [{ data: classSections }, { data: subjects }] = await Promise.all([
    admin.from('class_sections')
      .select('id, classes(name)')
      .eq('school_id', schoolId)
      .eq('academic_session_id', session?.id ?? ''),
    admin.from('subjects').select('id, name').eq('school_id', schoolId).order('name'),
  ])

  const csIds = (classSections ?? []).map((cs: any) => cs.id)

  const { data: resourcesRaw } = csIds.length > 0
    ? await admin.from('resources')
        .select('id, title, description, file_url, resource_type, created_at, class_section_id, subject_id')
        .in('class_section_id', csIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const csMap = new Map((classSections ?? []).map((cs: any) => [cs.id, cs.classes?.name ?? '']))
  const subMap = new Map((subjects ?? []).map((s: any) => [s.id, s.name]))

  const resources = (resourcesRaw ?? []).map((r: any) => ({
    id: r.id, title: r.title, description: r.description,
    file_url: r.file_url, resource_type: r.resource_type,
    created_at: r.created_at,
    class_section_id: r.class_section_id,
    class_name: csMap.get(r.class_section_id) ?? 'Unknown',
    subject_name: r.subject_id ? (subMap.get(r.subject_id) ?? null) : null,
  }))

  const csList = (classSections ?? []).map((cs: any) => ({
    id: cs.id, class_name: cs.classes?.name ?? 'Unknown',
  }))

  const subList = (subjects ?? []).map((s: any) => ({ id: s.id, name: s.name }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
      </div>
      <ResourceClient classSections={csList} subjects={subList} resources={resources} />
    </div>
  )
}
