'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { usePresenceStore } from '@/store/presenceStore'
import { X, MessageCircle } from 'lucide-react'

export default function GlobalRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { setOnlineUsers } = usePresenceStore()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const [toast, setToast] = useState<{ id: string; title: string; body: string; chatId: string } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission()
      }
    }
  }, [])

  useEffect(() => {
    if (!user) return

    // 1. Global Presence
    const presenceChannel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState()
        const usersOnline: Record<string, boolean> = {}
        Object.keys(newState).forEach(key => {
          usersOnline[key] = true
        })
        setOnlineUsers(usersOnline)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
          })
        }
      })

    // Remove tracking on tab close
    const handleBeforeUnload = () => {
      presenceChannel.untrack()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // 2. Global Messages Listener
    const messagesChannel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMessage = payload.new as any
          
          // Ignore our own messages
          if (newMessage.sender_id === user.id) return
          
          // Check if this message is for a conversation we are part of
          const { data: convData } = await supabase
            .from('conversations')
            .select('id, user_id, professional_id')
            .eq('id', newMessage.conversation_id)
            .single()
            
          const conv = convData as any

          if (!conv) return
          if (conv.user_id !== user.id && conv.professional_id !== user.id) return

          // We are part of this conversation. Check if we are currently viewing it.
          const isViewingChat = pathname.includes(`/messages/${newMessage.conversation_id}`)
          
          if (!isViewingChat) {
            // Fetch sender info for notification
            const { data: senderData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', newMessage.sender_id)
              .single()
              
            const sender = senderData as any
              
            const senderName = sender ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() : 'Someone'
            const title = `New Message from ${senderName}`
            let body = newMessage.content
            if (newMessage.type === 'offer') body = 'Sent you a new offer!'
            else if (!body && newMessage.attachment_url) body = 'Sent an attachment'
            
            // Show Native Notification if hidden
            if (document.visibilityState === 'hidden' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(title, { body, icon: '/icon.png' })
            } else {
              // Show In-App Toast
              setToast({
                id: newMessage.id,
                title,
                body: body.length > 40 ? body.substring(0, 40) + '...' : body,
                chatId: newMessage.conversation_id
              })
              // Auto dismiss
              setTimeout(() => setToast(null), 5000)
            }
          }
        }
      )
      .subscribe()

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      supabase.removeChannel(presenceChannel)
      supabase.removeChannel(messagesChannel)
    }
  }, [user, pathname, supabase, setOnlineUsers])

  return (
    <>
      {children}
      {/* Custom Toast UI */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-brand-500/20 border border-gray-100 dark:border-gray-700 p-4 max-w-sm w-full flex items-start gap-4 cursor-pointer hover:scale-105 transition-transform"
               onClick={() => {
                 const locale = pathname.split('/')[1] || 'en'
                 router.push(`/${locale}/messages/${toast.chatId}`)
                 setToast(null)
               }}>
            <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center flex-shrink-0 text-brand-600 dark:text-brand-400">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{toast.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{toast.body}</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setToast(null)
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close notification"
              title="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
