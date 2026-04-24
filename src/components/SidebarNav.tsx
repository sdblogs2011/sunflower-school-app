'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, UserRole } from '@/lib/types'

const NAV_ITEMS: Record<UserRole, { label: string; href: string; icon: string }[]> = {
  principal: [
    { label: 'Dashboard', href: '/principal', icon: '📊' },
    { label: 'Students', href: '/admin/students', icon: '🎓' },
    { label: 'Staff', href: '/admin/staff', icon: '👩‍🏫' },
    { label: 'Academic Structure', href: '/admin/academic', icon: '🏫' },
    { label: 'Attendance', href: '/admin/attendance', icon: '✅' },
    { label: 'Fees', href: '/admin/fees', icon: '💰' },
    { label: 'Notices', href: '/admin/notices', icon: '📢' },
    { label: 'Homework', href: '/admin/homework', icon: '📚' },
    { label: 'Resources', href: '/admin/resources', icon: '🗂️' },
    { label: 'Reports', href: '/admin/reports', icon: '📋' },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Students', href: '/admin/students', icon: '🎓' },
    { label: 'Staff', href: '/admin/staff', icon: '👩‍🏫' },
    { label: 'Academic Structure', href: '/admin/academic', icon: '🏫' },
    { label: 'Attendance', href: '/admin/attendance', icon: '✅' },
    { label: 'Fees', href: '/admin/fees', icon: '💰' },
    { label: 'Notices', href: '/admin/notices', icon: '📢' },
    { label: 'Homework', href: '/admin/homework', icon: '📚' },
    { label: 'Resources', href: '/admin/resources', icon: '🗂️' },
    { label: 'Exams', href: '/admin/exams', icon: '📝' },
    { label: 'Reports', href: '/admin/reports', icon: '📋' },
  ],
  teacher: [
    { label: 'Dashboard', href: '/teacher', icon: '📊' },
    { label: 'My Classes', href: '/teacher/classes', icon: '🏫' },
    { label: 'Attendance', href: '/teacher/attendance', icon: '✅' },
    { label: 'Homework', href: '/teacher/homework', icon: '📚' },
    { label: 'Exams & Marks', href: '/teacher/exams', icon: '📝' },
    { label: 'Notices', href: '/teacher/notices', icon: '📢' },
  ],
  parent: [
    { label: 'Dashboard', href: '/parent', icon: '📊' },
    { label: 'Attendance', href: '/parent/attendance', icon: '✅' },
    { label: 'Fees', href: '/parent/fees', icon: '💰' },
    { label: 'Homework', href: '/parent/homework', icon: '📚' },
    { label: 'Progress', href: '/parent/progress', icon: '📈' },
    { label: 'Notices', href: '/parent/notices', icon: '📢' },
  ],
  student: [
    { label: 'Dashboard', href: '/student', icon: '📊' },
    { label: 'Attendance', href: '/student/attendance', icon: '✅' },
    { label: 'Homework', href: '/student/homework', icon: '📚' },
    { label: 'Marks', href: '/student/marks', icon: '📝' },
    { label: 'Notices', href: '/student/notices', icon: '📢' },
  ],
}

const ROLE_LABELS: Record<UserRole, string> = {
  principal: 'Principal',
  admin: 'Admin',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
}

export default function SidebarNav({ profile }: { profile: UserProfile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const navItems = NAV_ITEMS[profile.role] ?? []

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* School header */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌻</span>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Sunflower School</p>
            <p className="text-xs text-amber-600 font-medium">{ROLE_LABELS[profile.role]}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-amber-50 text-amber-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-800 truncate">{profile.full_name}</p>
        <p className="text-xs text-gray-400 truncate mb-3">{profile.email}</p>
        <button
          onClick={handleLogout}
          className="w-full text-xs text-gray-500 hover:text-red-600 text-left transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
