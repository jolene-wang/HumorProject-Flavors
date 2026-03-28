'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

export default function EditFlavorPage() {
  const { id } = useParams<{ id: string }>()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('humor_flavors').select('name, description').eq('id', id).single()
      .then(({ data }) => {
        if (data) { setName(data.name); setDescription(data.description || '') }
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.from('humor_flavors').update({ name, description }).eq('id', id)
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/flavors')
    router.refresh()
  }

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/flavors" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">← Back</Link>
          <h1 className="text-xl font-bold">Edit Humor Flavor</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </main>
    </>
  )
}
