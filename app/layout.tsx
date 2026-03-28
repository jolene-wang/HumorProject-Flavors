import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Humor Flavors',
  description: 'Prompt chain tool for humor flavor management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){var t=localStorage.getItem('theme')||'system';var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t==='system'&&d))document.documentElement.classList.add('dark');})()`
        }} />
      </head>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
