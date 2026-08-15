import { useCallback, useEffect, useState } from 'react'
import type { ThemeMode } from '@/types/civic'
import { saveToStorage } from '@/utils/storage'

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const raw = localStorage.getItem('civic-sathi:theme')
      if (raw) return JSON.parse(raw) as ThemeMode
    } catch {
      // ignore
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
    saveToStorage('theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  return { theme, toggleTheme }
}
