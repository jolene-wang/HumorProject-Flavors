'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Theme = 'light' | 'dark' | 'system'

export default function Navbar() {
  const [theme, setTheme] = useState<Theme>('system')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setTheme((localStorage.getItem('theme') as Theme) || 'system')
  }, [])

  function applyTheme(t: Theme) {
    setTheme(t)
    localStorage.setItem('theme', t)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (t === 'dark' || (t === 'system' && prefersDark)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <Link href="/flavors" className="font-bold text-lg">🎭 Humor Flavors</Link>
      <div className="flex items-center gap-3">
        <select
          value={theme}
          onChange={e => applyTheme(e.target.value as Theme)}
          className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500">Sign Out</button>
      </div>
    </nav>
  )
}
