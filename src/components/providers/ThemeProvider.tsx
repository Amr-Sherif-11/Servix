'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { darkMode } = useAppStore()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return <>{children}</>
}
