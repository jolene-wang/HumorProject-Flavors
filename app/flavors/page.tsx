import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import DeleteFlavorButton from './DeleteFlavorButton'

export default async function FlavorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin, is_matrix_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    return (
      <>
        <Navbar />
        <div className="p-8 text-center text-red-500 font-medium">Access denied. Admin only.</div>
      </>
    )
  }

  const { data: flavors } = await supabase
    .from('humor_flavors')
    .select('id, name, description, created_at')
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Humor Flavors</h1>
          <Link
            href="/flavors/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            + New Flavor
          </Link>
        </div>
        {!flavors?.length && (
          <p className="text-gray-500 text-center py-16">No flavors yet. Create one!</p>
        )}
        <ul className="space-y-3">
          {flavors?.map(f => (
            <li key={f.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div>
                <p className="font-semibold">{f.name}</p>
                {f.description && <p className="text-sm text-gray-500 mt-0.5">{f.description}</p>}
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Link href={`/flavors/${f.id}/steps`} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">Steps</Link>
                <Link href={`/flavors/${f.id}/test`} className="px-3 py-1.5 text-sm rounded-lg bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200">Test</Link>
                <Link href={`/flavors/${f.id}`} className="px-3 py-1.5 text-sm rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200">Edit</Link>
                <DeleteFlavorButton id={f.id} />
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
