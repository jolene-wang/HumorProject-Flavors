'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteFlavorButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm(`Delete "${name}" and all its steps? This cannot be undone.`)) return
    await supabase.from('humor_flavor_steps').delete().eq('humor_flavor_id', id)
    await supabase.from('humor_flavors').delete().eq('id', id)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="px-3 py-1.5 text-sm rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 font-medium transition-colors"
      title="Delete flavor"
    >
      🗑️ Delete
    </button>
  )
}
