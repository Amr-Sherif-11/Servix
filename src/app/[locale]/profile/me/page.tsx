'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Moon, Sun, Globe, MapPin, Edit2, Camera, LogOut, ChevronRight, ChevronDown, Search, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import BottomNav from '@/components/layout/BottomNav'
import PremiumModal from '@/components/profile/PremiumModal'
import { countries, getStatesOfCountry, getCitiesOfState, professions, professionSpecializations } from '@/lib/data/locations'
import { locales, localeNames, type Locale } from '@/i18n/config'

interface MyProfilePageProps {
  params: { locale: string }
}

export default function MyProfilePage({ params }: MyProfilePageProps) {
  const router = useRouter()
  const { user, profile, professionalDetails, setProfile, setProfessionalDetails, signOut } = useAuthStore()
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const tAuth = useTranslations('auth.register')
  const { locale, country, state, city, darkMode, setLocale, setCountry, setState, setCity, toggleDarkMode } = useAppStore()
  const [pageLocale, setPageLocale] = useState<string>('en')
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    phone: '',
    profession: '',
    specialization: '',
    bio: '',
    price: '',
    currency: 'USD'
  })
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [countrySearch, setCountrySearch] = useState('')
  const [stateSearch, setStateSearch] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [coverOffset, setCoverOffset] = useState(50)
  const [isRepositioning, setIsRepositioning] = useState(false)
  const [showCountrySelect, setShowCountrySelect] = useState(false)
  const [showStateSelect, setShowStateSelect] = useState(false)
  const [showCitySelect, setShowCitySelect] = useState(false)
  const [translatedStates, setTranslatedStates] = useState<Record<string, string>>({})
  const [translatedCities, setTranslatedCities] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => {
    setPageLocale(params.locale)
  }, [params])

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || '',
        profession: professionalDetails?.profession || '',
        specialization: professionalDetails?.specialization || '',
        bio: professionalDetails?.bio || '',
        price: professionalDetails?.price?.toString() || '',
        currency: professionalDetails?.currency || 'USD',
      })
      setAvatarPreview(profile.avatar_url)
      setCoverPreview(profile.cover_url)
      
      // Parse cover offset from URL
      if (profile.cover_url?.includes('y=')) {
        const y = parseInt(profile.cover_url.split('y=')[1])
        setCoverOffset(isNaN(y) ? 50 : y)
      }
    }
  }, [profile, professionalDetails])

  const activeLocale = (pageLocale || locale) as Locale
  const isRTL = activeLocale === 'ar'
  const fullName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : ''
  const countryData = countries.find(c => c.code === country)
  const currentStates = country ? getStatesOfCountry(country) : []
  const currentCities = (country && state) ? getCitiesOfState(country, state) : []

  // Translate state and city names when locale or country/state changes
  useEffect(() => {
    if (activeLocale === 'en') { setTranslatedStates({}); setTranslatedCities({}); return }
    const stateList = country ? getStatesOfCountry(country) : []
    const cityList = (country && state) ? getCitiesOfState(country, state) : []
    const stateNames = stateList.map(s => s.name.en)
    const cityNames = cityList.map(c => c.name.en)
    const allTexts = [...stateNames, ...cityNames]
    
    if (allTexts.length === 0) return
    let isMounted = true
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: allTexts, locale: activeLocale })
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted || !Array.isArray(data)) return
        const newStates: Record<string, string> = {}
        stateList.forEach((s, i) => { newStates[s.id] = data[i] || s.name.en })
        const newCities: Record<string, string> = {}
        cityList.forEach((c, i) => { newCities[c.id] = data[stateNames.length + i] || c.name.en })
        setTranslatedStates(newStates)
        setTranslatedCities(newCities)
      })
      .catch(err => console.error('Translation error:', err))
    return () => { isMounted = false }
  }, [activeLocale, country, state])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    signOut()
    router.push('/auth/login')
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      let avatarUrl = profile?.avatar_url
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `avatars/${user.id}.${ext}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
        if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`)
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = data.publicUrl
      }

      let coverUrl = profile?.cover_url
      if (coverFile) {
        const ext = coverFile.name.split('.').pop()
        const path = `covers/${user.id}.${ext}`
        const { error: uploadError } = await supabase.storage.from('covers').upload(path, coverFile, { upsert: true })
        if (uploadError) throw new Error(`Cover upload failed: ${uploadError.message}`)
        const { data } = supabase.storage.from('covers').getPublicUrl(path)
        coverUrl = data.publicUrl
      }
      
      if (coverUrl) {
        // Append position to URL (removing any old one)
        const baseUrl = coverUrl.split('?')[0]
        coverUrl = `${baseUrl}?y=${coverOffset}`
      }

      const { data: updatedProfile, error: profileError } = await (supabase.from('profiles') as any).upsert({
        id: user.id,
        role: profile?.role || 'user',
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        country_code: country || null,
        state: state || null,
        city: city || null,
        language: activeLocale,
        dark_mode: darkMode,
      }).select().single()

      if (profileError) throw profileError
      if (updatedProfile) setProfile(updatedProfile)

      // Update Professional Details if user is professional
      if (profile?.role === 'professional') {
        const { data: updatedDetails, error: detailsError } = await (supabase.from('professional_details') as any).upsert({
          profile_id: user.id,
          profession: formData.profession,
          specialization: formData.specialization,
          bio: formData.bio,
          price: parseFloat(formData.price) || 0,
          currency: formData.currency,
        }, { onConflict: 'profile_id' }).select().single()

        if (detailsError) throw detailsError
        if (updatedDetails) setProfessionalDetails(updatedDetails)
      }
      
      alert(t('changesSaved', { defaultValue: 'Changes saved successfully' }))
    } catch (err: any) {
      console.error('Save error:', err)
      alert(`${t('saveError', { defaultValue: 'Save error' })}: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  return (
    <div className={`page-container ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header / Cover */}
      <div className={`relative h-52 overflow-hidden group ${isRepositioning ? 'cursor-ns-resize' : ''}`}>
        {coverPreview ? (
          <Image 
            src={coverPreview} 
            alt="Cover" 
            fill
            className="object-cover select-none pointer-events-none"
            style={{ objectPosition: `50% ${coverOffset}%` }}
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-600 via-purple-600 to-pink-600" />
        )}
        
        {isRepositioning && (
          <div 
            className="absolute inset-0 z-20"
            onMouseDown={(e) => {
              const startY = e.clientY;
              const startOffset = coverOffset;
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaY = moveEvent.clientY - startY;
                const newOffset = Math.max(0, Math.min(100, startOffset - (deltaY / 2)));
                setCoverOffset(newOffset);
              };
              const handleMouseUp = () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
              };
              window.addEventListener('mousemove', handleMouseMove);
              window.addEventListener('mouseup', handleMouseUp);
            }}
            onTouchStart={(e) => {
              const startY = e.touches[0].clientY;
              const startOffset = coverOffset;
              const handleTouchMove = (moveEvent: TouchEvent) => {
                const deltaY = moveEvent.touches[0].clientY - startY;
                const newOffset = Math.max(0, Math.min(100, startOffset - (deltaY / 2)));
                setCoverOffset(newOffset);
              };
              const handleTouchEnd = () => {
                window.removeEventListener('touchmove', handleTouchMove);
                window.removeEventListener('touchend', handleTouchEnd);
              };
              window.addEventListener('touchmove', handleTouchMove);
              window.addEventListener('touchend', handleTouchEnd);
            }}
          />
        )}

        {/* Cover Controls */}
        <div className="absolute top-4 right-4 z-30 flex gap-2">
          {coverPreview && (
            <button
              type="button"
              onClick={() => setIsRepositioning(!isRepositioning)}
              title={t('repositionCover', { defaultValue: 'Reposition cover' })}
              aria-label={t('repositionCover', { defaultValue: 'Reposition cover' })}
              className={`w-10 h-10 glass rounded-xl flex items-center justify-center transition-all shadow-lg ${
                isRepositioning ? 'bg-brand-500 text-white' : 'text-white hover:bg-white/30'
              }`}
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => document.getElementById('cover-upload')?.click()}
            title={t('changeCoverPhoto', { defaultValue: 'Change cover photo' })}
            aria-label={t('changeCoverPhoto', { defaultValue: 'Change cover photo' })}
            className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-lg"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input 
            id="cover-upload" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleCoverChange}
            aria-label={t('uploadCoverPhoto', { defaultValue: 'Upload cover photo' })}
          />
        </div>
        
        {isRepositioning && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center z-30">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold animate-bounce">
              {t('dragToReposition', { defaultValue: 'Drag to reposition' })}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      <div className="px-4">
        {/* Avatar */}
        <div className="flex items-end -mt-12 mb-4 gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 border-4 border-white dark:border-gray-950 overflow-hidden shadow-xl">
              {avatarPreview ? (
                <Image src={avatarPreview} alt={fullName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                  {(profile?.first_name?.[0] || user?.email?.[0] || '?').toUpperCase()}
                </div>
              )}
            </div>
            <label 
              title={t('changeProfilePhoto', { defaultValue: 'Change profile photo' })}
              aria-label={t('changeProfilePhoto', { defaultValue: 'Change profile photo' })}
              className="absolute -bottom-1 -right-3 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-brand-700 transition-all duration-300 border-2 border-white dark:border-gray-950"
            >
              <Camera className="w-4 h-4 text-white" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarChange}
                aria-label={t('uploadProfilePhoto', { defaultValue: 'Upload profile photo' })}
              />
            </label>
          </div>
          <div className="pb-1">
            <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
              {formData.firstName || profile?.first_name}
            </h1>
            <div className="flex flex-col gap-0.5">
              {formData.profession && (
                <p className={`font-bold text-sm drop-shadow-sm ${
                  formData.profession === 'doctor' ? 'text-green-400' :
                  formData.profession === 'programmer' ? 'text-sky-400' :
                  formData.profession === 'engineer' ? 'text-orange-300' :
                  formData.profession === 'teacher' ? 'text-white' :
                  formData.profession === 'plumber' ? 'text-yellow-400' :
                  formData.profession === 'painter' ? 'text-stone-100' :
                  formData.profession === 'carpenter' ? 'text-amber-700' :
                  formData.profession === 'electrician' ? 'text-blue-500' :
                  formData.profession === 'mechanic' ? 'text-red-400' :
                  'text-brand-400'
                }`}>
                  {professions.find(p => p.id === formData.profession)?.name[activeLocale] || formData.profession}
                </p>
              )}
              {formData.specialization && (
                <p className="text-white/70 text-xs font-medium">
                  {professionSpecializations[formData.profession]?.find(s => s.id === formData.specialization)?.[activeLocale === 'ar' ? 'ar' : 'en'] || formData.specialization}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="card p-6 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-brand-500" />
              {t('editProfile')}
            </h2>
            {profile?.role === 'professional' && (
              <button 
                onClick={() => setIsPremiumModalOpen(true)}
                className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1.5 rounded-full font-black text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/30 hover:scale-105 transition-transform"
              >
                <Crown className="w-3.5 h-3.5 fill-white" />
                {t('premium', { defaultValue: 'Premium' })}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">{tAuth('firstName')}</label>
              <input
                value={formData.firstName}
                onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                className="input-field text-sm"
                placeholder={tAuth('firstName')}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">{tAuth('lastName')}</label>
              <input
                value={formData.lastName}
                onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
                className="input-field text-sm"
                placeholder={tAuth('lastName')}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">{tAuth('phone')}</label>
            <input
              value={formData.phone}
              onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
              className="input-field text-sm"
              placeholder={tAuth('phone')}
            />
          </div>

          {/* Professional Information - only for professionals */}
          {profile?.role === 'professional' && (
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="profession-select" className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">{tAuth('profession')}</label>
                  <div className="relative">
                    <select
                      id="profession-select"
                      value={formData.profession}
                      onChange={e => setFormData(f => ({ ...f, profession: e.target.value, specialization: '' }))}
                      className="input-field text-sm appearance-none pr-8"
                    >
                      {professions.map(p => (
                        <option key={p.id} value={p.id}>{p.name[activeLocale] || p.name.en}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                {formData.profession && professionSpecializations[formData.profession] && (
                  <div className="space-y-1.5">
                    <label htmlFor="specialization-select" className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">{tAuth('specialization')}</label>
                    <div className="relative">
                      <select
                        id="specialization-select"
                        value={formData.specialization}
                        onChange={e => setFormData(f => ({ ...f, specialization: e.target.value }))}
                        title={tAuth('specialization')}
                        aria-label={tAuth('specialization')}
                        className="input-field text-sm appearance-none pr-8"
                      >
                        <option value="">-- {tAuth('specialization')} --</option>
                        {professionSpecializations[formData.profession].map(s => (
                          <option key={s.id} value={s.id}>{s[activeLocale as 'ar' | 'en'] || s.en}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">{tAuth('price')}</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData(f => ({ ...f, price: e.target.value }))}
                    className="input-field text-sm"
                    placeholder={tAuth('price')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">{tAuth('currency')}</label>
                  <div className="flex items-center h-10 px-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl text-brand-400 font-bold text-sm">
                    {formData.currency}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">{tAuth('bio')}</label>
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData(f => ({ ...f, bio: e.target.value }))}
                  className="input-field text-sm min-h-[100px] py-2 resize-none"
                  placeholder={tAuth('bio')}
                />
              </div>
            </div>
          )}
          
          {/* Action buttons - only show if changed */}
          {(profile && (
            formData.firstName !== (profile.first_name || '') ||
            formData.lastName !== (profile.last_name || '') ||
            formData.phone !== (profile.phone || '') ||
            formData.profession !== (professionalDetails?.profession || '') ||
            formData.specialization !== (professionalDetails?.specialization || '') ||
            formData.bio !== (professionalDetails?.bio || '') ||
            formData.price !== (professionalDetails?.price?.toString() || '') ||
            formData.currency !== (professionalDetails?.currency || 'USD') ||
            avatarFile !== null ||
            coverFile !== null
          )) && (
            <div className="flex gap-3 animate-fade-in pt-2">
              <button 
                onClick={() => {
                  setFormData({
                    firstName: profile?.first_name || '',
                    lastName: profile?.last_name || '',
                    phone: profile?.phone || '',
                    profession: professionalDetails?.profession || '',
                    specialization: professionalDetails?.specialization || '',
                    bio: professionalDetails?.bio || '',
                    price: professionalDetails?.price?.toString() || '',
                    currency: professionalDetails?.currency || 'USD',
                  })
                  setAvatarFile(null)
                  setAvatarPreview(profile?.avatar_url || null)
                }} 
                className="btn-secondary flex-1 text-sm py-3"
              >
                {tCommon('cancel')}
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm py-3">
                {saving ? tCommon('loading') : tCommon('save')}
              </button>
            </div>
          )}
        </div>

        {/* Settings sections */}
        <div className="space-y-3">

          {/* Language & Location */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('languageLocation')}</h3>
            </div>

            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-brand-600" />
                <label htmlFor="language-select" className="font-medium text-gray-900 dark:text-white">{t('language')}</label>
              </div>
              <div className="relative">
                <select
                  id="language-select"
                  value={locale}
                  onChange={e => {
                    setLocale(e.target.value as Locale)
                    router.push(`/${e.target.value}/profile/me`)
                  }}
                  className="input-field text-sm appearance-none pr-8"
                >
                  {locales.map(l => (
                    <option key={l} value={l}>{localeNames[l]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                <span className="font-medium text-gray-900 dark:text-white">{t('country')}</span>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCountrySelect(!showCountrySelect)}
                  className="w-full input-field text-sm flex items-center justify-between"
                >
                  <span className={country ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                    {countries.find(c => c.code === country)?.name[activeLocale] || t('country')}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCountrySelect ? 'rotate-180' : ''}`} />
                </button>

                {showCountrySelect && (
                  <div className="absolute z-50 w-full mt-2 glass border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                    <div className="p-2 border-b border-white/10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          autoFocus
                          value={countrySearch}
                          onChange={e => setCountrySearch(e.target.value)}
                          placeholder={tCommon('search')}
                          className={`w-full bg-white/5 border-none text-xs py-2 ${isRTL ? 'pr-9 text-right' : 'pl-9 text-left'} focus:ring-0 text-white`}
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {countries
                        .filter(c => (c.name[activeLocale] || c.name.en).toLowerCase().includes(countrySearch.toLowerCase()))
                        .map(c => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setCountry(c.code);
                              setState('');
                              setCity('');
                              setShowCountrySelect(false);
                              setCountrySearch('');
                              // Update currency automatically
                              setFormData(prev => ({ ...prev, currency: c.currency }));
                              if (user) {
                                (supabase.from('profiles') as any).update({ country_code: c.code, state: null, city: null }).eq('id', user.id).then();
                              }
                            }}
                            className={`w-full px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-sm hover:bg-white/10 transition-colors ${
                              country === c.code ? 'text-brand-400 bg-brand-500/10 font-bold' : 'text-gray-300'
                            }`}
                          >
                            {c.name[activeLocale] || c.name.en}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

                        {countryData && (
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  <span className="font-medium text-gray-900 dark:text-white">{t('state', { defaultValue: 'State' })}</span>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStateSelect(!showStateSelect)}
                    className="w-full input-field text-sm flex items-center justify-between"
                  >
                    <span className={state ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                      {(state && (translatedStates[state] || currentStates.find(s => s.id === state)?.name.en)) || t('state', { defaultValue: 'State' })}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showStateSelect ? 'rotate-180' : ''}`} />
                  </button>

                  {showStateSelect && (
                    <div className="absolute z-50 w-full mt-2 glass border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                      <div className="p-2 border-b border-white/10">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="text"
                            autoFocus
                            value={stateSearch}
                            onChange={e => setStateSearch(e.target.value)}
                            placeholder={tCommon('search')}
                            className={`w-full bg-white/5 border-none text-xs py-2 ${isRTL ? 'pr-9 text-right' : 'pl-9 text-left'} focus:ring-0 text-white`}
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {currentStates
                          .filter(s => (translatedStates[s.id] || s.name.en).toLowerCase().includes(stateSearch.toLowerCase()))
                          .map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setState(s.id);
                                setCity('');
                                setShowStateSelect(false);
                                setStateSearch('');
                                if (user) {
                                  (supabase.from('profiles') as any).update({ state: s.id, city: null }).eq('id', user.id).then();
                                }
                              }}
                              className={`w-full px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-sm hover:bg-white/10 transition-colors ${
                                state === s.id ? 'text-brand-400 bg-brand-500/10 font-bold' : 'text-gray-300'
                              }`}
                            >
                              {translatedStates[s.id] || s.name.en}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

{countryData && state && (
              <div className="px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  <span className="font-medium text-gray-900 dark:text-white">{t('city')}</span>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCitySelect(!showCitySelect)}
                    className="w-full input-field text-sm flex items-center justify-between"
                  >
                    <span className={city ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                      {(city && (translatedCities[city] || currentCities.find(c => c.id === city)?.name.en)) || t('city')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCitySelect ? 'rotate-180' : ''}`} />
                  </button>

                  {showCitySelect && (
                    <div className="absolute z-50 w-full mt-2 glass border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                      <div className="p-2 border-b border-white/10">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="text"
                            autoFocus
                            value={citySearch}
                            onChange={e => setCitySearch(e.target.value)}
                            placeholder={tCommon('search')}
                            className="w-full bg-white/5 border-none text-xs py-2 pl-9 focus:ring-0 text-white"
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {currentCities
                          .filter(c => (translatedCities[c.id] || c.name.en).toLowerCase().includes(citySearch.toLowerCase()))
                          .map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setCity(c.id);
                                setShowCitySelect(false);
                                setCitySearch('');
                                if (user) {
                                  (supabase.from('profiles') as any).update({ city: c.id }).eq('id', user.id).then();
                                }
                              }}
                              className={`w-full px-4 py-3 text-left text-sm hover:bg-white/10 transition-colors ${
                                city === c.id ? 'text-brand-400 bg-brand-500/10 font-bold' : 'text-gray-300'
                              }`}
                            >
                              {translatedCities[c.id] || c.name.en}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sign out */}
          <div className="card overflow-hidden">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{tCommon('signOut')}</span>
              <ChevronRight className={`w-4 h-4 ml-auto ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <BottomNav locale={activeLocale} />
      
      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
        locale={activeLocale} 
      />
    </div>
  )
}
