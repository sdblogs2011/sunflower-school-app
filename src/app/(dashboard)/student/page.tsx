import { createClient } from '@/lib/supabase/server'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles').select('full_name').eq('user_id', user!.id).single()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Hello, {profile?.full_name?.split(' ')[0]} 👋
      </h1>
      <p className="text-sm text-gray-500 mb-8">Your school day at a glance.</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Attendance %', value: '—', icon: '✅', color: 'bg-green-50 text-green-700' },
          { label: 'Homework Due', value: '—', icon: '📚', color: 'bg-amber-50 text-amber-700' },
          { label: 'Upcoming Exams', value: '—', icon: '📝', color: 'bg-blue-50 text-blue-700' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${card.color} mb-3`}>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <p className="text-sm text-gray-400 text-center py-8">
          Your latest homework and notices will appear here.
        </p>
      </div>
    </div>
  )
}
