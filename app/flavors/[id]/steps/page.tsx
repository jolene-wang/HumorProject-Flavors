'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

type Step = {
  id: string
  order_by: number
  llm_system_prompt: string
  llm_user_prompt: string
  description: string | null
}

function SortableStep({ step, index, total, onEdit, onDelete }: {
  step: Step
  index: number
  total: number
  onEdit: (s: Step) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex gap-4 ${isDragging ? 'z-50' : ''}`}
    >
      {index < total - 1 && (
        <div className="absolute left-[22px] top-[52px] w-0.5 h-[calc(100%+16px)] bg-gray-200 dark:bg-gray-700 z-0" />
      )}
      <div className="relative z-10 shrink-0 w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm mt-1">
        {step.order_by}
      </div>
      <div className={`flex-1 mb-4 bg-white dark:bg-gray-900 border rounded-2xl p-4 shadow-sm transition-all ${isDragging ? 'opacity-60 shadow-xl border-blue-400' : 'border-gray-200 dark:border-gray-800'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {step.description && (
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">{step.description}</p>
            )}
            {step.llm_system_prompt && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">System Prompt</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-2">{step.llm_system_prompt}</p>
              </div>
            )}
            {step.llm_user_prompt && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">User Prompt</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">{step.llm_user_prompt}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              {...attributes}
              {...listeners}
              className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-grab active:cursor-grabbing transition-colors"
              title="Drag to reorder"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
                <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
                <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
              </svg>
            </button>
            <button onClick={() => onEdit(step)} className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950 transition-colors" title="Edit">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button onClick={() => onDelete(step.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors" title="Delete">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StepsPage() {
  const { id } = useParams<{ id: string }>()
  const [flavorName, setFlavorName] = useState('')
  const [steps, setSteps] = useState<Step[]>([])
  const [editing, setEditing] = useState<Step | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const loadSteps = useCallback(async () => {
    const [{ data: flavor }, { data: stepsData }] = await Promise.all([
      supabase.from('humor_flavors').select('slug').eq('id', id).single(),
      supabase.from('humor_flavor_steps').select('id, order_by, llm_system_prompt, llm_user_prompt, description').eq('humor_flavor_id', id).order('order_by')
    ])
    if (flavor) setFlavorName(flavor.slug)
    if (stepsData) setSteps(stepsData)
    setLoading(false)
  }, [id])

  useEffect(() => { loadSteps() }, [loadSteps])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = steps.findIndex(s => s.id === active.id)
    const newIndex = steps.findIndex(s => s.id === over.id)
    const reordered = arrayMove(steps, oldIndex, newIndex).map((s, i) => ({ ...s, order_by: i + 1 }))
    setSteps(reordered)
    await Promise.all(reordered.map(s =>
      supabase.from('humor_flavor_steps').update({ order_by: s.order_by }).eq('id', s.id)
    ))
  }

  function openNew() {
    setEditing(null); setSystemPrompt(''); setUserPrompt(''); setDescription(''); setShowForm(true)
  }

  function openEdit(step: Step) {
    setEditing(step)
    setSystemPrompt(step.llm_system_prompt || '')
    setUserPrompt(step.llm_user_prompt || '')
    setDescription(step.description || '')
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = { llm_system_prompt: systemPrompt, llm_user_prompt: userPrompt, description }
    if (editing) {
      await supabase.from('humor_flavor_steps').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('humor_flavor_steps').insert({
        humor_flavor_id: id, order_by: steps.length + 1, ...payload
      })
    }
    setShowForm(false)
    setSaving(false)
    loadSteps()
  }

  async function handleDelete(stepId: string) {
    if (!confirm('Delete this step?')) return
    await supabase.from('humor_flavor_steps').delete().eq('id', stepId)
    const remaining = steps.filter(s => s.id !== stepId).map((s, i) => ({ ...s, order_by: i + 1 }))
    setSteps(remaining)
    await Promise.all(remaining.map(s =>
      supabase.from('humor_flavor_steps').update({ order_by: s.order_by }).eq('id', s.id)
    ))
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/flavors" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          ← Back to Flavors
        </Link>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{flavorName || '…'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{steps.length} step{steps.length !== 1 ? 's' : ''} · Drag to reorder</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/flavors/${id}/captions`} className="px-3 py-1.5 text-sm rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 hover:bg-purple-200 font-medium transition-colors">💬 Captions</Link>
            <Link href={`/flavors/${id}/test`} className="px-3 py-1.5 text-sm rounded-xl bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 hover:bg-green-200 font-medium transition-colors">🧪 Test</Link>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
            <h2 className="font-semibold mb-4 text-blue-900 dark:text-blue-100">
              {editing ? `Edit Step ${editing.order_by}` : `New Step ${steps.length + 1}`}
            </h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-blue-900 dark:text-blue-200">Label <span className="font-normal text-blue-500">(optional)</span></label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Describe the image, Add humor"
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-blue-900 dark:text-blue-200">System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  rows={4}
                  placeholder="You are a helpful assistant that…"
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-blue-900 dark:text-blue-200">User Prompt <span className="text-red-500">*</span></label>
                <textarea
                  value={userPrompt}
                  onChange={e => setUserPrompt(e.target.value)}
                  required
                  rows={5}
                  placeholder="Describe the image in detail. Use $&#123;previousOutput&#125; to reference the previous step."
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Step'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && <div className="py-12 text-center text-gray-400 text-sm">Loading steps…</div>}

        {!loading && !steps.length && !showForm && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <div className="text-4xl">🔗</div>
            <p className="text-gray-500 font-medium">No steps yet</p>
            <p className="text-gray-400 text-sm text-center max-w-xs">Add steps to build your prompt chain.</p>
            <button onClick={openNew} className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">Add First Step</button>
          </div>
        )}

        {!loading && steps.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="relative">
                {steps.map((step, i) => (
                  <SortableStep key={step.id} step={step} index={i} total={steps.length} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {!loading && !showForm && (
          <button onClick={openNew} className="mt-2 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all font-medium">
            + Add Step
          </button>
        )}
      </main>
    </>
  )
}
