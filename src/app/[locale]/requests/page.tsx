'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import BottomNav from '@/components/layout/BottomNav'
import StarRating from '@/components/ui/StarRating'
import { professions } from '@/lib/data/locations'
import type { Locale } from '@/i18n/config'
import { MessageCircle, Check, X, Clock } from 'lucide-react'

interface RequestsPageProps {
  params: { locale: string }
}

type Request = {
  id: string
  user_id: string
  professional_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  message: string | null
  created_at: string
  user: any
  professional: any
}

export default function RequestsPage({ params }: RequestsPageProps) {
  const router = useRouter()
  const t = useTranslations('requests')
  const tReview = useTranslations('review')
  const tCommon = useTranslations('common')
  const { user, profile, professionalDetails } = useAuthStore()
  const { locale } = useAppStore()
  const [pageLocale, setPageLocale] = useState<string>('en')
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const supabase = createClient()

  useEffect(() => {
    setPageLocale(params.locale)
  }, [params])

  useEffect(() => {
    if (!user) return
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id, status, message, created_at, user_id, professional_id,
          user:profiles!user_id(id, first_name, last_name, avatar_url),
          professional:profiles!professional_id(
            id, first_name, last_name, avatar_url,
            professional_details(profession)
          )
        `)
        .or(`user_id.eq.${user.id},professional_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      
      if (error) console.error('Error fetching requests:', error)
      setRequests((data || []) as any)
      setLoading(false)
    }
    fetchRequests()
  }, [user, profile]) // eslint-disable-line

  const updateStatus = async (id: string, status: string) => {
    await (supabase.from('requests') as any).update({ status }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: status as any } : r))
    
    // Add notification for status change
    const req = requests.find(r => r.id === id)
    if (req && user) {
      const proName = profile?.first_name ? `${profile.first_name}` : 'Professional';
      await supabase.from('notifications').insert({
        user_id: req.user.id,
        type: 'request_status',
        title: status === 'accepted' ? t('notificationAcceptedTitle', { defaultValue: 'Request Accepted' }) : t('notificationRejectedTitle', { defaultValue: 'Request Rejected' }),
        body: status === 'accepted' ? t('notificationAcceptedBody', { name: proName, defaultValue: `${proName} accepted your request` }) : t('notificationRejectedBody', { name: proName, defaultValue: `${proName} rejected your request` }),
        data: { request_id: id }
      } as any)
    }
  }

  const handleStartChat = async (otherUserId: string) => {
    if (!user) return
    // Check if conversation exists
    const isPro = profile?.role === 'professional'
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq(isPro ? 'professional_id' : 'user_id', user.id)
      .eq(isPro ? 'user_id' : 'professional_id', otherUserId)
      .single()

    let chatId = (existing as any)?.id
    if (!chatId) {
      const { data: newConv } = await supabase.from('conversations').insert({
        user_id: isPro ? otherUserId : user.id,
        professional_id: isPro ? user.id : otherUserId,
      } as any).select().single()
      chatId = (newConv as any)?.id
    }

    if (chatId) router.push(`/${activeLocale}/messages/${chatId}`)
  }

  const submitReview = async (req: Request) => {
    if (!user) return
    await supabase.from('reviews').insert({
      reviewer_id: user.id,
      professional_id: req.professional.id,
      request_id: req.id,
      rating: reviewRating,
      comment: reviewComment,
    } as any)
    setShowReviewModal(null)
    setReviewComment('')
    setReviewRating(5)
  }

  const activeLocale = (pageLocale || locale) as Locale
  const isRTL = activeLocale === 'ar'
  const isPro = profile?.role === 'professional' || !!professionalDetails

  const filtered = activeTab === 'all' 
    ? requests 
    : requests.filter(r => activeTab === 'accepted' ? (r.status === 'accepted' || r.status === 'completed') : r.status === activeTab)

  const statusColors = {
    pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    accepted: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  }

  const getStatusText = (status: string) => {
    return t(status as any, { defaultValue: status })
  }

  return (
    <div className={`page-container ${isRTL ? 'rtl' : 'ltr'} bg-gray-50 dark:bg-gray-950 min-h-screen pb-24`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
          {t('title', { defaultValue: 'Requests' })}
        </h1>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(['all', 'pending', 'accepted', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-750'
              }`}
            >
              {tab === 'all' ? t('all', { defaultValue: 'All' }) : getStatusText(tab)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse space-y-4">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">📋</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">
              {t('noRequests', { defaultValue: 'No requests yet' })}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => {
              const isRequestForMe = req.professional_id === user?.id
              const otherUser = isRequestForMe ? req.user : req.professional
              const otherName = [otherUser?.first_name, otherUser?.last_name].filter(Boolean).join(' ')
              const proDetails = req.professional?.professional_details?.[0]
              const professionName = proDetails ? professions.find(p => p.id === proDetails.profession)?.name[activeLocale] : null

              return (
                <div key={req.id} className="card p-5 border-white/5 bg-white dark:bg-gray-900 shadow-xl shadow-black/5">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-400 to-purple-500 shadow-md relative">
                        {otherUser?.avatar_url ? (
                          <Image src={otherUser.avatar_url} alt={otherName} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-2xl font-black relative z-10">
                            {otherName[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm ${statusColors[req.status]}`}>
                        {req.status === 'pending' && <Clock className="w-3 h-3" />}
                        {req.status === 'accepted' && <Check className="w-3 h-3" />}
                        {req.status === 'rejected' && <X className="w-3 h-3" />}
                        {req.status === 'completed' && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-black text-gray-900 dark:text-white text-lg truncate">{otherName}</p>
                      </div>
                      {!isRequestForMe && professionName && (
                        <p className="text-brand-500 font-bold text-sm mb-1">{professionName}</p>
                      )}
                      <p className="text-sm font-bold text-brand-400 mb-2">
                        {getStatusText(req.status)}
                      </p>
                      
                      {req.message && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mb-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic">&quot;{req.message}&quot;</p>
                        </div>
                      )}
                      
                      <p className="text-[10px] text-gray-400 font-medium">
                        {new Date(req.created_at).toLocaleDateString(activeLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex gap-3 mt-5">
                    {/* Message button - always available */}
                    <button
                      onClick={() => handleStartChat(otherUser.id)}
                      className="flex-1 h-12 glass border border-white/10 dark:border-white/5 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all font-bold text-gray-700 dark:text-white"
                    >
                      <MessageCircle className="w-4 h-4 text-brand-400" />
                      {t('message', { defaultValue: 'Message' })}
                    </button>

                    {/* Professional specific actions */}
                    {isRequestForMe && req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(req.id, 'rejected')}
                          className="w-12 h-12 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-red-500/20"
                          title={t('reject', { defaultValue: 'Reject' })}
                          aria-label={t('reject', { defaultValue: 'Reject Request' })}
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, 'accepted')}
                          className="w-12 h-12 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-green-500/20"
                          title={t('accept', { defaultValue: 'Accept' })}
                          aria-label={t('accept', { defaultValue: 'Accept Request' })}
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    
                    {isRequestForMe && req.status === 'accepted' && (
                      <button
                        onClick={() => updateStatus(req.id, 'completed')}
                        className="flex-1 h-12 bg-brand-500 text-white font-black rounded-2xl shadow-lg shadow-brand-500/20"
                      >
                        {t('complete', { defaultValue: 'Complete' })}
                      </button>
                    )}

                    {/* User specific actions */}
                    {!isRequestForMe && req.status === 'completed' && (
                      <button
                        onClick={() => setShowReviewModal(req.id)}
                        className="flex-1 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold rounded-2xl border border-amber-500/20"
                      >
                        ⭐ {t('leaveReview', { defaultValue: 'Review Service' })}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Review modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center px-4 pb-10">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[32px] p-8 animate-slide-up shadow-2xl border border-white/10">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6 text-center">
              {tReview('title', { defaultValue: 'Review Service' })}
            </h3>
            <div className="mb-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {tReview('rating', { defaultValue: 'How was your experience?' })}
              </p>
              <div className="flex justify-center">
                <StarRating rating={reviewRating} size="lg" interactive onChange={setReviewRating} />
              </div>
            </div>
            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              rows={4}
              className="input-field resize-none mb-6 p-4 text-sm"
              placeholder={tReview('commentPlaceholder', { defaultValue: 'Write your review here...' })}
            />
            <div className="flex gap-4">
              <button onClick={() => setShowReviewModal(null)} className="flex-1 h-14 glass text-gray-500 dark:text-gray-400 font-bold rounded-2xl">
                {tCommon('cancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                onClick={() => {
                  const req = requests.find(r => r.id === showReviewModal)
                  if (req) submitReview(req)
                }}
                className="flex-1 h-14 bg-brand-500 text-white font-black rounded-2xl shadow-xl shadow-brand-500/30"
              >
                {tReview('submit', { defaultValue: 'Submit' })}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav locale={activeLocale} />
    </div>
  )
}
