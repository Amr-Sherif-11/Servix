import re

file_path = r"d:\Servix\src\app\[locale]\messages\[chatId]\page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Imports
content = content.replace(
    "import { useAppStore } from '@/store/appStore'",
    "import { useAppStore } from '@/store/appStore'\nimport { usePresenceStore } from '@/store/presenceStore'\nimport { DollarSign } from 'lucide-react'"
)

# 2. Update Message Type
content = content.replace(
    "is_read: boolean",
    "is_seen: boolean\n  type?: string\n  offer_details?: any"
)

# 3. Add state variables for Send Offer
content = content.replace(
    "const [uploading, setUploading] = useState(false)",
    "const [uploading, setUploading] = useState(false)\n  const [showOfferModal, setShowOfferModal] = useState(false)\n  const [offerAmount, setOfferAmount] = useState('')\n  const [offerDesc, setOfferDesc] = useState('')\n  const { isUserOnline } = usePresenceStore()"
)

# 4. Fetching messages: select offer_details
content = content.replace(
    ".select('*')",
    ".select('*, offer_details(*)')"
)

# 5. Mark as seen instead of read
content = content.replace("is_read: true", "is_seen: true")
content = content.replace("is_read: false", "is_seen: false")
content = content.replace(".eq('is_read', false)", ".eq('is_seen', false)")

# 6. Realtime UPDATE listener
content = content.replace(
    "filter: `conversation_id=eq.${chatId}`,\n      }, (payload) => {",
    """filter: `conversation_id=eq.${chatId}`,
      }, (payload) => {"""
)
# Add an update listener
update_listener = """
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
      })"""

# Insert update listener after the INSERT listener
content = content.replace(
    "setTypingUsers(typing)\n      })",
    f"setTypingUsers(typing)\n      }}){update_listener}"
)


# 7. Modify sending message to support 'offer' type
send_message_patch = """
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

    const { data: msg, error: msgErr } = await supabase.from('messages').insert(messageData).select().single()
    
    if (!msgErr && msg) {
      await supabase.from('offer_details').insert({
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
    await supabase.from('offer_details').update({ status: action }).eq('message_id', msgId)
  }
"""
content = content.replace("const sendMessage = async () => {", f"{send_message_patch}\n  const sendMessage = async () => {{")

# 8. Render Offer UI
offer_ui_render = """
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
                        ) : ("""

content = content.replace("{msg.attachment_url && (", f"{offer_ui_render}\n{'{msg.attachment_url && ('}")

# Close the ternary operator we opened for msg.type === 'offer'
content = content.replace("{msg.content && <p className=\"text-sm leading-relaxed whitespace-pre-wrap break-words\">{msg.content}</p>}", "{msg.content && <p className=\"text-sm leading-relaxed whitespace-pre-wrap break-words\">{msg.content}</p>}\n)}")

# 9. Online Presence green dot
content = content.replace(
    "<p className=\"text-xs text-green-500\">{typingUsers.length > 0 ? t('typing', { defaultValue: 'Typing...' }) : t('online')}</p>",
    "<p className=\"text-xs text-gray-500 flex items-center gap-1\">{typingUsers.length > 0 ? <span className=\"text-green-500\">{t('typing', { defaultValue: 'Typing...' })}</span> : otherUser ? (isUserOnline(otherUser.id) ? <><span className=\"w-2 h-2 rounded-full bg-green-500 inline-block\"></span> <span className=\"text-green-500\">{t('online', { defaultValue: 'Online' })}</span></> : t('offline', { defaultValue: 'Offline' })) : ''}</p>"
)

# 10. WhatsApp Ticks
content = content.replace(
    "msg.is_read\n                            ? <CheckCheck className=\"w-3.5 h-3.5 text-brand-500\" />\n                            : <Check className=\"w-3.5 h-3.5 text-gray-400\" />",
    "msg.is_seen\n                            ? <CheckCheck className=\"w-4 h-4 text-blue-500\" />\n                            : <Check className=\"w-3.5 h-3.5 text-gray-400\" />"
)

# 11. Send Offer Button
offer_modal_ui = """
      {/* Offer Modal */}
      {showOfferModal && (
        <div className="absolute bottom-full left-0 right-0 mb-4 mx-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 animate-slide-up">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white">{t('sendOffer', { defaultValue: 'Send Price Offer' })}</h3>
            <button onClick={() => setShowOfferModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
"""

content = content.replace(
    "      {/* Input */}",
    f"{offer_modal_ui}\n      {{/* Input */}}"
)

content = content.replace(
    "          <button \n            onClick={() => fileInputRef.current?.click()}",
    """          <button 
            onClick={() => setShowOfferModal(!showOfferModal)}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 ${showOfferModal ? 'text-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            aria-label="Send offer"
            title="Send offer"
          >
            <DollarSign className="w-5 h-5" />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}"""
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
