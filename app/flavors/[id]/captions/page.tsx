'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

type Caption = {
  id: string
  content: string
  like_count: number
  is_public: boolean
  is_featured: boolean
  created_datetime_utc: string
}

export default function FlavorCaptionsPage() {
  const { id } = useParams<{ id: string }>()
  const [flavorName, setFlavorName] = useState('')
  const [captions, setCaptions] = useState<Caption[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = useCallback(async () => {
    const [{ data: flavor }, { data: captionsData }] = await Promise.all([
      supabase.from('humor_flavors').select('slug').eq('id', id).single(),
      supabase
        .from('captions')
        .select('id, content, like_count, is_public, is_featured, created_datetime_utc')
        .eq('humor_flavor_id', id)
        .order('created_datetime_utc', { ascending: false })
    ])
    if (flavor) setFlavorName(flavor.slug)
    setCaptions(captionsData || [])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/flavors" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          ← Back to Flavors
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{flavorName || '…'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? 'Loading…' : `${captions.length} caption${captions.length !== 1 ? 's' : ''} generated`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/flavors/${id}/steps`} className="px-3 py-1.5 text-sm rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 font-medium transition-colors">
              ⚙️ Steps
            </Link>
            <Link href={`/flavors/${id}/test`} className="px-3 py-1.5 text-sm rounded-xl bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 hover:bg-green-200 font-medium transition-colors">
              🧪 Generate More
            </Link>
          </div>
        </div>

        {loading && (
          <div className="py-16 text-center text-gray-400 text-sm">Loading captions…</div>
        )}

        {!loading && !captions.length && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <div className="text-5xl">💬</div>
            <p className="text-gray-500 font-medium">No captions yet</p>
            <p className="text-gray-400 text-sm">Test this flavor with an image to generate captions.</p>
            <Link href={`/flavors/${id}/test`} className="mt-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium">
              Generate Captions
            </Link>
          </div>
        )}

        {!loading && captions.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {captions.map((c, i) => (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{c.content}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">👍 {c.like_count ?? 0}</span>
                        {c.is_featured && (
                          <span className="flex items-center gap-1 text-yellow-500 font-medium">⭐ Featured</span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          c.is_public
                            ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}>
                          {c.is_public ? 'Public' : 'Private'}
                        </span>
                        <span className="ml-auto">
                          {new Date(c.created_datetime_utc).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </>
  )
}
