'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

type DraftStep = {
  id: string
  label: string
  systemPrompt: string
  userPrompt: string
}

const EXAMPLES = [
  { label: 'Describe the image', systemPrompt: 'You are a precise visual analyst.', userPrompt: 'Describe everything you see in this image in detail. Include people, objects, setting, mood, and any text visible.' },
  { label: 'Find the funny angle', systemPrompt: 'You are a sharp, witty comedian.', userPrompt: 'Based on this description:\n${previousOutput}\n\nWhat is the funniest, most absurd, or most relatable thing about this scene? Give 3 comedic angles.' },
  { label: 'Write captions', systemPrompt: 'You are a viral social media caption writer.', userPrompt: 'Using these comedic angles:\n${previousOutput}\n\nWrite 5 short, punchy captions (under 60 chars each). No numbering. Raw text only.' },
]

function StepCard({
  step, index, total, onChange, onDelete, onMoveUp, onMoveDown
}: {
  step: DraftStep
  index: number
  total: number
  onChange: (id: string, field: keyof DraftStep, value: string) => void
  onDelete: (id: string) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="relative flex gap-4">
      {index < total - 1 && (
        <div className="absolute left-[22px] top-[52px] w-0.5 h-[calc(100%-4px)] bg-blue-200 dark:bg-blue-900 z-0" />
      )}
      <div className="relative z-10 shrink-0 w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow mt-1">
        {index + 1}
      </div>
      <div className="flex-1 mb-4 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 overflow-hidden">
        {/* Step header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <input
            value={step.label}
            onChange={e => onChange(step.id, 'label', e.target.value)}
            placeholder={`Step ${index + 1} label (e.g. Describe the image)`}
            className="flex-1 text-sm font-medium bg-transparent focus:outline-none placeholder-gray-400"
          />
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onMoveUp(index)} disabled={index === 0} className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20" title="Move up">↑</button>
            <button onClick={() => onMoveDown(index)} disabled={index === total - 1} className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20" title="Move down">↓</button>
            <button onClick={() => setExpanded(e => !e)} className="p-1 rounded text-gray-400 hover:text-gray-600 text-xs">{expanded ? '▲' : '▼'}</button>
            <button onClick={() => onDelete(step.id)} className="p-1 rounded text-gray-400 hover:text-red-500" title="Delete step">✕</button>
          </div>
        </div>

        {expanded && (
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                System Prompt <span className="font-normal normal-case text-gray-400">(sets the AI's role)</span>
              </label>
              <textarea
                value={step.systemPrompt}
                onChange={e => onChange(step.id, 'systemPrompt', e.target.value)}
                rows={2}
                placeholder="You are a helpful assistant that…"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                User Prompt <span className="text-red-400">*</span>
                <span className="font-normal normal-case text-gray-400 ml-1">— use <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'${previousOutput}'}</code> to chain steps</span>
              </label>
              <textarea
                value={step.userPrompt}
                onChange={e => onChange(step.id, 'userPrompt', e.target.value)}
                rows={4}
                required
                placeholder={index === 0 ? "Describe everything you see in this image…" : "Based on the previous output:\n${previousOutput}\n\nNow…"}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NewFlavorPage() {
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<DraftStep[]>([
    { id: crypto.randomUUID(), label: 'Describe the image', systemPrompt: 'You are a precise visual analyst.', userPrompt: 'Describe everything you see in this image in detail. Include people, objects, setting, mood, and any text visible.' },
    { id: crypto.randomUUID(), label: 'Find the funny angle', systemPrompt: 'You are a sharp, witty comedian.', userPrompt: 'Based on this description:\n${previousOutput}\n\nWhat is the funniest, most absurd, or most relatable thing about this scene? Give 3 comedic angles.' },
    { id: crypto.randomUUID(), label: 'Write captions', systemPrompt: 'You are a viral social media caption writer.', userPrompt: 'Using these comedic angles:\n${previousOutput}\n\nWrite 5 short, punchy captions (under 60 chars each). No numbering. Raw text only.' },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function addStep() {
    setSteps(prev => [...prev, {
      id: crypto.randomUUID(),
      label: '',
      systemPrompt: '',
      userPrompt: prev.length > 0 ? 'Based on the previous output:\n${previousOutput}\n\n' : ''
    }])
  }

  function updateStep(id: string, field: keyof DraftStep, value: string) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  function deleteStep(id: string) {
    setSteps(prev => prev.filter(s => s.id !== id))
  }

  function moveUp(index: number) {
    if (index === 0) return
    setSteps(prev => { const a = [...prev]; [a[index - 1], a[index]] = [a[index], a[index - 1]]; return a })
  }

  function moveDown(index: number) {
    if (index === steps.length - 1) return
    setSteps(prev => { const a = [...prev]; [a[index], a[index + 1]] = [a[index + 1], a[index]]; return a })
  }

  function useTemplate() {
    setSteps(EXAMPLES.map(e => ({ id: crypto.randomUUID(), ...e })))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!slug.trim()) { setError('Name is required'); return }
    if (steps.some(s => !s.userPrompt.trim())) { setError('All steps need a user prompt'); return }
    setSaving(true)
    setError('')

    const { data: flavor, error: flavorErr } = await supabase
      .from('humor_flavors')
      .insert({ slug: slug.trim(), description: description.trim() })
      .select('id')
      .single()

    if (flavorErr || !flavor) { setError(flavorErr?.message || 'Failed to create flavor'); setSaving(false); return }

    const stepsToInsert = steps.map((s, i) => ({
      humor_flavor_id: flavor.id,
      order_by: i + 1,
      description: s.label || null,
      llm_system_prompt: s.systemPrompt || null,
      llm_user_prompt: s.userPrompt,
      llm_input_type_id: i === 0 ? 1 : 2,
      llm_output_type_id: 2,
      llm_model_id: 1,
      humor_flavor_step_type_id: i === 0 ? 1 : 3,
      llm_temperature: 0.7,
    }))

    const { error: stepsErr } = await supabase.from('humor_flavor_steps').insert(stepsToInsert)
    if (stepsErr) { setError(stepsErr.message); setSaving(false); return }

    router.push(`/flavors/${flavor.id}/steps`)
    router.refresh()
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/flavors" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          ← Back to Flavors
        </Link>

        <form onSubmit={handleSubmit}>
          {/* Flavor info */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
            <h1 className="text-2xl font-bold mb-1">New Humor Flavor</h1>
            <p className="text-sm text-gray-500 mb-5">
              A flavor is a <strong>prompt chain</strong> — a sequence of steps that runs in order to generate captions from an image.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Flavor Name <span className="text-red-500">*</span></label>
                <input
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  required
                  placeholder="e.g. Dry Wit, Gen Z Chaos, Absurdist"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What makes this humor style unique?"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Steps section */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Prompt Chain Steps</h2>
              <p className="text-sm text-gray-500 mt-0.5">Each step passes its output to the next via <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{'${previousOutput}'}</code></p>
            </div>
            <button
              type="button"
              onClick={useTemplate}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Reset to example
            </button>
          </div>

          {/* How it works hint */}
          <div className="mb-5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>How it works:</strong> Step 1 takes the image → Step 2 gets Step 1's output → Step 3 gets Step 2's output → final output becomes captions.
          </div>

          <div className="relative">
            {steps.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                index={i}
                total={steps.length}
                onChange={updateStep}
                onDelete={deleteStep}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
              />
            ))}
          </div>

          {/* Add step */}
          <button
            type="button"
            onClick={addStep}
            className="w-full py-3 mb-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all font-medium"
          >
            + Add Step
          </button>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating…' : `Create Flavor with ${steps.length} Step${steps.length !== 1 ? 's' : ''}`}
            </button>
            <Link href="/flavors" className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </>
  )
}
