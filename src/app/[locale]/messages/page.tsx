'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import BottomNav from '@/components/layout/BottomNav'
import type { Locale } from '@/i18n/config'

interface MessagesPageProps {
  params: { locale: string }
}

export default function MessagesPage({ params }: MessagesPageProps) {
  const router = useRouter()
  const t = useTranslations('messages')
  const { user, profile } = useAuthStore()
  const { locale } = useAppStore()
  const [pageLocale, setPageLocale] = useState<string>('en')
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    setPageLocale(params.locale)
  }, [params])

  useEffect(() => {
    if (!user) return
    const isPro = profile?.role === 'professional'
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('conversations')
        .select(`
          id, last_message, last_message_at,
          user:profiles!user_id(id, first_name, last_name, avatar_url),
          professional:profiles!professional_id(id, first_name, last_name, avatar_url)
        `)
        .eq(isPro ? 'professional_id' : 'user_id', user.id)
        .order('last_message_at', { ascending: false, nullsFirst: false })
      setConversations(data || [])
      setLoading(false)
    }
    fetchConversations()

    // Realtime subscription
    const channel = supabase
      .channel('conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, profile]) // eslint-disable-line

  const activeLocale = (pageLocale || locale) as Locale
  const isRTL = activeLocale === 'ar'
  const isPro = profile?.role === 'professional'

  return (
    <div className={`page-container ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="sticky top-0 z-40 glass border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 flex gap-3 animate-pulse">
                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('noConversations')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => {
              const otherPerson = isPro ? conv.user : conv.professional
              const name = [otherPerson?.first_name, otherPerson?.last_name].filter(Boolean).join(' ')
              const timeAgo = conv.last_message_at
                ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
                : ''

              return (
                <button
                  key={conv.id}
                  onClick={() => router.push(`/${activeLocale}/messages/${conv.id}`)}
                  className="w-full card p-4 flex items-center gap-3 hover:border-brand-200 dark:hover:border-brand-800 transition-all duration-200 text-left"
                >
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white text-lg font-bold overflow-hidden">
                    {otherPerson?.avatar_url ? (
                      <Image src={otherPerson.avatar_url} alt={name} fill className="object-cover" />
                    ) : (
                      name[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo}</span>
                    </div>
                    {conv.last_message && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{conv.last_message}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav locale={activeLocale} />
    </div>
  )
}
