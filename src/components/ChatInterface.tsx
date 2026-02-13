'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { signOut } from 'next-auth/react'
import { Profile, Channel, Message, DirectMessage } from '@/types/database'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, X, Send, Hash, Settings, LogOut, 
  Bell, BellOff, MessageCircle, ChevronRight,
  Smile, Paperclip, Reply, Search
} from 'lucide-react'
import { differenceInMinutes } from 'date-fns'
import EmojiPicker from './EmojiPicker'
import FileUpload from './FileUpload'
import MessageBubble from './MessageBubble'
import MentionInput from './MentionInput'
import TypingIndicator from './TypingIndicator'
import ContextMenu, { getMessageMenuItems, getUserMenuItems } from './ContextMenu'
import StatusPicker from './StatusPicker'
import UserProfileModal from './UserProfileModal'

interface ChatInterfaceProps {
  currentUser: Profile
  initialChannels: Channel[]
  allUsers: Profile[]
}

type ChatType = 'channel' | 'dm'

interface SelectedChat {
  type: ChatType
  id: string
  name: string
}

export default function ChatInterface({ currentUser, initialChannels, allUsers }: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [channels] = useState<Channel[]>(initialChannels)
  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(
    initialChannels.length > 0 
      ? { type: 'channel', id: initialChannels[0].id, name: initialChannels[0].name } 
      : null
  )
  const [messages, setMessages] = useState<(Message | DirectMessage)[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | DirectMessage | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  // searchQuery can be used for future search feature
  const [channelsExpanded, setChannelsExpanded] = useState(true)
  const [dmsExpanded, setDmsExpanded] = useState(true)
  const [typingUsers, setTypingUsers] = useState<Profile[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [unreadCounts] = useState<Map<string, number>>(new Map()) // For future unread tracking
  
  // Context menu and modal states
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    type: 'message' | 'user'
    data: Message | DirectMessage | Profile
  } | null>(null)
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const [profileModal, setProfileModal] = useState<Profile | null>(null)
  const [userStatus, setUserStatus] = useState<string | null>(currentUser.status || null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastMessageTimeRef = useRef<string | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    scrollToBottom('auto')
  }, [messages.length, scrollToBottom])

  // Update online status
  useEffect(() => {
    const updateStatus = async () => {
      try {
        await fetch('/api/users/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ online: true })
        })
      } catch (e) {
        console.error('Status update failed:', e)
      }
    }
    
    updateStatus()
    const interval = setInterval(updateStatus, 30000)
    
    return () => {
      clearInterval(interval)
      fetch('/api/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ online: false })
      }).catch(() => {})
    }
  }, [])

  // Load messages when chat selection changes
  useEffect(() => {
    if (!selectedChat) return

    const loadMessages = async () => {
      setLoading(true)
      lastMessageTimeRef.current = null
      setTypingUsers([])
      
      try {
        const url = selectedChat.type === 'channel'
          ? `/api/messages?channelId=${selectedChat.id}`
          : `/api/direct-messages?recipientId=${selectedChat.id}`

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
      setTimeout(() => scrollToBottom('auto'), 100)
    }

    loadMessages()
  }, [selectedChat, scrollToBottom])

  // Poll for new messages and typing indicators
  useEffect(() => {
    if (!selectedChat) return

    const pollMessages = async () => {
      try {
        // Fetch new messages
        if (lastMessageTimeRef.current) {
          const url = selectedChat.type === 'channel'
            ? `/api/messages?channelId=${selectedChat.id}&after=${encodeURIComponent(lastMessageTimeRef.current)}`
            : `/api/direct-messages?recipientId=${selectedChat.id}&after=${encodeURIComponent(lastMessageTimeRef.current)}`

          const res = await fetch(url)
          const data = await res.json()
          
          if (res.ok && data.messages?.length > 0) {
            setMessages(prev => [...prev, ...data.messages])
            lastMessageTimeRef.current = data.messages[data.messages.length - 1].createdAt
            
            // Show notification for messages from others
            const latestMsg = data.messages[data.messages.length - 1]
            if (latestMsg.senderId !== currentUser.id && notificationsEnabled) {
              const sender = latestMsg.sender
              showNotification(sender?.fullName || sender?.email || 'Someone', latestMsg.content)
            }
          }
        }

        // Fetch typing indicators and online users
        if (selectedChat.type === 'channel') {
          const typingRes = await fetch(`/api/typing?channelId=${selectedChat.id}`)
          const typingData = await typingRes.json()
          if (typingRes.ok) {
            setTypingUsers(typingData.users?.filter((u: Profile) => u.id !== currentUser.id) || [])
          }
        }

        // Fetch online users
        const onlineRes = await fetch('/api/users/online')
        const onlineData = await onlineRes.json()
        if (onlineRes.ok) {
          setOnlineUsers(new Set(onlineData.userIds || []))
        }
      } catch (error) {
        console.error('Poll error:', error)
      }
    }

    const interval = setInterval(pollMessages, 2000)
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

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (!selectedChat || selectedChat.type !== 'channel') return
    
    fetch('/api/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId: selectedChat.id })
    }).catch(() => {})

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [selectedChat])

  // Handle input change with typing indicator
  const handleInputChange = (value: string) => {
    setNewMessage(value)
    sendTypingIndicator()
  }

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newMessage.trim() || !selectedChat || sending) return

    const content = newMessage.trim()
    setNewMessage('')
    setSending(true)
    setReplyingTo(null)

    try {
      const url = selectedChat.type === 'channel' ? '/api/messages' : '/api/direct-messages'
      const body = selectedChat.type === 'channel'
        ? { channelId: selectedChat.id, content, replyToId: replyingTo?.id }
        : { recipientId: selectedChat.id, content, replyToId: replyingTo?.id }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      
      if (res.ok && data.message) {
        setMessages(prev => [...prev, data.message])
        lastMessageTimeRef.current = data.message.createdAt
        scrollToBottom()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }

    setSending(false)
    inputRef.current?.focus()
  }

  // Add reaction to message
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!selectedChat) return

    try {
      const url = selectedChat.type === 'channel' 
        ? '/api/reactions' 
        : '/api/dm-reactions'
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, reactions: data.reactions } : msg
        ))
      }
    } catch (error) {
      console.error('Reaction failed:', error)
    }
  }

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedChat || !confirm('Delete this message?')) return

    try {
      const url = selectedChat.type === 'channel'
        ? `/api/messages?id=${messageId}`
        : `/api/direct-messages?id=${messageId}`

      const res = await fetch(url, { method: 'DELETE' })
      
      if (res.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  // Edit message
  const handleEditMessage = async (messageId: string) => {
    if (!selectedChat || !editContent.trim()) return

    try {
      const url = selectedChat.type === 'channel' ? '/api/messages' : '/api/direct-messages'
      
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId, content: editContent.trim() })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? data.message : msg
        ))
        setEditingMessage(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Edit failed:', error)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!selectedChat) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', selectedChat.type)
    formData.append('targetId', selectedChat.id)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
        lastMessageTimeRef.current = data.message.createdAt
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }

    setShowFileUpload(false)
  }

  // Handle emoji select
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  // Sign out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  // Context menu handlers
  const handleMessageContextMenu = (e: React.MouseEvent, message: Message | DirectMessage) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'message',
      data: message
    })
  }

  const handleUserContextMenu = (e: React.MouseEvent, user: Profile) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'user',
      data: user
    })
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleDMUser = (user: Profile) => {
    setSelectedChat({
      type: 'dm',
      id: user.id,
      name: user.fullName || user.email
    })
    setSidebarOpen(false)
    setContextMenu(null)
  }

  const handleStatusChange = async (status: string | null) => {
    try {
      await fetch('/api/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      setUserStatus(status)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  // Get user online status
  const isUserOnline = (userId: string) => onlineUsers.has(userId)

  // Filter users for DM list (exclude self)
  const dmUsers = useMemo(() => 
    allUsers.filter(u => u.id !== currentUser.id),
    [allUsers, currentUser.id]
  )

  return (
    <div className="h-screen flex bg-[#1a1d21]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-[#1a1d21] border-r border-gray-800">
        {/* Workspace header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              BC
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-white truncate">BC Golf Safaris</h1>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isUserOnline(currentUser.id) ? 'bg-green-500' : 'bg-gray-500'}`} />
                <span className="text-xs text-gray-400 truncate">{currentUser.fullName || currentUser.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Channels section */}
          <div className="px-2">
            <button
              onClick={() => setChannelsExpanded(!channelsExpanded)}
              className="w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${channelsExpanded ? 'rotate-90' : ''}`} />
              <span>Channels</span>
              <span className="ml-auto text-gray-600">{channels.length}</span>
            </button>
            
            <AnimatePresence>
              {channelsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChat({ type: 'channel', id: channel.id, name: channel.name })}
                      className={`channel-item w-full ${
                        selectedChat?.type === 'channel' && selectedChat.id === channel.id ? 'active' : ''
                      }`}
                    >
                      <Hash className="w-4 h-4 opacity-70" />
                      <span className="truncate text-sm">{channel.name}</span>
                      {(unreadCounts.get(channel.id) ?? 0) > 0 && (
                        <span className="unread-badge ml-auto">{unreadCounts.get(channel.id)}</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Direct Messages section */}
          <div className="px-2 mt-4">
            <button
              onClick={() => setDmsExpanded(!dmsExpanded)}
              className="w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${dmsExpanded ? 'rotate-90' : ''}`} />
              <span>Direct Messages</span>
            </button>
            
            <AnimatePresence>
              {dmsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {dmUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedChat({ 
                        type: 'dm', 
                        id: user.id, 
                        name: user.fullName || user.email 
                      })}
                      onContextMenu={(e) => handleUserContextMenu(e, user)}
                      className={`channel-item w-full ${
                        selectedChat?.type === 'dm' && selectedChat.id === user.id ? 'active' : ''
                      }`}
                    >
                      <div className="relative">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
                          {(user.fullName || user.email).charAt(0).toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#1a1d21] ${
                          isUserOnline(user.id) ? 'bg-green-500' : 'bg-gray-500'
                        }`} />
                      </div>
                      <span className="truncate text-sm">{user.fullName || user.email}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-medium">
                {(currentUser.fullName || currentUser.email).charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1d21]" />
            </div>
            <button
              onClick={() => setShowStatusPicker(true)}
              className="flex-1 min-w-0 text-left hover:bg-gray-800 rounded-md px-2 py-1 -mx-2 transition-colors"
              title="Click to set status"
            >
              <p className="text-sm font-medium text-white truncate">{currentUser.fullName || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">
                {userStatus || 'Set a status'}
              </p>
            </button>
            <div className="flex items-center gap-1">
              {currentUser.isAdmin && (
                <a
                  href="/admin"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                  title="Admin Panel"
                >
                  <Settings className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-md transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-[#1a1d21] z-50 flex flex-col safe-area-top safe-area-bottom"
            >
              {/* Mobile sidebar header */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                    BC
                  </div>
                  <h1 className="font-bold text-white">BC Golf Safaris</h1>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile sidebar content */}
              <div className="flex-1 overflow-y-auto py-4">
                {/* Channels */}
                <div className="px-3 mb-4">
                  <h2 className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase">Channels</h2>
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setSelectedChat({ type: 'channel', id: channel.id, name: channel.name })
                        setSidebarOpen(false)
                      }}
                      className={`channel-item w-full ${
                        selectedChat?.type === 'channel' && selectedChat.id === channel.id ? 'active' : ''
                      }`}
                    >
                      <Hash className="w-5 h-5" />
                      <span className="truncate">{channel.name}</span>
                    </button>
                  ))}
                </div>

                {/* Direct Messages */}
                <div className="px-3">
                  <h2 className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase">Direct Messages</h2>
                  {dmUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedChat({ type: 'dm', id: user.id, name: user.fullName || user.email })
                        setSidebarOpen(false)
                      }}
                      onContextMenu={(e) => handleUserContextMenu(e, user)}
                      className={`channel-item w-full ${
                        selectedChat?.type === 'dm' && selectedChat.id === user.id ? 'active' : ''
                      }`}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          {(user.fullName || user.email).charAt(0).toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1a1d21] ${
                          isUserOnline(user.id) ? 'bg-green-500' : 'bg-gray-500'
                        }`} />
                      </div>
                      <span className="truncate">{user.fullName || user.email}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile sidebar footer */}
              <div className="p-4 border-t border-gray-800 space-y-2">
                {currentUser.isAdmin && (
                  <a
                    href="/admin"
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    Admin Panel
                  </a>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <header className="h-14 px-4 flex items-center justify-between bg-[#222529] border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              {selectedChat?.type === 'channel' ? (
                <Hash className="w-5 h-5 text-gray-400" />
              ) : (
                <div className="relative">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
                    {selectedChat?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  {selectedChat && isUserOnline(selectedChat.id) && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#222529]" />
                  )}
                </div>
              )}
              <div>
                <h1 className="font-semibold text-white">{selectedChat?.name || 'Select a chat'}</h1>
                {selectedChat?.type === 'dm' && (
                  <p className="text-xs text-gray-400">
                    {isUserOnline(selectedChat.id) ? 'Active now' : 'Offline'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={notificationsEnabled ? () => setNotificationsEnabled(false) : requestNotificationPermission}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            >
              {notificationsEnabled ? (
                <Bell className="w-5 h-5 text-green-400" />
              ) : (
                <BellOff className="w-5 h-5" />
              )}
            </button>
          </div>
        </header>

        {/* Messages area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">No messages yet</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                {!selectedChat 
                  ? 'Select a chat to get started'
                  : selectedChat.type === 'channel' 
                    ? `Start the conversation in #${selectedChat.name}`
                    : `Say hi to ${selectedChat.name}!`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {messages.map((msg, index) => {
                const prevMsg = messages[index - 1]
                const showAvatar = !prevMsg || 
                  prevMsg.senderId !== msg.senderId || 
                  differenceInMinutes(new Date(msg.createdAt), new Date(prevMsg.createdAt)) > 5

                return (
                  <div
                    key={msg.id}
                    onContextMenu={(e) => handleMessageContextMenu(e, msg)}
                  >
                    <MessageBubble
                      message={msg}
                      currentUserId={currentUser.id}
                      showAvatar={showAvatar}
                      onReaction={handleReaction}
                      onReply={() => setReplyingTo(msg)}
                      onEdit={() => {
                        setEditingMessage(msg.id)
                        setEditContent(msg.content)
                      }}
                      onDelete={() => handleDeleteMessage(msg.id)}
                      isEditing={editingMessage === msg.id}
                      editContent={editContent}
                      onEditChange={setEditContent}
                      onEditSave={() => handleEditMessage(msg.id)}
                      onEditCancel={() => {
                        setEditingMessage(null)
                        setEditContent('')
                      }}
                      allUsers={allUsers}
                    />
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Typing indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <TypingIndicator users={typingUsers} />
          )}
        </AnimatePresence>

        {/* Reply preview */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-t-lg border-l-4 border-blue-500">
                <Reply className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  Replying to <span className="text-white font-medium">
                    {(replyingTo as Message).sender?.fullName || 'Unknown'}
                  </span>
                </span>
                <p className="text-sm text-gray-500 truncate flex-1">{replyingTo.content}</p>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message input */}
        <div className={`px-4 pb-4 ${replyingTo ? 'pt-0' : 'pt-2'} safe-area-bottom`}>
          <div className={`relative bg-gray-800 ${replyingTo ? 'rounded-b-lg' : 'rounded-lg'} border border-gray-700 focus-within:border-gray-600 transition-colors`}>
            {/* File upload preview */}
            <AnimatePresence>
              {showFileUpload && (
                <FileUpload 
                  onUpload={handleFileUpload}
                  onClose={() => setShowFileUpload(false)}
                />
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2 p-2">
              {/* Attach button */}
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                disabled={!selectedChat}
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Text input */}
              <div className="flex-1 relative">
                <MentionInput
                  ref={inputRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  onSubmit={handleSendMessage}
                  placeholder={selectedChat ? `Message ${selectedChat.type === 'channel' ? '#' : ''}${selectedChat.name}` : 'Select a chat...'}
                  disabled={!selectedChat}
                  users={allUsers}
                />
              </div>

              {/* Emoji button */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                  disabled={!selectedChat}
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                <AnimatePresence>
                  {showEmojiPicker && (
                    <EmojiPicker
                      onSelect={handleEmojiSelect}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Send button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!newMessage.trim() || !selectedChat || sending}
                className={`p-2 rounded-md transition-colors ${
                  newMessage.trim() && selectedChat
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Send className={`w-5 h-5 ${sending ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && contextMenu.type === 'message' && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={getMessageMenuItems({
              onCopy: () => handleCopyMessage((contextMenu.data as Message | DirectMessage).content),
              onReply: () => {
                setReplyingTo(contextMenu.data as Message | DirectMessage)
                inputRef.current?.focus()
              },
              onReact: () => {
                // TODO: Show emoji picker for reaction
              },
              onEdit: () => {
                const msg = contextMenu.data as Message | DirectMessage
                setEditingMessage(msg.id)
                setEditContent(msg.content)
              },
              onDelete: () => handleDeleteMessage((contextMenu.data as Message | DirectMessage).id),
              isOwn: (contextMenu.data as Message | DirectMessage).senderId === currentUser.id,
            })}
            onClose={() => setContextMenu(null)}
          />
        )}
        
        {contextMenu && contextMenu.type === 'user' && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={getUserMenuItems({
              user: contextMenu.data as Profile,
              currentUserId: currentUser.id,
              onDM: () => handleDMUser(contextMenu.data as Profile),
              onViewProfile: () => setProfileModal(contextMenu.data as Profile),
              onCopyEmail: () => navigator.clipboard.writeText((contextMenu.data as Profile).email),
              onMention: () => {
                const user = contextMenu.data as Profile
                const mention = `@${user.fullName || user.email.split('@')[0]} `
                setNewMessage(prev => prev + mention)
                inputRef.current?.focus()
              },
            })}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {profileModal && (
          <UserProfileModal
            user={profileModal}
            currentUserId={currentUser.id}
            onClose={() => setProfileModal(null)}
            onDM={() => handleDMUser(profileModal)}
          />
        )}
      </AnimatePresence>

      {/* Status Picker */}
      <AnimatePresence>
        {showStatusPicker && (
          <div className="fixed inset-0 z-40" onClick={() => setShowStatusPicker(false)}>
            <div 
              className="absolute bottom-20 left-4"
              onClick={(e) => e.stopPropagation()}
            >
              <StatusPicker
                currentStatus={userStatus}
                onStatusChange={handleStatusChange}
                onClose={() => setShowStatusPicker(false)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
