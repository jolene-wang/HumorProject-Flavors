'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteFlavorButton({ id }: { id: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm('Delete this flavor and all its steps?')) return
    await supabase.from('humor_flavor_steps').delete().eq('flavor_id', id)
    await supabase.from('humor_flavors').delete().eq('id', id)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="px-3 py-1.5 text-sm rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
    >
      Delete
    </button>
  )
}
