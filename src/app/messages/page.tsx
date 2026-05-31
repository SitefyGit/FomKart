'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'

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

      const formattedConvs = data.map(conv => {
        const otherParticipant = conv.participant1_id === userId ? conv.p2 : conv.p1
        return {
          ...conv,
          other_user: otherParticipant
        }
      })

      setConversations(formattedConvs)
      
      // Auto-select first conversation if exists and mobile view not active handling wasn't added
      if (formattedConvs.length > 0 && !activeConversation) {
        selectConversation(formattedConvs[0])
      }
    } catch (e) {
      console.error('Error fetching conversations:', e)
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (conv: any) => {
    setActiveConversation(conv)
    
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data)
      scrollToBottom()
    } catch (e) {
      console.error('Error fetching direct messages:', e)
    }
  }

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
              setTimeout(scrollToBottom, 50)
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
          scrollToBottom()
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

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
        
      // Insert Notification for receiver
      await supabase
        .from('notifications')
        .insert({
          user_id: activeConversation.other_user.id || (activeConversation.participant1_id === currentUser.id ? activeConversation.participant2_id : activeConversation.participant1_id),
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 md:p-6 lg:p-8 pt-16 md:pt-24 lg:pt-24" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Sidebar */}
        <div className={`w-full md:w-1/3 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Inbox</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No messages yet
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left p-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition flex items-center gap-3 ${activeConversation?.id === conv.id ? 'bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-l-emerald-500' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                    {conv.other_user?.avatar_url ? (
                      <img src={conv.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold uppercase">
                        {(conv.other_user?.full_name || conv.other_user?.username || 'U')[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {conv.other_user?.full_name || conv.other_user?.username || 'Unknown User'}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                        {formatRelativeTime(conv.updated_at)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col min-w-0 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 shadow-sm z-10 bg-white dark:bg-gray-800">
                <button 
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => setActiveConversation(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                  {activeConversation.other_user?.avatar_url ? (
                    <img src={activeConversation.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold uppercase">
                      {(activeConversation.other_user?.full_name || activeConversation.other_user?.username || 'U')[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {activeConversation.other_user?.full_name || activeConversation.other_user?.username}
                  </h3>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/20">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    This is the start of your conversation.
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_id === currentUser.id
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[75%] ${isMine ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl ${isMine ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-bl-sm shadow-sm'}`}>
                          <p className="whitespace-pre-wrap word-break-break-word break-words">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 pl-4 py-2.5 bg-gray-100 dark:bg-gray-900 border-none rounded-full focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 transition-colors flex shrink-0 items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-300">Your Messages</p>
              <p className="mt-2 text-center max-w-sm">Select a conversation to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
