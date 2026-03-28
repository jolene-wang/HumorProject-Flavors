'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Theme = 'light' | 'dark' | 'system'

const themeIcons: Record<Theme, string> = { light: '☀️', dark: '🌙', system: '💻' }

export default function Navbar() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setTheme((localStorage.getItem('theme') as Theme) || 'system')
    setMounted(true)
  }, [])

  function cycleTheme() {
    const order: Theme[] = ['system', 'light', 'dark']
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(next)
    localStorage.setItem('theme', next)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (next === 'dark' || (next === 'system' && prefersDark)) {
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
    <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <Link href="/flavors" className="flex items-center gap-2 font-bold text-base">
        <span>🎭</span>
        <span>Humor Flavors</span>
      </Link>
      <div className="flex items-center gap-2">
        {mounted && (
          <button
            onClick={cycleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-base"
            title={`Theme: ${theme}`}
          >
            {themeIcons[theme]}
          </button>
        )}
        <button
          onClick={logout}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors font-medium"
        >
          Sign Out
        </button>
      </div>
    </nav>
  )
}
