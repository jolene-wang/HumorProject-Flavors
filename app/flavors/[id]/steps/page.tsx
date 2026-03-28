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

type Step = { id: string; step_order: number; prompt: string; description: string }

function SortableStep({ step, onEdit, onDelete }: {
  step: Step
  onEdit: (s: Step) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 px-1 select-none text-xl"
        title="Drag to reorder"
      >⠿</button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-blue-500">STEP {step.step_order}</span>
          {step.description && <span className="text-sm text-gray-500 truncate">{step.description}</span>}
        </div>
        <p className="text-sm whitespace-pre-wrap line-clamp-3 text-gray-700 dark:text-gray-300">{step.prompt}</p>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button onClick={() => onEdit(step)} className="px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200">Edit</button>
        <button onClick={() => onDelete(step.id)} className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200">Delete</button>
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
  const [prompt, setPrompt] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const loadSteps = useCallback(async () => {
    const [{ data: flavor }, { data: stepsData }] = await Promise.all([
      supabase.from('humor_flavors').select('name').eq('id', id).single(),
      supabase.from('humor_flavor_steps').select('*').eq('flavor_id', id).order('step_order')
    ])
    if (flavor) setFlavorName(flavor.name)
    if (stepsData) setSteps(stepsData)
  }, [id])

  useEffect(() => { loadSteps() }, [loadSteps])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = steps.findIndex(s => s.id === active.id)
    const newIndex = steps.findIndex(s => s.id === over.id)
    const reordered = arrayMove(steps, oldIndex, newIndex).map((s, i) => ({ ...s, step_order: i + 1 }))
    setSteps(reordered)
    await Promise.all(reordered.map(s =>
      supabase.from('humor_flavor_steps').update({ step_order: s.step_order }).eq('id', s.id)
    ))
  }

  function openNew() {
    setEditing(null); setPrompt(''); setDescription(''); setShowForm(true)
  }

  function openEdit(step: Step) {
    setEditing(step); setPrompt(step.prompt); setDescription(step.description || ''); setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editing) {
      await supabase.from('humor_flavor_steps').update({ prompt, description }).eq('id', editing.id)
    } else {
      await supabase.from('humor_flavor_steps').insert({
        flavor_id: id, prompt, description, step_order: steps.length + 1
      })
    }
    setShowForm(false)
    setSaving(false)
    loadSteps()
  }

  async function handleDelete(stepId: string) {
    if (!confirm('Delete this step?')) return
    await supabase.from('humor_flavor_steps').delete().eq('id', stepId)
    const remaining = steps.filter(s => s.id !== stepId).map((s, i) => ({ ...s, step_order: i + 1 }))
    setSteps(remaining)
    await Promise.all(remaining.map(s =>
      supabase.from('humor_flavor_steps').update({ step_order: s.step_order }).eq('id', s.id)
    ))
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/flavors" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">← Back</Link>
            <h1 className="text-xl font-bold">{flavorName} — Steps</h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/flavors/${id}/test`} className="px-3 py-1.5 text-sm rounded-lg bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200">Test</Link>
            <button onClick={openNew} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">+ Add Step</button>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 p-4 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950">
            <h2 className="font-semibold mb-3">{editing ? 'Edit Step' : 'New Step'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Describe the image"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  required
                  rows={4}
                  placeholder="Write the prompt for this step…"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!steps.length && !showForm && (
          <p className="text-gray-500 text-center py-16">No steps yet. Add one!</p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {steps.map(step => (
                <SortableStep key={step.id} step={step} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </main>
    </>
  )
}
