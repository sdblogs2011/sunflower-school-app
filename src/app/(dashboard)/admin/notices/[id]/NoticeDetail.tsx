'use client'

import { useFormStatus } from 'react-dom'
import { publishNotice, archiveNotice, updateNotice } from '../actions'
import { useState } from 'react'

type Notice = {
  id: string; title: string; body: string; publish_status: string
  published_at: string | null; created_at: string; audience: string
}

function ActionBtn({ label, className }: { label: string; className: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${className}`}>
      {pending ? '…' : label}
    </button>
  )
}

export default function NoticeDetail({ notice }: { notice: Notice }) {
  const [editing, setEditing] = useState(false)
  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-green-50 text-green-700',
    archived: 'bg-red-50 text-red-500',
  }

  return (
    <div className="space-y-5">
      {/* Status bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor[notice.publish_status]}`}>
            {notice.publish_status}
          </span>
          <span className="text-xs text-gray-400">{notice.audience}</span>
          {notice.published_at && (
            <span className="text-xs text-gray-400">
              Published {new Date(notice.published_at).toLocaleDateString('en-IN')}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {notice.publish_status === 'draft' && (
            <>
              <button onClick={() => setEditing(!editing)}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                {editing ? 'Cancel' : 'Edit'}
              </button>
              <form action={publishNotice.bind(null, notice.id)}>
                <ActionBtn label="Publish" className="bg-amber-400 hover:bg-amber-500 text-gray-900" />
              </form>
            </>
          )}
          {notice.publish_status === 'published' && (
            <form action={archiveNotice.bind(null, notice.id)}>
              <ActionBtn label="Archive" className="bg-red-50 hover:bg-red-100 text-red-600" />
            </form>
          )}
        </div>
      </div>

      {/* Edit form or display */}
      {editing ? (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <form action={async (fd) => { await updateNotice(notice.id, fd); setEditing(false) }} className="space-y-4">
            <div>
              <label className={labelCls}>Title</label>
              <input name="title" required defaultValue={notice.title} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Body</label>
              <textarea name="body" required rows={8} defaultValue={notice.body} className={inputCls} />
            </div>
            <button type="submit" className="px-5 py-2 text-sm font-semibold bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-lg transition-colors">
              Save Changes
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{notice.title}</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{notice.body}</p>
        </div>
      )}
    </div>
  )
}
