'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import SidebarNav from './SidebarNav'
import type { UserProfile } from '@/lib/types'

export default function Shell({ profile, children }: { profile: UserProfile; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Desktop sidebar (always visible md+) ── */}
      <div className="hidden md:block flex-shrink-0">
        <SidebarNav profile={profile} />
      </div>

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div className={`
        fixed top-0 left-0 h-full z-50 md:hidden
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarNav profile={profile} />
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg">🌻</span>
          <span className="text-sm font-bold text-gray-900">Sunflower School</span>
          <span className="ml-auto text-xs text-amber-600 font-medium capitalize">{profile.role}</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
