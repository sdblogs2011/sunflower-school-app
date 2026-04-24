import { createClient } from '@/lib/supabase/server'

export default async function PrincipalDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles').select('full_name').eq('user_id', user!.id).single()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Good morning, {profile?.full_name?.split(' ')[0]} 👋
      </h1>
      <p className="text-sm text-gray-500 mb-8">Here's an overview of the school today.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Students', value: '—', icon: '🎓', color: 'bg-blue-50 text-blue-700' },
          { label: 'Present Today', value: '—', icon: '✅', color: 'bg-green-50 text-green-700' },
          { label: 'Fees Due', value: '—', icon: '💰', color: 'bg-amber-50 text-amber-700' },
          { label: 'Active Notices', value: '—', icon: '📢', color: 'bg-purple-50 text-purple-700' },
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
          Dashboard data will populate once modules are built (Session 1 onwards).
        </p>
      </div>
    </div>
  )
}
