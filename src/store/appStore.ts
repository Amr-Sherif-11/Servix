import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Locale } from '@/i18n/config'

interface AppState {
  locale: Locale
  country: string
  state: string
  city: string
  darkMode: boolean
  onboardingDone: boolean
  setLocale: (locale: Locale) => void
  setCountry: (country: string) => void
  setState: (state: string) => void
  setCity: (city: string) => void
  toggleDarkMode: () => void
  setDarkMode: (dark: boolean) => void
  setOnboardingDone: (done: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: 'en',
      country: '',
      state: '',
      city: '',
      darkMode: true,
      onboardingDone: false,
      setLocale: (locale) => {
        set({ locale })
        if (typeof window !== 'undefined') {
          document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`
        }
      },
      setCountry: (country) => set({ country }),
      setState: (state) => set({ state }),
      setCity: (city) => set({ city }),
      toggleDarkMode: () => set((state) => {
        const next = !state.darkMode
        if (next) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        return { darkMode: next }
      }),
      setDarkMode: (darkMode) => {
        if (darkMode) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        set({ darkMode })
      },
      setOnboardingDone: (onboardingDone) => set({ onboardingDone }),
    }),
    { name: 'servix-app' }
  )
)
