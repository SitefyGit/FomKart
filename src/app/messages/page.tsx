'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { createNotification } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Send, MessageCircle } from 'lucide-react'

// Simple relative time formatter
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.round((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.round(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.round(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.round(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversation, setActiveConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user)
      if (data.user) {
        fetchConversations(data.user.id)
      } else {
        setLoading(false)
      }
    })
  }, [])

  const fetchConversations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          updated_at,
          participant1_id,
          participant2_id,
          p1:participant1_id (username, full_name, avatar_url),
          p2:participant2_id (username, full_name, avatar_url)
        `)
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('updated_at', { ascending: false })

      if (error) throw error

      const { data: notifications } = await supabase
        .from('notifications')
        .select('data')
        .eq('user_id', userId)
        .eq('type', 'direct_message')
        .eq('is_read', false)

      const unreadConvIds = new Set(notifications?.map(n => n.data?.conversation_id))

      const formattedConvs = data.map(conv => {
        const otherParticipant = conv.participant1_id === userId ? conv.p2 : conv.p1
        return {
          ...conv,
          other_user: otherParticipant,
          unread: unreadConvIds.has(conv.id)
        }
      })

      setConversations(formattedConvs)
    } catch (e) {
      console.error('Error fetching conversations:', e)
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (conv: any) => {
    setActiveConversation(conv)
    
    if (conv.unread && currentUser) {
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: false } : c))
      
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUser.id)
        .eq('type', 'direct_message')
        .eq('is_read', false)
        .contains('data', { conversation_id: conv.id })
    }

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data)
      scrollToBottom(false)
    } catch (e) {
      console.error('Error fetching direct messages:', e)
    }
  }

  // Effect to auto-select conversation from URL
  useEffect(() => {
    if (conversations.length > 0 && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const cId = urlParams.get('c')
      if (cId) {
        const conv = conversations.find(c => c.id === cId)
        if (conv && !activeConversation) {
          selectConversation(conv)
          // Clean up the URL
          window.history.replaceState(null, '', '/messages')
        }
      }
    }
  }, [conversations])

  // Effect to handle live message polling for the active conversation
  useEffect(() => {
    if (!activeConversation) return

    const pollMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('direct_messages')
          .select('*')
          .eq('conversation_id', activeConversation.id)
          .order('created_at', { ascending: true })

        if (!error && data) {
          setMessages(prev => {
            if (prev.length !== data.length) {
              setTimeout(() => scrollToBottom(true), 50)
              return data
            }
            return prev
          })
        }
      } catch (e) {
        // ignore
      }
    }

    // Set up realtime subscription (might not work depending on DB config)
    const channel = supabase.channel(`messages-${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${activeConversation.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new])
          scrollToBottom(true)
        }
      )
      .subscribe()

    // Fallback polling to ensure instant delivery
    const interval = setInterval(pollMessages, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [activeConversation])

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      if (messagesEndRef.current?.parentElement) {
        messagesEndRef.current.parentElement.scrollTo({
          top: messagesEndRef.current.parentElement.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto'
        })
      }
    }, 100)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation || !currentUser) return

    const { id } = activeConversation
    const content = newMessage.trim()
    setNewMessage('')
    
    // Optimistic UI updates could be added here
    
    // Instead of using API we can insert directly since RLS is configured
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: id,
          sender_id: currentUser.id,
          content: content
        })

      if (error) throw error
      
      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)
        
      // Insert Notification for receiver using the server action to bypass RLS
      await createNotification({
        user_id: activeConversation.other_user?.id || (activeConversation.participant1_id === currentUser.id ? activeConversation.participant2_id : activeConversation.participant1_id),
        type: 'direct_message',
        title: 'New Message',
        message: 'You have received a new direct message.',
        data: { conversation_id: id }
      })
        
    } catch (e) {
      console.error('Error sending message:', e)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">Loading...</div>
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Messages</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Please log in to view your messages</p>
        <Link href="/auth/login" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium">Log In</Link>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#0b1120]" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="w-full h-full flex overflow-hidden">
        
        {/* Sidebar */}
        <div className={`w-full md:w-[320px] lg:w-[380px] flex-shrink-0 border-r border-gray-100 dark:border-gray-800/60 flex flex-col bg-gray-50/50 dark:bg-[#0b1120] ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-5 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Messages</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 space-y-4">
                <MessageCircle className="w-12 h-12 opacity-20" />
                <p>No messages yet</p>
              </div>
            ) : (
              <div className="py-2">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full text-left px-5 py-4 transition-all duration-200 flex items-center gap-4 group
                      ${activeConversation?.id === conv.id 
                        ? 'bg-white dark:bg-gray-800/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-none relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-emerald-500 before:rounded-r-full' 
                        : 'hover:bg-white/60 dark:hover:bg-gray-800/30'} 
                      ${conv.unread && activeConversation?.id !== conv.id ? 'bg-emerald-50/30 dark:bg-emerald-500/[0.03]' : ''}`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shrink-0 shadow-inner border border-white/50 dark:border-gray-700">
                        {conv.other_user?.avatar_url ? (
                          <img src={conv.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold uppercase text-lg">
                            {(conv.other_user?.full_name || conv.other_user?.username || 'U')[0]}
                          </div>
                        )}
                      </div>
                      {conv.unread && (
                        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 shadow-sm"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`truncate text-[15px] ${conv.unread ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors'}`}>
                          {conv.other_user?.full_name || conv.other_user?.username || 'Unknown User'}
                        </h3>
                        <span className={`text-[11px] shrink-0 ml-2 ${conv.unread ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                          {formatRelativeTime(conv.updated_at)}
                        </span>
                      </div>
                      <p className={`text-[13px] truncate ${conv.unread ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                        {conv.unread ? 'New message waiting' : 'Click to view conversation'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col min-w-0 relative bg-[#f8fafc] dark:bg-[#0f172a] ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-200/60 dark:border-gray-800/80 flex items-center gap-4 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl absolute top-0 left-0 right-0 z-20 shadow-sm">
                <button 
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                  onClick={() => setActiveConversation(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0 border border-gray-100 dark:border-gray-600 shadow-sm">
                  {activeConversation.other_user?.avatar_url ? (
                    <img src={activeConversation.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold uppercase">
                      {(activeConversation.other_user?.full_name || activeConversation.other_user?.username || 'U')[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                    {activeConversation.other_user?.full_name || activeConversation.other_user?.username}
                  </h3>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 mt-[73px] mb-[90px] relative z-10 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                      <Send className="w-6 h-6 text-emerald-500 opacity-60" />
                    </div>
                    <p className="text-sm">Start the conversation</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_id === currentUser.id
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[80%] md:max-w-[70%] ${isMine ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <div className={`px-5 py-3 text-[15px] leading-relaxed shadow-sm ${isMine ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm'}`}>
                          <p className="whitespace-pre-wrap word-break-break-word break-words">{msg.content}</p>
                        </div>
                        <span className={`text-[11px] font-medium mt-1.5 px-1 opacity-70 ${isMine ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              {/* Message Input */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent dark:from-[#0f172a] dark:via-[#0f172a] pt-12 pb-6 px-4 md:px-8 z-20 pointer-events-none">
                <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto bg-white dark:bg-[#1e293b] p-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-gray-200/80 dark:border-gray-700 pointer-events-auto transition-transform focus-within:-translate-y-0.5 duration-200">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 pl-5 py-2.5 bg-transparent border-none focus:ring-0 text-[15px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-11 h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all duration-200 flex shrink-0 items-center justify-center shadow-md shadow-emerald-600/20"
                  >
                    <Send className="w-5 h-5 -ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8 relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-gray-100 dark:border-gray-700/50">
                <MessageCircle className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Your Messages</h2>
              <p className="text-center max-w-sm text-[15px] opacity-80">Select a conversation from the sidebar to start chatting with buyers and sellers.</p>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.4);
        }
      `}} />
    </div>
  )
}
