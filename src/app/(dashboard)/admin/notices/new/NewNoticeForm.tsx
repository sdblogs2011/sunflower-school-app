'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createNotice } from '../actions'

type ClassSection = { id: string; class_name: string }

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" name="publish_now" value={label === 'Publish Now' ? 'true' : 'false'}
      disabled={pending}
      className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50
        ${label === 'Publish Now'
          ? 'bg-amber-400 hover:bg-amber-500 text-gray-900'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
      {pending ? 'Saving…' : label}
    </button>
  )
}

export default function NewNoticeForm({ classSections }: { classSections: ClassSection[] }) {
  const [audienceType, setAudienceType] = useState<'all' | 'class' | 'role'>('all')
  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form action={createNotice} className="space-y-5">
      <div>
        <label className={labelCls}>Title <span className="text-red-400">*</span></label>
        <input name="title" required className={inputCls} placeholder="Notice title…" />
      </div>
      <div>
        <label className={labelCls}>Body <span className="text-red-400">*</span></label>
        <textarea name="body" required rows={6} className={inputCls} placeholder="Notice content…" />
      </div>

      {/* Audience */}
      <div>
        <label className={labelCls}>Audience</label>
        <input type="hidden" name="audience_type" value={audienceType} />
        <div className="flex gap-2">
          {(['all', 'class', 'role'] as const).map(t => (
            <button key={t} type="button" onClick={() => setAudienceType(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors
                ${audienceType === t ? 'bg-amber-400 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t === 'all' ? 'All School' : t === 'class' ? 'Class' : 'Role'}
            </button>
          ))}
        </div>
        {audienceType === 'class' && (
          <select name="class_section_id" required className={`${inputCls} mt-2`}>
            <option value="">Select class…</option>
            {classSections.map(cs => (
              <option key={cs.id} value={cs.id}>{cs.class_name}</option>
            ))}
          </select>
        )}
        {audienceType === 'role' && (
          <select name="role" required className={`${inputCls} mt-2`}>
            <option value="">Select role…</option>
            <option value="student">Students</option>
            <option value="parent">Parents</option>
            <option value="teacher">Teachers</option>
            <option value="staff">Staff</option>
          </select>
        )}
      </div>

      <div className="flex gap-3">
        <SubmitBtn label="Save as Draft" />
        <SubmitBtn label="Publish Now" />
      </div>
    </form>
  )
}
