'use client'
import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { useParams, useRouter, usePathname } from 'next/navigation'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, profile, setProfile, setProfessionalDetails, setLoading } = useAuthStore()
  const { setCountry, setState, setCity, setLocale } = useAppStore()
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()

  // Redirect if URL locale doesn't match profile's language setting
  useEffect(() => {
    if (profile?.language && params?.locale && profile.language !== params.locale) {
      const segments = pathname.split('/')
      if (segments[1] === params.locale) {
        segments[1] = profile.language
        const newPath = segments.join('/')
        router.replace(newPath)
      }
    }
  }, [profile?.language, params?.locale, pathname, router])

  useEffect(() => {
    const fetchUserData = async (userId: string) => {
      // Fetch profile and details with explicit casting to avoid 'never' type errors
      const { data: profile } = await (supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single() as any)

      const { data: professionalDetails } = await (supabase
        .from('professional_details')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle() as any)
      
      if (profile) {
        setProfile(profile)
        if (profile.country_code) setCountry(profile.country_code)
        if (profile.state) setState(profile.state)
        if (profile.city) setCity(profile.city)
        if (profile.language) setLocale(profile.language as any)
      }
      setProfessionalDetails(professionalDetails)
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchUserData(user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserData(session.user.id)
      } else {
        setProfile(null)
        setProfessionalDetails(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line

  return (
    <SessionProvider>{children}</SessionProvider>
  );
}
