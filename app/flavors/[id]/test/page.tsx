'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

export default function TestFlavorPage() {
  const { id } = useParams<{ id: string }>()
  const [flavorName, setFlavorName] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [captions, setCaptions] = useState<string[]>([])
  const [rawResponse, setRawResponse] = useState<string>('')
  const [error, setError] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    const [{ data: flavor }, { data: { session } }] = await Promise.all([
      supabase.from('humor_flavors').select('name').eq('id', id).single(),
      supabase.auth.getSession()
    ])
    if (flavor) setFlavorName(flavor.name)
    if (session) setToken(session.access_token)
  }, [id])

  useEffect(() => { load() }, [load])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setCaptions([])
    setRawResponse('')
    setError('')
  }

  async function handleGenerate() {
    if (!imageFile || !token) return
    setLoading(true)
    setError('')
    setCaptions([])
    setRawResponse('')
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('humor_flavor_id', id)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/captions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const text = await res.text()
      if (!res.ok) throw new Error(`API error ${res.status}: ${text}`)

      let data: unknown
      try { data = JSON.parse(text) } catch { data = text }

      setRawResponse(typeof data === 'string' ? data : JSON.stringify(data, null, 2))

      // Normalize response into string array
      if (Array.isArray(data)) {
        setCaptions(data.map((c: unknown) =>
          typeof c === 'string' ? c : (c as Record<string, string>).caption ?? JSON.stringify(c)
        ))
      } else if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>
        if (Array.isArray(obj.captions)) {
          setCaptions(obj.captions.map((c: unknown) =>
            typeof c === 'string' ? c : (c as Record<string, string>).caption ?? JSON.stringify(c)
          ))
        } else {
          setCaptions([JSON.stringify(data, null, 2)])
        }
      } else {
        setCaptions([String(data)])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/flavors/${id}/steps`} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">← Steps</Link>
          <h1 className="text-xl font-bold">Test: {flavorName}</h1>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Upload Test Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
            />
          </div>

          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="max-h-64 rounded-xl border border-gray-200 dark:border-gray-700 object-contain" />
          )}

          <button
            onClick={handleGenerate}
            disabled={!imageFile || loading}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate Captions'}
          </button>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {captions.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3">Generated Captions</h2>
              <ul className="space-y-2">
                {captions.map((c, i) => (
                  <li key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rawResponse && (
            <details className="mt-4">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Raw API response</summary>
              <pre className="mt-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs overflow-auto max-h-64">{rawResponse}</pre>
            </details>
          )}
        </div>
      </main>
    </>
  )
}
