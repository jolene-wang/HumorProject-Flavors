'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

export default function EditFlavorPage() {
  const { id } = useParams<{ id: string }>()
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('humor_flavors').select('slug, description').eq('id', id).single()
      .then(({ data }) => {
        if (data) { setSlug(data.slug); setDescription(data.description || '') }
        setFetching(false)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.from('humor_flavors').update({ slug, description }).eq('id', id)
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/flavors')
    router.refresh()
  }

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-6 py-8">
        <Link href="/flavors" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          ← Back to Flavors
        </Link>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h1 className="text-2xl font-bold mb-1">Edit Humor Flavor</h1>
          <p className="text-sm text-gray-500 mb-6">Update the name and description of this flavor.</p>
          {fetching ? (
            <div className="py-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Name <span className="text-red-500">*</span></label>
                <input
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors">
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
                <Link href="/flavors" className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  )
}
