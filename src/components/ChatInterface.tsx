'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { Profile, Channel, Message, DirectMessage } from '@/types/database'
import { 
  Menu, X, Send, Hash, User, Settings, LogOut, 
  Bell, BellOff, MessageCircle, ChevronDown
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

interface ChatInterfaceProps {
  currentUser: Profile
  initialChannels: Channel[]
  allUsers: Profile[]
}

type ChatType = 'channel' | 'dm'

export default function ChatInterface({ currentUser, initialChannels, allUsers }: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [channels] = useState<Channel[]>(initialChannels)
  const [selectedChat, setSelectedChat] = useState<{ type: ChatType; id: string; name: string } | null>(
    initialChannels.length > 0 ? { type: 'channel', id: initialChannels[0].id, name: initialChannels[0].name } : null
  )
  const [messages, setMessages] = useState<(Message | DirectMessage)[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastMessageTimeRef = useRef<string | null>(null)

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load messages when chat selection changes
  useEffect(() => {
    if (!selectedChat) return

    const loadMessages = async () => {
      setLoading(true)
      lastMessageTimeRef.current = null
      
      try {
        let url: string
        if (selectedChat.type === 'channel') {
          url = `/api/messages?channelId=${selectedChat.id}`
        } else {
          url = `/api/direct-messages?recipientId=${selectedChat.id}`
        }

        const res = await fetch(url)
        const data = await res.json()
        
        if (res.ok) {
          const msgs = data.messages || []
          setMessages(msgs)
          if (msgs.length > 0) {
            lastMessageTimeRef.current = msgs[msgs.length - 1].createdAt
          }
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
      }
      
      setLoading(false)
    }

    loadMessages()
  }, [selectedChat])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!selectedChat) return

    const pollMessages = async () => {
      if (!lastMessageTimeRef.current) return

      try {
        let url: string
        if (selectedChat.type === 'channel') {
          url = `/api/messages?channelId=${selectedChat.id}&after=${encodeURIComponent(lastMessageTimeRef.current)}`
        } else {
          url = `/api/direct-messages?recipientId=${selectedChat.id}&after=${encodeURIComponent(lastMessageTimeRef.current)}`
        }

        const res = await fetch(url)
        const data = await res.json()
        
        if (res.ok && data.messages?.length > 0) {
          const newMsgs = data.messages
          setMessages(prev => [...prev, ...newMsgs])
          lastMessageTimeRef.current = newMsgs[newMsgs.length - 1].createdAt
          
          // Show notification for messages from others
          const latestMsg = newMsgs[newMsgs.length - 1]
          if (latestMsg.senderId !== currentUser.id && notificationsEnabled) {
            const sender = latestMsg.sender
            showNotification(sender?.fullName || sender?.email || 'Someone', latestMsg.content)
          }
        }
      } catch (error) {
        console.error('Poll error:', error)
      }
    }

    const interval = setInterval(pollMessages, 3000)
    return () => clearInterval(interval)
  }, [selectedChat, currentUser.id, notificationsEnabled])

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
    }
  }

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' })
    }
  }

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChat) return

    const content = newMessage.trim()
    setNewMessage('')

    try {
      let url: string
      let body: object
      
      if (selectedChat.type === 'channel') {
        url = '/api/messages'
        body = { channelId: selectedChat.id, content }
      } else {
        url = '/api/direct-messages'
        body = { recipientId: selectedChat.id, content }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      
      if (res.ok && data.message) {
        setMessages(prev => [...prev, data.message])
        lastMessageTimeRef.current = data.message.createdAt
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }

    inputRef.current?.focus()
  }

  // Sign out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isToday(date)) {
      return format(date, 'h:mm a')
    } else if (isYesterday(date)) {
      return 'Yesterday ' + format(date, 'h:mm a')
    }
    return format(date, 'MMM d, h:mm a')
  }

  // Get sender info for a message
  const getSender = (msg: Message | DirectMessage): Profile | undefined => {
    return (msg as Message & { sender?: Profile }).sender
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-gray-400 hover:text-white touch-target"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2 text-center">
          {selectedChat?.type === 'channel' ? (
            <Hash className="w-5 h-5 text-gray-400" />
          ) : (
            <User className="w-5 h-5 text-gray-400" />
          )}
          <h1 className="font-semibold text-white truncate max-w-[200px]">
            {selectedChat?.name || 'Select a chat'}
          </h1>
        </div>

        <button
          onClick={notificationsEnabled ? () => setNotificationsEnabled(false) : requestNotificationPermission}
          className="p-2 -mr-2 text-gray-400 hover:text-white touch-target"
          aria-label={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
        >
          {notificationsEnabled ? (
            <Bell className="w-6 h-6 text-green-400" />
          ) : (
            <BellOff className="w-6 h-6" />
          )}
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Messages area */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle className="w-12 h-12 mb-2" />
                <p>No messages yet</p>
                <p className="text-sm">Be the first to say hello!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const sender = getSender(msg)
                const isOwn = msg.senderId === currentUser.id
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  >
                    <div className={`max-w-[85%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      {!isOwn && (
                        <p className="text-xs text-gray-400 mb-1 ml-1">
                          {sender?.fullName || sender?.email || 'Unknown'}
                        </p>
                      )}
                      <div className={`message-bubble ${isOwn ? 'message-bubble-sent' : 'message-bubble-received'}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                        {formatMessageTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-gray-700 bg-gray-800 p-4 safe-area-bottom"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white rounded-full px-4 py-3 placeholder-gray-400 border-none"
                disabled={!selectedChat}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !selectedChat}
                className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full text-white transition-colors touch-target"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-gray-800 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } safe-area-top safe-area-bottom flex flex-col`}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
              {currentUser.fullName?.charAt(0) || currentUser.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-white">{currentUser.fullName || 'User'}</p>
              <p className="text-xs text-gray-400">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-gray-400 hover:text-white touch-target"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <ChevronDown className="w-4 h-4" />
                Channels
              </h2>
            </div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    setSelectedChat({ type: 'channel', id: channel.id, name: channel.name })
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors touch-target ${
                    selectedChat?.type === 'channel' && selectedChat.id === channel.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <Hash className="w-5 h-5 text-gray-400" />
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Messages */}
          <div className="p-4 pt-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <ChevronDown className="w-4 h-4" />
                Direct Messages
              </h2>
            </div>
            <div className="space-y-1">
              {allUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedChat({ type: 'dm', id: user.id, name: user.fullName || user.email })
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors touch-target ${
                    selectedChat?.type === 'dm' && selectedChat.id === user.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                    {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{user.fullName || user.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          {currentUser.isAdmin && (
            <a
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors touch-target"
            >
              <Settings className="w-5 h-5" />
              Admin Panel
            </a>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors touch-target"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </div>
  )
}
