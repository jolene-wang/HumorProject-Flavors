'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

type StepStatus = 'idle' | 'loading' | 'done' | 'error'

export default function TestFlavorPage() {
  const { id } = useParams<{ id: string }>()
  const [flavorName, setFlavorName] = useState('')
  const [stepCount, setStepCount] = useState(0)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [captions, setCaptions] = useState<string[]>([])
  const [error, setError] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [steps, setSteps] = useState<{ label: string; status: StepStatus }[]>([
    { label: 'Generating upload URL', status: 'idle' },
    { label: 'Uploading image', status: 'idle' },
    { label: 'Registering image', status: 'idle' },
    { label: 'Generating captions', status: 'idle' },
  ])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const API = 'https://api.almostcrackd.ai'

  const load = useCallback(async () => {
    const [{ data: flavor }, { data: stepsData }, { data: { session } }] = await Promise.all([
      supabase.from('humor_flavors').select('slug').eq('id', id).single(),
      supabase.from('humor_flavor_steps').select('id').eq('humor_flavor_id', id),
      supabase.auth.getSession()
    ])
    if (flavor) setFlavorName(flavor.slug)
    if (stepsData) setStepCount(stepsData.length)
    if (session) setToken(session.access_token)
  }, [id])

  useEffect(() => { load() }, [load])

  function resetSteps() {
    setSteps(s => s.map(step => ({ ...step, status: 'idle' })))
  }

  function setStepStatus(index: number, status: StepStatus) {
    setSteps(s => s.map((step, i) => i === index ? { ...step, status } : step))
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setCaptions([])
    setError('')
    resetSteps()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  async function handleGenerate() {
    if (!imageFile || !token) return
    setLoading(true)
    setError('')
    setCaptions([])
    resetSteps()

    try {
      // Step 1: Get presigned URL
      setStepStatus(0, 'loading')
      const presignRes = await fetch(`${API}/pipeline/generate-presigned-url`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: imageFile.type }),
      })
      if (!presignRes.ok) throw new Error(`Presign failed: ${await presignRes.text()}`)
      const { presignedUrl, cdnUrl } = await presignRes.json()
      setStepStatus(0, 'done')

      // Step 2: Upload image to S3
      setStepStatus(1, 'loading')
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': imageFile.type },
        body: imageFile,
      })
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)
      setStepStatus(1, 'done')

      // Step 3: Register image
      setStepStatus(2, 'loading')
      const registerRes = await fetch(`${API}/pipeline/upload-image-from-url`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
      })
      if (!registerRes.ok) throw new Error(`Register failed: ${await registerRes.text()}`)
      const { imageId } = await registerRes.json()
      setStepStatus(2, 'done')

      // Step 4: Generate captions
      setStepStatus(3, 'loading')
      const captionRes = await fetch(`${API}/pipeline/generate-captions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, humorFlavorId: Number(id) }),
      })
      if (!captionRes.ok) throw new Error(`Caption generation failed: ${await captionRes.text()}`)
      const data = await captionRes.json()
      setStepStatus(3, 'done')

      // Normalize response
      const list: string[] = Array.isArray(data)
        ? data.map((c: unknown) => typeof c === 'string' ? c : (c as Record<string, string>).content ?? (c as Record<string, string>).caption ?? JSON.stringify(c))
        : data?.captions
          ? data.captions.map((c: unknown) => typeof c === 'string' ? c : (c as Record<string, string>).content ?? JSON.stringify(c))
          : [JSON.stringify(data)]
      setCaptions(list)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSteps(s => s.map(step => step.status === 'loading' ? { ...step, status: 'error' } : step))
    } finally {
      setLoading(false)
    }
  }

  const statusIcon = (status: StepStatus) => {
    if (status === 'idle') return <span className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 inline-block" />
    if (status === 'loading') return (
      <svg className="animate-spin w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    )
    if (status === 'done') return <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
    return <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">✕</span>
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link href={`/flavors/${id}/steps`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          ← Back to Steps
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Test: {flavorName || '…'}</h1>
          <p className="text-sm text-gray-500 mt-1">Upload an image to run it through your {stepCount}-step prompt chain</p>
        </div>

        <div className="space-y-5">
          {/* Upload zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all ${
              dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : imagePreview ? 'border-gray-200 dark:border-gray-700'
              : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-900'
            }`}
          >
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full max-h-72 object-contain rounded-2xl" />
                <button
                  onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setCaptions([]); setError(''); resetSteps() }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xs"
                >✕</button>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
                <div className="text-4xl">🖼️</div>
                <div className="text-center">
                  <p className="font-medium text-gray-600 dark:text-gray-300">Drop an image here</p>
                  <p className="text-sm mt-0.5">or click to browse</p>
                </div>
                <p className="text-xs">JPEG, PNG, WebP, GIF, HEIC</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic" onChange={handleFileChange} className="hidden" />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!imageFile || loading || !token}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Running pipeline…' : '🚀 Generate Captions'}
          </button>

          {/* Pipeline progress */}
          {steps.some(s => s.status !== 'idle') && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pipeline Progress</p>
              <div className="space-y-2.5">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {statusIcon(step.status)}
                    <span className={`text-sm ${step.status === 'loading' ? 'text-blue-600 dark:text-blue-400 font-medium' : step.status === 'done' ? 'text-green-600 dark:text-green-400' : step.status === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              <p className="font-semibold mb-1">Error</p>
              <p>{error}</p>
            </div>
          )}

          {/* Results */}
          {captions.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="font-semibold text-sm">Generated Captions</h2>
                <span className="text-xs text-gray-400">{captions.length} caption{captions.length !== 1 ? 's' : ''}</span>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {captions.map((c, i) => (
                  <li key={i} className="px-5 py-4 flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{c}</p>
                  </li>
                ))}
              </ul>
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                <Link href={`/flavors/${id}/captions`} className="text-xs text-purple-600 dark:text-purple-400 hover:underline">
                  View all captions for this flavor →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
