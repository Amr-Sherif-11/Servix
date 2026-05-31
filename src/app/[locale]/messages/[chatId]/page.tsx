'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Send, SendHorizontal, Check, CheckCheck, Paperclip, FileText, X } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { usePresenceStore } from '@/store/presenceStore'
import { DollarSign } from 'lucide-react'
import type { Locale } from '@/i18n/config'

interface ChatPageProps {
  params: { locale: string; chatId: string }
}

type Message = {
  id: string
  sender_id: string
  content: string
  is_seen: boolean
  type?: string
  offer_details?: any
  created_at: string
  attachment_url?: string
  attachment_type?: string
  attachment_name?: string
}

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter()
  const t = useTranslations('messages')
  const { user } = useAuthStore()
  const { locale } = useAppStore()
  const [pageLocale, setPageLocale] = useState<string>('en')
  const [chatId, setChatId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerDesc, setOfferDesc] = useState('')
  const { isUserOnline } = usePresenceStore()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setPageLocale(params.locale)
    setChatId(params.chatId)
  }, [params])

  // Request Notification Permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission()
      }
    }
  }, [])

  useEffect(() => {
    if (!chatId || !user) return

    const fetchData = async () => {
      // Get conversation and other user
      const { data: convData } = await supabase
        .from('conversations')
        .select(`
          user_id, professional_id,
          user:profiles!user_id(id, first_name, last_name, avatar_url),
          professional:profiles!professional_id(id, first_name, last_name, avatar_url)
        `)
        .eq('id', chatId)
        .single()
      
      const conv = convData as any

      if (conv) {
        const isUser = conv.user_id === user.id
        setOtherUser(isUser ? conv.professional : conv.user)
      }

      // Get messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, offer_details(*)')
        .eq('conversation_id', chatId)
        .order('created_at', { ascending: true })
      setMessages(msgs || [])
      setLoading(false)

      // Mark as read
      await (supabase.from('messages') as any)
        .update({ is_seen: true })
        .eq('conversation_id', chatId)
        .neq('sender_id', user.id)
        .eq('is_seen', false)
    }
    fetchData()

    // Realtime subscription & Presence
    const channel = supabase.channel(`messages:${chatId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })
    channelRef.current = channel

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${chatId}`,
      }, (payload) => {
        const newMessage = payload.new as Message
        setMessages(prev => {
          // Check if message already exists (e.g. from optimistic UI or multiple events)
          if (prev.find(m => m.id === newMessage.id)) return prev
          return [...prev, newMessage]
        })
        
        if (newMessage.sender_id !== user.id) {
          // Mark as read
          (supabase.from('messages') as any).update({ is_seen: true }).eq('id', newMessage.id)

          // Push Notification
          if (document.visibilityState === 'hidden' && 'Notification' in window && Notification.permission === 'granted') {
             // Retrieve from state, or fallback
            new Notification('New Message', {
              body: newMessage.content || 'Attachment received',
              icon: '/icon.png' // or otherUser avatar
            })
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const typing = Object.values(newState)
          .flat()
          .filter((p: any) => p.isTyping && p.user_id !== user.id)
          .map((p: any) => p.user_id)
        setTypingUsers(typing)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${chatId}`,
      }, (payload) => {
        const updatedMessage = payload.new as Message
        setMessages(prev => prev.map(m => m.id === updatedMessage.id ? { ...m, is_seen: updatedMessage.is_seen } : m))
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'offer_details',
      }, (payload) => {
        const updatedOffer = payload.new
        setMessages(prev => prev.map(m => m.id === updatedOffer.message_id ? { ...m, offer_details: [updatedOffer] } : m))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, isTyping: false })
        }
      })

    return () => { 
      supabase.removeChannel(channel)
    }
  }, [chatId, user]) // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (channelRef.current && user) {
      channelRef.current.track({ user_id: user.id, isTyping: e.target.value.length > 0 })
      
      // Stop typing after 3 seconds of inactivity
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        channelRef.current?.track({ user_id: user.id, isTyping: false })
      }, 3000)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  
  const sendOffer = async () => {
    if (!offerAmount || !user || !chatId) return
    setSending(true)
    const amount = parseFloat(offerAmount)
    
    const messageData: any = {
      conversation_id: chatId,
      sender_id: user.id,
      content: offerDesc,
      is_seen: false,
      type: 'offer'
    }

    const { data: msgData, error: msgErr } = await supabase.from('messages').insert(messageData).select().single()
    const msg = msgData as any
    
    if (!msgErr && msg) {
      await (supabase.from('offer_details') as any).insert({
        message_id: msg.id,
        amount,
        currency: 'USD',
        description: offerDesc,
        status: 'pending'
      })
      
      // Update last message
      ;(supabase.from('conversations') as any).update({
        last_message: `Sent a price offer: $${amount}`,
        last_message_at: new Date().toISOString(),
      }).eq('id', chatId)
    }
    
    setSending(false)
    setShowOfferModal(false)
    setOfferAmount('')
    setOfferDesc('')
  }
  
  const handleOfferAction = async (msgId: string, action: 'accepted' | 'declined') => {
    await (supabase.from('offer_details') as any).update({ status: action }).eq('message_id', msgId)
  }

  const sendMessage = async () => {
    if ((!input.trim() && !selectedFile) || !user || !chatId) return
    setSending(true)
    const content = input.trim()
    setInput('')
    
    // Stop typing
    if (channelRef.current) {
      channelRef.current.track({ user_id: user.id, isTyping: false })
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }

    let attachmentUrl = null
    let attachmentType = null
    let attachmentName = null

    if (selectedFile) {
      setUploading(true)
      try {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${chatId}/${user.id}/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, selectedFile)
          
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath)
          
        attachmentUrl = publicUrl
        attachmentType = selectedFile.type.startsWith('image/') ? 'image' : 'file'
        attachmentName = selectedFile.name
      } catch (error) {
        console.error('File upload failed:', error)
        alert(t('uploadFailed', { defaultValue: 'Upload failed' }))
        setUploading(false)
        setSending(false)
        return
      }
      setUploading(false)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // التحديث الفوري للواجهة (Optimistic UI)
    const messageId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined
    
    if (messageId) {
      const optimisticMessage: Message = {
        id: messageId,
        sender_id: user.id,
        content,
        is_seen: false,
        created_at: new Date().toISOString(),
        attachment_url: attachmentUrl || undefined,
        attachment_type: attachmentType || undefined,
        attachment_name: attachmentName || undefined,
      }
      setMessages(prev => [...prev, optimisticMessage])
    }
    
    setSending(false)

    // إرسال البيانات لقاعدة البيانات في الخلفية
    const messageData: any = {
      conversation_id: chatId,
      sender_id: user.id,
      content,
      is_seen: false,
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
      attachment_name: attachmentName
    }
    if (messageId) messageData.id = messageId

    const { error } = await supabase.from('messages').insert(messageData)

    if (!error) {
      // Create a notification for the other user
      if (otherUser) {
        const { profile: myProfile } = useAuthStore.getState();
        const msgPreview = content ? (content.length > 30 ? content.substring(0, 30) + '...' : content) : '📎 Attachment';
        await supabase.from('notifications').insert({
          user_id: otherUser.id,
          type: 'new_message',
          title: t('newMessageTitle', { defaultValue: 'New Message' }),
          body: `${user.user_metadata?.first_name || myProfile?.first_name || 'User'}: ${msgPreview}`,
          data: { conversation_id: chatId }
        } as any);
      }

      // تحديث آخر رسالة في المحادثة في الخلفية
      ;(supabase.from('conversations') as any).update({
        last_message: attachmentName ? `📎 ${attachmentName}` : content,
        last_message_at: new Date().toISOString(),
      }).eq('id', chatId)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return t('today')
    if (isYesterday(date)) return t('yesterday')
    return format(date, 'MMM d, yyyy')
  }

  const activeLocale = (pageLocale || locale) as Locale
  const isRTL = activeLocale === 'ar'
  const otherName = otherUser ? [otherUser.first_name, otherUser.last_name].filter(Boolean).join(' ') : '...'

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = []
  messages.forEach(msg => {
    const dateLabel = getDateLabel(msg.created_at)
    const lastGroup = groupedMessages[groupedMessages.length - 1]
    if (!lastGroup || lastGroup.date !== dateLabel) {
      groupedMessages.push({ date: dateLabel, messages: [msg] })
    } else {
      lastGroup.messages.push(msg)
    }
  })

  return (
    <div className={`flex flex-col h-screen bg-gray-50 dark:bg-gray-950 max-w-screen-sm mx-auto ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="glass border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3 flex items-center gap-3 flex-shrink-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
          {otherUser?.avatar_url ? (
            <Image src={otherUser.avatar_url} alt={otherName} width={40} height={40} className="w-full h-full object-cover" unoptimized />
          ) : (
            otherName[0]?.toUpperCase() || '?'
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{otherName}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">{typingUsers.length > 0 ? <span className="text-green-500">{t('typing', { defaultValue: 'Typing...' })}</span> : otherUser ? (isUserOnline(otherUser.id) ? <><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> <span className="text-green-500">{t('online', { defaultValue: 'Online' })}</span></> : t('offline', { defaultValue: 'Offline' })) : ''}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <span className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          groupedMessages.map(group => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">{group.date}</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>

              {group.messages.map((msg, i) => {
                const isMine = msg.sender_id === user?.id
                const showAvatar = !isMine && (i === 0 || group.messages[i - 1]?.sender_id !== msg.sender_id)

                return (
                  <div key={msg.id} className={`flex items-end gap-2 mb-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMine && (
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${showAvatar ? 'visible' : 'invisible'}`}>
                        {otherName[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className={`group flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
                      <div className={`${isMine ? 'bubble-sent' : 'bubble-received'} ${msg.attachment_url && msg.attachment_type === 'image' && !msg.content ? '!p-0 !bg-transparent !border-none !shadow-none' : ''} overflow-hidden`}>
                        
                        {msg.type === 'offer' ? (
                          <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl border border-brand-200 dark:border-brand-800 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-2 text-brand-600 dark:text-brand-400 font-bold">
                              <DollarSign className="w-5 h-5" />
                              <span>{t('priceOffer', { defaultValue: 'Price Offer' })}</span>
                            </div>
                            <div className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                              ${msg.offer_details?.[0]?.amount || msg.offer_details?.amount || '0.00'}
                            </div>
                            {msg.content && <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{msg.content}</p>}
                            
                            {msg.offer_details?.[0]?.status === 'pending' || msg.offer_details?.status === 'pending' ? (
                              !isMine ? (
                                <div className="flex gap-2">
                                  <button onClick={() => handleOfferAction(msg.id, 'accepted')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-lg text-sm font-bold transition-colors">
                                    {t('accept', { defaultValue: 'Accept' })}
                                  </button>
                                  <button onClick={() => handleOfferAction(msg.id, 'declined')} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-lg text-sm font-bold transition-colors">
                                    {t('decline', { defaultValue: 'Decline' })}
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center text-sm font-medium text-amber-500">
                                  {t('pendingApproval', { defaultValue: 'Pending Approval...' })}
                                </div>
                              )
                            ) : (
                              <div className={`text-center text-sm font-bold ${(msg.offer_details?.[0]?.status || msg.offer_details?.status) === 'accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                {(msg.offer_details?.[0]?.status || msg.offer_details?.status) === 'accepted' ? t('accepted', { defaultValue: 'Accepted' }) : t('declined', { defaultValue: 'Declined' })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            {msg.attachment_url && (
                              <div className={msg.attachment_type === 'image' && !msg.content ? 'mb-0' : 'mb-2'}>
                                {msg.attachment_type === 'image' ? (
                                  <Image src={msg.attachment_url} alt="attachment" width={400} height={400} className="rounded-2xl max-w-full h-auto object-cover max-h-[300px] shadow-lg" unoptimized />
                                ) : (
                                  <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/10 dark:bg-white/10 p-2 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                                    <FileText className="w-5 h-5" />
                                    <span className="text-sm truncate max-w-[150px]">{msg.attachment_name}</span>
                                  </a>
                                )}
                              </div>
                            )}
                            {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>}
                          </>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[10px] text-gray-400">
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </span>
                        {isMine && (
                          msg.is_seen
                            ? <CheckCheck className="w-4 h-4 text-blue-500" />
                            : <Check className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        
        {/* Typing Indicator Bubble */}
        {typingUsers.length > 0 && (
          <div className={`flex items-end gap-2 mb-1 flex-row`}>
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold`}>
              {otherName[0]?.toUpperCase()}
            </div>
            <div className="bubble-received flex gap-1 items-center px-4 py-3">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        
        <div ref={bottomRef} className="h-2" />
      </div>


      {/* Offer Modal */}
      {showOfferModal && (
        <div className="absolute bottom-full left-0 right-0 mb-4 mx-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 animate-slide-up">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white">{t('sendOffer', { defaultValue: 'Send Price Offer' })}</h3>
            <button onClick={() => setShowOfferModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close modal" title="Close modal">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('amount', { defaultValue: 'Amount ($)' })}</label>
              <input type="number" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('description', { defaultValue: 'Description' })}</label>
              <textarea value={offerDesc} onChange={(e) => setOfferDesc(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={2} placeholder={t('offerDescPlaceholder', { defaultValue: 'What is included in this offer?' })} />
            </div>
            <button onClick={sendOffer} disabled={!offerAmount || sending} className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white rounded-xl py-2 font-bold text-sm transition-colors">
              {sending ? '...' : t('send', { defaultValue: 'Send' })}
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="glass border-t border-gray-200/50 dark:border-gray-700/50 px-4 py-3 flex-shrink-0">
        {selectedFile && (
          <div className="mb-3 flex items-center gap-3 bg-gray-100 dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
            {selectedFile.type.startsWith('image/') ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                <Image src={URL.createObjectURL(selectedFile)} alt="preview" width={40} height={40} className="w-full h-full object-cover" unoptimized />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-500">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button 
              onClick={() => setSelectedFile(null)} 
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
              aria-label="Remove file"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/*,.pdf,.doc,.docx"
            aria-label="Upload a file"
            title="Upload a file"
          />
          <button 
            onClick={() => setShowOfferModal(!showOfferModal)}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 ${showOfferModal ? 'text-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            aria-label="Send offer"
            title="Send offer"
          >
            <DollarSign className="w-5 h-5" />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex-shrink-0"
            aria-label="Attach file"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              rows={1}
              className="input-field resize-none py-3 px-4 max-h-32 overflow-y-auto w-full min-h-[48px]"
              placeholder={t('typeMessage')}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !selectedFile) || sending || uploading}
            className="w-12 h-12 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg shadow-brand-600/25 disabled:shadow-none flex-shrink-0"
            aria-label={t('send')}
            title={t('send')}
          >
            {(sending || uploading) ? (
              <span className="animate-spin w-5 h-5 border-2 border-white/50 border-t-white rounded-full" />
            ) : (
              <SendHorizontal className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
