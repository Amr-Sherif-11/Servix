'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, MapPin, Star, MessageCircle, Calendar, MoreVertical, Flag, Ban, DollarSign, User, Briefcase, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import BottomNav from '@/components/layout/BottomNav'
import StarRating from '@/components/ui/StarRating'
import { countries, getStatesOfCountry, getCitiesOfState, professions, professionSpecializations } from '@/lib/data/locations'
import type { Locale } from '@/i18n/config'

interface ProfilePageProps {
  params: { locale: string; id: string }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const router = useRouter()
  const { user, profile: myProfile } = useAuthStore()
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const tHome = useTranslations('home')
  const tAuth = useTranslations('auth')
  const { locale } = useAppStore()
  const [pageLocale, setPageLocale] = useState<string>('en')
  const [profileId, setProfileId] = useState<string>('')
  const [profile, setProfile] = useState<any>(null)
  const [details, setDetails] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setPageLocale(params.locale)
    setProfileId(params.id)
  }, [params])

  useEffect(() => {
    if (!profileId) return
    const fetchProfile = async () => {
      const [{ data: prof }, { data: det }, { data: revs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('professional_details').select('*').eq('profile_id', profileId).single(),
        supabase.from('reviews').select('*, reviewer:profiles!reviewer_id(first_name, last_name, avatar_url)').eq('professional_id', profileId).order('created_at', { ascending: false }),
      ])
      setProfile(prof)
      setDetails(det)
      setReviews(revs || [])
      setLoading(false)
    }
    fetchProfile()
  }, [profileId]) // eslint-disable-line

  const activeLocale = (pageLocale || locale) as Locale
  const isRTL = activeLocale === 'ar'
  const isOwnProfile = user?.id === profileId
  const fullName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : ''
  const country = countries.find(c => c.code === profile?.country_code)
  const professionData = professions.find(p => p.id === details?.profession)
  const professionName = professionData?.name[activeLocale as keyof typeof professionData.name] || details?.profession
  const specName = details?.profession && details?.specialization 
    ? professionSpecializations[details.profession]?.find(s => s.id === details.specialization)?.[activeLocale as 'ar' | 'en'] || professionSpecializations[details.profession]?.find(s => s.id === details.specialization)?.['en']
    : null

  // Translate the state and city name when profile or locale changes
  const [translatedState, setTranslatedState] = useState<string>('')
  const [translatedCity, setTranslatedCity] = useState<string>('')
  
  useEffect(() => {
    if (!profile?.country_code) return
    let isMounted = true
    
    const translateLocations = async () => {
      let sName = profile.state
      let cName = profile.city
      
      const stateList = getStatesOfCountry(profile.country_code)
      const stateObj = stateList.find(s => s.id === profile.state)
      if (stateObj && activeLocale !== 'en') {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: [stateObj.name.en], locale: activeLocale })
          })
          const data = await res.json()
          if (Array.isArray(data) && data[0]) sName = data[0]
        } catch (e) {}
      } else if (stateObj) {
        sName = stateObj.name.en
      }
      
      const cityList = (profile.country_code && profile.state) ? getCitiesOfState(profile.country_code, profile.state) : []
      const cityObj = cityList.find(c => c.id === profile.city)
      if (cityObj && activeLocale !== 'en') {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: [cityObj.name.en], locale: activeLocale })
          })
          const data = await res.json()
          if (Array.isArray(data) && data[0]) cName = data[0]
        } catch (e) {}
      } else if (cityObj) {
        cName = cityObj.name.en
      }
      
      if (isMounted) {
        setTranslatedState(sName || profile.state || '')
        setTranslatedCity(cName || profile.city || '')
      }
    }
    
    translateLocations()
    return () => { isMounted = false }
  }, [profile?.city, profile?.state, profile?.country_code, activeLocale])

  const stateName = translatedState || profile?.state || ''
  const cityName = translatedCity || profile?.city || ''
  
  // Extract cover offset from URL if exists
  const coverY = profile?.cover_url?.split('?y=')[1] || '50'

  const handleSendRequest = async () => {
    if (!user) return

    // Check if session is still valid
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert(tAuth('sessionExpired', { defaultValue: 'Session expired, please login again' }))
      useAuthStore.getState().signOut()
      router.push(`/${activeLocale}/auth/login`)
      return
    }

    const { error: requestError } = await supabase.from('requests').insert({
      user_id: user.id,
      professional_id: profileId,
      status: 'pending',
      message: requestMessage,
    } as any)

    if (requestError) {
      console.error('Error sending request:', requestError)
      alert(`${t('failedToSendRequest', { defaultValue: 'Failed to send request' })}: ${requestError.message}`)
      return
    }

    await supabase.from('notifications').insert({
      user_id: profileId,
      type: 'new_request',
      title: t('notificationNewRequestTitle', { defaultValue: 'New Request' }),
      body: t('notificationNewRequestBody', { name: myProfile?.first_name, defaultValue: `You received a new request from ${myProfile?.first_name}` }),
      data: { from_user_id: user.id },
    } as any)
    
    setShowRequestModal(false)
    setRequestMessage('')
    router.push(`/${activeLocale}/requests`)
  }

  const handleStartChat = async () => {
    if (!user) return
    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('professional_id', profileId)
      .single()

    let chatId = (existing as any)?.id
    if (!chatId) {
      const { data: newConv } = await supabase.from('conversations').insert({
        user_id: user.id,
        professional_id: profileId,
      } as any).select().single()
      chatId = (newConv as any)?.id
    }

    if (chatId) router.push(`/${activeLocale}/messages/${chatId}`)
  }

  const handleBlock = async () => {
    if (!user) return
    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: profileId } as any)
    setShowMenu(false)
    router.back()
  }

  const handleReport = async () => {
    if (!user) return
    await supabase.from('reports').insert({ reporter_id: user.id, reported_id: profileId, reason: 'other', details: null } as any)
    setShowMenu(false)
  }

  if (loading) {
    return (
      <div className={`page-container ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-700" />
          <div className="px-4 -mt-12">
            <div className="w-24 h-24 rounded-2xl bg-gray-300 dark:bg-gray-600 mb-4" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
        </div>
        <BottomNav locale={activeLocale} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`page-container flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <p className="text-gray-500">{t('notFound', { defaultValue: 'User not found' })}</p>
        <BottomNav locale={activeLocale} />
      </div>
    )
  }

  return (
    <div className={`page-container ${isRTL ? 'rtl' : 'ltr'} bg-gray-950 min-h-screen pb-24`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with Back Button */}
      <div className="px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          title={tCommon('back', { defaultValue: 'Back' })}
          aria-label={tCommon('back', { defaultValue: 'Go back' })}
        >
          <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex gap-2">
          {!isOwnProfile && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              title={t('moreOptions', { defaultValue: 'More options' })}
              aria-label={t('moreOptions', { defaultValue: 'Open options menu' })}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 mt-2">
        {/* Profile Card Container */}
        <div className="card p-6 relative overflow-hidden bg-gray-900/40 border-white/5 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Side (Info) */}
            <div className="flex-1 order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-lg border border-yellow-500/20">
                  <Star className="w-3.5 h-3.5 fill-yellow-500" />
                  <span className="text-xs font-bold">{details?.rating.toFixed(1)}</span>
                  <span className="text-[10px] opacity-60">({details?.total_reviews} {t('reviews', { defaultValue: 'Reviews' })})</span>
                </div>
                {details?.is_available && (
                  <div className="flex items-center gap-1.5 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-bold border border-green-500/20 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {t('availableNow', { defaultValue: 'Available Now' })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl font-black text-white tracking-tight">
                  {profile.first_name} <span className="text-brand-500">{profile.last_name}</span>
                </h1>
                <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/30">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col gap-1 mb-6">
                <div className="flex items-center gap-2">
                  <div className="bg-brand-500/20 text-brand-400 p-1.5 rounded-lg">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="text-lg text-brand-400 font-bold">{professionName}</span>
                </div>
                {specName && (
                  <div className="flex items-center gap-2 px-10">
                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                    <p className="text-sm text-gray-400 font-medium">{specName}</p>
                  </div>
                )}
              </div>

              {/* Price Card */}
              <div className="bg-gray-800/40 border border-white/5 rounded-2xl p-4 mb-8 flex items-center gap-4 group hover:bg-gray-800/60 transition-colors">
                <div className="w-12 h-12 bg-brand-600/20 rounded-xl flex items-center justify-center text-brand-400 shadow-inner">
                  <div className="p-2 bg-brand-600 rounded-lg text-white">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{t('priceTitle', { defaultValue: 'Price' })}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">{details?.price}</span>
                    <span className="text-xs text-gray-500 font-bold uppercase">{details?.currency} / {t('perRequest', { defaultValue: 'per Request' })}</span>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-500">
                    <User className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-white">{t('aboutMe', { defaultValue: 'About Me' })}</h2>
                </div>
                <p className="text-gray-400 leading-relaxed text-sm max-w-md italic">
                  &quot;{details?.bio}&quot;
                </p>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && user && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button onClick={handleStartChat} className="flex-1 h-14 glass border border-white/10 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all shadow-lg">
                      <MessageCircle className="w-5 h-5 text-brand-400" />
                      {t('sendMessage', { defaultValue: 'Message' })}
                    </button>
                    <button onClick={() => setShowRequestModal(true)} className="flex-1 h-14 bg-brand-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-500 transition-all shadow-xl shadow-brand-600/30">
                      <Calendar className="w-5 h-5" />
                      {t('bookNow', { defaultValue: 'Book Now' })}
                    </button>
                  </div>
                  <button 
                    onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })} 
                    className="w-full h-12 bg-white/5 border border-white/5 text-gray-300 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                  >
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {t('customerReviews', { defaultValue: 'Customer Reviews' })}
                  </button>
                </div>
              )}
            </div>

            {/* Right Side (Avatar & Details Box) */}
            <div className="w-full lg:w-80 order-1 lg:order-2">
              <div className="relative mb-8">
                <div className="aspect-square rounded-full border-[6px] border-brand-500/30 p-2 relative">
                  <div className="w-full h-full rounded-full overflow-hidden shadow-2xl ring-4 ring-gray-900 relative">
                    {profile.avatar_url ? (
                      <Image src={profile.avatar_url} alt={fullName} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-4xl font-black text-white relative z-10">
                        {(profile.first_name?.[0] || '?').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-[10%] right-[10%] w-8 h-8 bg-green-500 border-4 border-gray-900 rounded-full shadow-lg" />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-gray-800/40 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-400">{t('professionTitle', { defaultValue: 'Profession' })}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{professionName}</span>
                </div>

                {specName && (
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                        <Award className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-gray-400">{t('specializationTitle', { defaultValue: 'Specialization' })}</span>
                    </div>
                    <span className="text-sm font-bold text-white">{specName}</span>
                  </div>
                )}
                
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-400">{t('locationTitle', { defaultValue: 'Location' })}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{[cityName, stateName, country?.name[activeLocale as keyof typeof country.name]].filter(Boolean).join('، ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews-section" className="mt-10 pt-10 border-t border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white">{t('reviews', { defaultValue: 'Reviews' })}</h2>
            <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-xs font-bold">{reviews.length}</span>
          </div>
          
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="card p-5 bg-gray-900/40 border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400 font-black">
                        {review.reviewer?.first_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">
                          {[review.reviewer?.first_name, review.reviewer?.last_name].filter(Boolean).join(' ')}
                        </p>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {new Date(review.created_at).toLocaleDateString(activeLocale)}
                    </span>
                  </div>
                  {review.comment && <p className="text-gray-400 text-xs leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-10 text-center">
              <Star className="w-10 h-10 text-gray-800 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{t('noReviewsYet', { defaultValue: 'No reviews yet for this professional' })}</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu & Modals */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
          <div className="relative w-full max-w-xs glass rounded-3xl overflow-hidden animate-fade-in border border-white/10">
            <button onClick={handleReport} className="w-full flex items-center gap-3 px-6 py-4 text-sm text-gray-200 hover:bg-white/5 transition-colors border-b border-white/5">
              <Flag className="w-4 h-4 text-orange-500" /> {t('reportUser', { defaultValue: 'Report User' })}
            </button>
            <button onClick={handleBlock} className="w-full flex items-center gap-3 px-6 py-4 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
              <Ban className="w-4 h-4" /> {t('blockUser', { defaultValue: 'Block User' })}
            </button>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="w-full max-w-lg bg-gray-900 rounded-t-[40px] sm:rounded-[40px] p-8 pb-12 sm:pb-8 animate-slide-up border-t sm:border border-white/10 shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto mb-8 sm:hidden" />
            <h3 className="text-2xl font-black text-white mb-2">{t('requestModalTitle', { defaultValue: 'Send a Request' })}</h3>
            <p className="text-gray-400 text-sm mb-6">{t('requestModalSubtitle', { defaultValue: 'Describe what you need from the professional in detail' })}</p>
            <textarea
              value={requestMessage}
              onChange={e => setRequestMessage(e.target.value)}
              rows={5}
              className="w-full bg-gray-800 border border-white/5 rounded-2xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-500/50 outline-none transition-all resize-none mb-8"
              placeholder={t('requestPlaceholder', { defaultValue: 'Describe what you need...' })}
            />
            <div className="flex gap-4">
              <button onClick={() => setShowRequestModal(false)} className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-colors border border-white/10">
                {tCommon('cancel', { defaultValue: 'Cancel' })}
              </button>
              <button onClick={handleSendRequest} className="flex-1 h-14 bg-brand-500 hover:bg-brand-400 text-white font-black rounded-2xl shadow-xl shadow-brand-500/30 transition-all transform active:scale-95">
                {t('sendRequestButton', { defaultValue: 'Send Request' })}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav locale={activeLocale} />
    </div>
  )
}
