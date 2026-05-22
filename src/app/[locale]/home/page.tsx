'use client'
import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Search, SlidersHorizontal, X, ChevronDown, Star, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ProfessionalCard from '@/components/professionals/ProfessionalCard'
import BottomNav from '@/components/layout/BottomNav'
import { countries, getStatesOfCountry, getCitiesOfState, professions, professionSpecializations } from '@/lib/data/locations'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import type { Locale } from '@/i18n/config'

interface HomePageProps {
  params: { locale: string }
}

type SortOption = 'rating' | 'price_asc' | 'price_desc'

export default function HomePage({ params }: HomePageProps) {
  const [locale, setLocale] = useState<string>('en')
  const t = useTranslations('home')
  const { locale: storeLocale, country: storeCountry, state: storeState, city: storeCity } = useAppStore()
  const { profile, professionalDetails } = useAuthStore()
  const supabase = createClient()

  const [professionals, setProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProfession, setSelectedProfession] = useState(professionalDetails?.profession || '')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(profile?.country_code || storeCountry || 'EG')
  const [selectedState, setSelectedState] = useState(profile?.state || storeState || '')
  const [selectedCity, setSelectedCity] = useState(profile?.city || storeCity || '')
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  const [headerVisible, setHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [translatedStates, setTranslatedStates] = useState<Record<string, string>>({})
  const [translatedCities, setTranslatedCities] = useState<Record<string, string>>({})
  const [translatedProfs, setTranslatedProfs] = useState<Record<string, string>>({})

  useEffect(() => {
    setLocale(params.locale)
  }, [params])

  useEffect(() => {
    let lastY = window.scrollY
    const handleScroll = () => {
      const currentY = window.scrollY
      // If scrolling down and past the header, hide it
      if (currentY > lastY && currentY > 80) {
        setHeaderVisible(false)
      } else {
        setHeaderVisible(true)
      }
      lastY = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (profile?.country_code) setSelectedCountry(profile.country_code)
    if (profile?.state) setSelectedState(profile.state)
    if (profile?.city) setSelectedCity(profile.city)
    if (professionalDetails?.profession) setSelectedProfession(professionalDetails.profession)
  }, [profile?.id, professionalDetails?.id, profile?.country_code, profile?.state, profile?.city, professionalDetails?.profession])

  const fetchProfessionals = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id, first_name, last_name, avatar_url, state, city, country_code,
          professional_details (profession, specialization, rating, total_reviews, price, currency, is_available)
        `)
        .eq('role', 'professional')

      if (selectedCountry) query = query.eq('country_code', selectedCountry)
      if (selectedState) query = query.eq('state', selectedState)
      if (selectedCity) query = query.eq('city', selectedCity)

      const { data } = await query
      let filtered = (data || []) as any[]

      if (search) {
        const s = search.toLowerCase()
        filtered = filtered.filter(p =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(s) ||
          (p.professional_details as any)?.profession?.toLowerCase().includes(s)
        )
      }

      if (selectedProfession) {
        filtered = filtered.filter(p => (p.professional_details as any)?.profession === selectedProfession)
      }

      if (selectedSpecialization) {
        filtered = filtered.filter(p => (p.professional_details as any)?.specialization === selectedSpecialization)
      }

      filtered.sort((a, b) => {
        const aD = a.professional_details as any
        const bD = b.professional_details as any
        if (sortBy === 'rating') return (bD?.rating || 0) - (aD?.rating || 0)
        if (sortBy === 'price_asc') return (aD?.price || 0) - (bD?.price || 0)
        if (sortBy === 'price_desc') return (bD?.price || 0) - (aD?.price || 0)
        return 0
      })

      setProfessionals(filtered)
    } finally {
      setLoading(false)
    }
  }, [search, selectedProfession, selectedSpecialization, selectedCountry, selectedState, selectedCity, sortBy]) // eslint-disable-line

  useEffect(() => {
    fetchProfessionals()
  }, [fetchProfessionals])

  // Translate city, state and profession names whenever the locale, country, or professionals change
  useEffect(() => {
    const currentLocale = (locale || storeLocale) as string
    if (currentLocale === 'en') {
      setTranslatedStates({})
      setTranslatedCities({})
      setTranslatedProfs({})
      return
    }

    const stateList = selectedCountry ? getStatesOfCountry(selectedCountry) : []
    const cityList = (selectedCountry && selectedState) ? getCitiesOfState(selectedCountry, selectedState) : []
    
    // Gather all unique states and cities from the dropdown list and visible professional search results
    const stateIdToName: Record<string, string> = {}
    const cityIdToName: Record<string, string> = {}

    // 1. Populate from active selectors
    stateList.forEach(s => { stateIdToName[s.id] = s.name.en })
    cityList.forEach(c => { cityIdToName[c.id] = c.name.en })

    // 2. Populate from search results
    professionals.forEach(p => {
      if (p.state && p.country_code && !stateIdToName[p.state]) {
        const countryStates = getStatesOfCountry(p.country_code)
        const matched = countryStates.find(s => s.id === p.state)
        stateIdToName[p.state] = matched ? matched.name.en : p.state
      }
      if (p.city && p.country_code && p.state && !cityIdToName[p.city]) {
        const stateCities = getCitiesOfState(p.country_code, p.state)
        const matched = stateCities.find(c => c.id === p.city)
        cityIdToName[p.city] = matched ? matched.name.en : p.city
      }
    })

    const stateKeys = Object.keys(stateIdToName)
    const stateVals = Object.values(stateIdToName)
    const cityKeys = Object.keys(cityIdToName)
    const cityVals = Object.values(cityIdToName)
    const profNames = professions.map(p => p.name.en)

    const allTexts = [...stateVals, ...cityVals, ...profNames]

    if (allTexts.length === 0) return

    let isMounted = true
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: allTexts, locale: currentLocale })
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted || !Array.isArray(data)) return
        
        const newStates: Record<string, string> = {}
        stateKeys.forEach((key, idx) => {
          newStates[key] = data[idx] || stateIdToName[key]
        })
        
        const newCities: Record<string, string> = {}
        cityKeys.forEach((key, idx) => {
          newCities[key] = data[stateKeys.length + idx] || cityIdToName[key]
        })
        
        const newProfs: Record<string, string> = {}
        professions.forEach((p, idx) => {
          newProfs[p.id] = data[stateKeys.length + cityKeys.length + idx] || p.name.en
        })

        setTranslatedStates(newStates)
        setTranslatedCities(newCities)
        setTranslatedProfs(newProfs)
      })
      .catch(err => console.error('Translation error:', err))

    return () => { isMounted = false }
  }, [locale, storeLocale, selectedCountry, selectedState, professionals])

  const activeLocale = (locale || storeLocale) as Locale
  const isRTL = activeLocale === 'ar'
  const countryData = countries.find(c => c.code === selectedCountry)
  const currentStates = selectedCountry ? getStatesOfCountry(selectedCountry) : []
  const currentCities = (selectedCountry && selectedState) ? getCitiesOfState(selectedCountry, selectedState) : []

  const clearFilters = () => {
    setSelectedProfession('')
    setSelectedSpecialization('')
    setSelectedCountry('')
    setSelectedState('')
    setSelectedCity('')
    setSortBy('rating')
  }

  const hasActiveFilters = selectedProfession || selectedCountry || selectedState || selectedCity || sortBy !== 'rating'

  return (
    <div className={`page-container ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Modern Horizontal Filter Bar */}
      <div 
        className={`fixed top-4 left-4 right-36 z-40 transition-all duration-500 ease-in-out transform ${
          headerVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : '-translate-y-32 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 max-w-full overflow-x-auto no-scrollbar pb-2">
          {/* Search Bar */}
          <div className="relative min-w-[180px] flex-1">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500`} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl py-2.5 ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} text-xs focus:ring-1 focus:ring-brand-500/50 outline-none text-white h-11 transition-all shadow-xl`}
              placeholder={activeLocale === 'ar' ? 'بحث عن محترف...' : t('searchPlaceholder')}
            />
          </div>

          {/* Country */}
          <div className="relative min-w-[100px]">
            <select
              value={selectedCountry}
              onChange={e => { setSelectedCountry(e.target.value); setSelectedState(''); setSelectedCity('') }}
              title={activeLocale === 'ar' ? 'اختر الدولة' : 'Select Country'}
              aria-label={activeLocale === 'ar' ? 'اختر الدولة' : 'Select Country'}
              className="w-full bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl h-11 px-4 text-xs appearance-none text-white outline-none pr-9 font-bold"
            >
              {countries.map(c => (
                <option key={c.code} value={c.code} className="bg-gray-900">{c.name[activeLocale as keyof typeof c.name] || c.name.en}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* State */}
          <div className="relative min-w-[110px]">
            <select
              value={selectedState}
              onChange={e => { setSelectedState(e.target.value); setSelectedCity('') }}
              title={activeLocale === 'ar' ? 'اختر المحافظة' : 'Select State'}
              aria-label={activeLocale === 'ar' ? 'اختر المحافظة' : 'Select State'}
              className="w-full bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl h-11 px-4 text-xs appearance-none text-white outline-none pr-9 font-bold"
            >
              <option value="">{activeLocale === 'ar' ? 'المحافظة' : 'State'}</option>
              {currentStates.map(s => (
                <option key={s.id} value={s.id} className="bg-gray-900">
                  {translatedStates[s.id] || s.name.en}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* City */}
          <div className="relative min-w-[110px]">
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              title={activeLocale === 'ar' ? 'اختر المنطقة' : 'Select Region'}
              aria-label={activeLocale === 'ar' ? 'اختر المنطقة' : 'Select Region'}
              className="w-full bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl h-11 px-4 text-xs appearance-none text-white outline-none pr-9 font-bold"
            >
              <option value="">{activeLocale === 'ar' ? 'المنطقة' : 'Region'}</option>
              {currentCities.map(c => (
                <option key={c.id} value={c.id} className="bg-gray-900">
                  {translatedCities[c.id] || c.name.en}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Profession */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedProfession}
              onChange={e => { setSelectedProfession(e.target.value); setSelectedSpecialization('') }}
              title={activeLocale === 'ar' ? 'اختر المهنة' : 'Select Profession'}
              aria-label={activeLocale === 'ar' ? 'اختر المهنة' : 'Select Profession'}
              className="w-full bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl h-11 px-4 text-xs appearance-none text-brand-400 outline-none pr-9 font-black"
            >
              {professions.map(p => (
                <option key={p.id} value={p.id} className="bg-gray-900 text-white">
                  {translatedProfs[p.id] || p.name[activeLocale as keyof typeof p.name] || p.name.en}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Specialization - only when profession has specializations */}
          {selectedProfession && professionSpecializations[selectedProfession] && (
            <div className="relative min-w-[130px]">
              <select
                value={selectedSpecialization}
                onChange={e => setSelectedSpecialization(e.target.value)}
                title={activeLocale === 'ar' ? 'اختر التخصص' : 'Select Specialization'}
                aria-label={activeLocale === 'ar' ? 'اختر التخصص' : 'Select Specialization'}
                className="w-full bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl h-11 px-4 text-xs appearance-none text-amber-400 outline-none pr-9 font-black"
              >
                <option value="" className="bg-gray-900 text-white">{activeLocale === 'ar' ? 'كل التخصصات' : 'All Specializations'}</option>
                {professionSpecializations[selectedProfession].map(s => (
                  <option key={s.id} value={s.id} className="bg-gray-900 text-white">{activeLocale === 'ar' ? s.ar : s.en}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          )}

          {/* Sort Buttons */}
          <button 
            onClick={() => setSortBy(sortBy === 'rating' ? 'price_asc' : 'rating')}
            className={`flex items-center gap-2 h-11 px-5 rounded-xl text-xs font-black shadow-xl whitespace-nowrap transition-all active:scale-95 ${sortBy === 'rating' ? 'bg-brand-600 text-white shadow-brand-600/40' : 'bg-gray-800 text-gray-400 border border-white/5 shadow-none'}`}
          >
            {activeLocale === 'ar' ? 'الأعلى تقييماً' : t('topRated')}
            <Star className={`w-4 h-4 ${sortBy === 'rating' ? 'fill-white text-white' : 'text-gray-400'}`} />
          </button>

          <button 
            onClick={() => setSortBy(sortBy === 'price_asc' ? 'rating' : 'price_asc')}
            className={`flex items-center gap-2 h-11 px-5 rounded-xl text-xs font-black shadow-xl whitespace-nowrap transition-all active:scale-95 ${sortBy === 'price_asc' ? 'bg-brand-600 text-white shadow-brand-600/40' : 'bg-gray-800 text-gray-400 border border-white/5 shadow-none'}`}
          >
            {activeLocale === 'ar' ? 'الأقل سعراً' : t('lowestPrice', { defaultValue: 'Lowest Price' })}
            <DollarSign className={`w-4 h-4 ${sortBy === 'price_asc' ? 'text-white' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-24 pt-24">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 flex gap-4 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('noProfessionalsFound')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('adjustFilters')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('resultsCount', { count: professionals.length })}</p>
            {professionals.map(pro => (
              <ProfessionalCard key={pro.id} professional={pro} locale={activeLocale} translatedStates={translatedStates} translatedCities={translatedCities} />
            ))}
          </div>
        )}
      </div>

      <BottomNav locale={activeLocale} />
    </div>
  )
}
