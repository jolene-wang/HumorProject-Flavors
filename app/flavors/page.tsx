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
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <div className="text-5xl">🔒</div>
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-gray-500 text-sm">You need superadmin or matrix admin privileges.</p>
        </div>
      </>
    )
  }

  const { data: flavors } = await supabase
    .from('humor_flavors')
    .select('id, slug, description, created_datetime_utc')
    .order('created_datetime_utc', { ascending: false })

  const { data: stepCounts } = await supabase
    .from('humor_flavor_steps')
    .select('humor_flavor_id')

  const countMap: Record<string, number> = {}
  stepCounts?.forEach(s => {
    countMap[s.humor_flavor_id] = (countMap[s.humor_flavor_id] || 0) + 1
  })

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Humor Flavors</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              Build prompt chains to generate captions from images
            </p>
          </div>
          <Link
            href="/flavors/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <span className="text-lg leading-none">+</span> New Flavor
          </Link>
        </div>

        {!flavors?.length && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <div className="text-5xl">🎭</div>
            <p className="text-gray-500 font-medium">No humor flavors yet</p>
            <Link href="/flavors/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              Create your first flavor
            </Link>
          </div>
        )}

        <div className="grid gap-4">
          {flavors?.map(f => (
            <div key={f.id} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-lg font-semibold truncate">{f.slug}</h2>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium border border-blue-100 dark:border-blue-900">
                      {countMap[f.id] ?? 0} step{(countMap[f.id] ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {f.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{f.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Created {new Date(f.created_datetime_utc).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/flavors/${f.id}/steps`} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors">⚙️ Steps</Link>
                  <Link href={`/flavors/${f.id}/test`} className="px-3 py-1.5 text-sm rounded-lg bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 hover:bg-green-200 font-medium transition-colors">🧪 Test</Link>
                  <Link href={`/flavors/${f.id}/captions`} className="px-3 py-1.5 text-sm rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 hover:bg-purple-200 font-medium transition-colors">💬 Captions</Link>
                  <Link href={`/flavors/${f.id}`} className="px-3 py-1.5 text-sm rounded-lg bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 font-medium transition-colors">✏️ Edit</Link>
                  <DeleteFlavorButton id={f.id} name={f.slug} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
