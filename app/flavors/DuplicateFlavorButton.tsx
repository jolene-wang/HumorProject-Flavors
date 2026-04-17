'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DuplicateFlavorButton({ id, name }: { id: number; name: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDuplicate() {
    const newName = prompt('Name for the duplicate flavor:', `${name} (Copy)`)
    if (!newName?.trim()) return

    setLoading(true)
    try {
      // Fetch original flavor
      const { data: original } = await supabase
        .from('humor_flavors')
        .select('description')
        .eq('id', id)
        .single()

      // Insert new flavor
      const { data: newFlavor, error: flavorErr } = await supabase
        .from('humor_flavors')
        .insert({ slug: newName.trim(), description: original?.description || null })
        .select('id')
        .single()

      if (flavorErr || !newFlavor) throw new Error(flavorErr?.message || 'Failed to duplicate')

      // Fetch original steps
      const { data: steps } = await supabase
        .from('humor_flavor_steps')
        .select('order_by, description, llm_system_prompt, llm_user_prompt, llm_input_type_id, llm_output_type_id, llm_model_id, humor_flavor_step_type_id, llm_temperature')
        .eq('humor_flavor_id', id)
        .order('order_by')

      // Insert copied steps
      if (steps?.length) {
        const { error: stepsErr } = await supabase
          .from('humor_flavor_steps')
          .insert(steps.map(s => ({ ...s, humor_flavor_id: newFlavor.id })))
        if (stepsErr) throw new Error(stepsErr.message)
      }

      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Duplicate failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      className="px-3 py-1.5 text-sm rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900 font-medium transition-colors disabled:opacity-50"
      title="Duplicate flavor"
    >
      {loading ? '…' : '⧉ Dupe'}
    </button>
  )
}
