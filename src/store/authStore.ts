import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfessionalDetails = Database['public']['Tables']['professional_details']['Row']

interface AuthState {
  user: User | null
  profile: Profile | null
  professionalDetails: ProfessionalDetails | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setProfessionalDetails: (details: ProfessionalDetails | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      professionalDetails: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setProfessionalDetails: (professionalDetails) => set({ professionalDetails }),
      setLoading: (isLoading) => set({ isLoading }),
      signOut: () => set({ user: null, profile: null, professionalDetails: null }),
    }),
    {
      name: 'servix-auth',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)
