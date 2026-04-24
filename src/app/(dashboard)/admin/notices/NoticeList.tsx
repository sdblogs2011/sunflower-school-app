'use client'

import { useState } from 'react'
import Link from 'next/link'

type Notice = {
  id: string; title: string; publish_status: string
  published_at: string | null; created_at: string; audience: string
}

const statusBadge: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-50 text-green-700',
  archived: 'bg-red-50 text-red-500',
}

export default function NoticeList({ notices }: { notices: Notice[] }) {
  const [tab, setTab] = useState<'all' | 'draft' | 'published' | 'archived'>('all')

  const filtered = tab === 'all' ? notices : notices.filter(n => n.publish_status === tab)

  const count = (s: string) => notices.filter(n => n.publish_status === s).length

  const tabs = [
    { key: 'all', label: `All (${notices.length})` },
    { key: 'draft', label: `Draft (${count('draft')})` },
    { key: 'published', label: `Published (${count('published')})` },
    { key: 'archived', label: `Archived (${count('archived')})` },
  ] as const

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-100">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg
              ${tab === t.key ? 'bg-amber-400 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">No notices found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => (
            <Link key={n.id} href={`/admin/notices/${n.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-5 py-4 hover:border-amber-300 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {n.audience} · {n.published_at
                    ? `Published ${new Date(n.published_at).toLocaleDateString('en-IN')}`
                    : `Created ${new Date(n.created_at).toLocaleDateString('en-IN')}`}
                </p>
              </div>
              <span className={`ml-4 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusBadge[n.publish_status] ?? 'bg-gray-100 text-gray-500'}`}>
                {n.publish_status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
