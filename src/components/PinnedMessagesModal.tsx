'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Message, Profile } from '@/types/database'
import { X, Pin, Hash } from 'lucide-react'
import MessageBubble from './MessageBubble'

interface PinnedMessagesModalProps {
  channelId: string
  channelName: string
  currentUserId: string
  allUsers: Profile[]
  onClose: () => void
  onUnpin: (messageId: string) => void
}

export default function PinnedMessagesModal({
  channelId,
  channelName,
  currentUserId,
  allUsers,
  onClose,
  onUnpin
}: PinnedMessagesModalProps) {
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPinnedMessages = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/messages/pinned?channelId=${channelId}`)
        if (res.ok) {
          const data = await res.json()
          setPinnedMessages(data.pinnedMessages || [])
        }
      } catch (error) {
        console.error('Failed to load pinned messages:', error)
      }
      setLoading(false)
    }

    loadPinnedMessages()
  }, [channelId])

  const handleUnpin = async (messageId: string) => {
    onUnpin(messageId)
    setPinnedMessages(prev => prev.filter(msg => msg.id !== messageId))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#2f3349] rounded-xl max-w-2xl w-full max-h-[80vh] mx-4 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Pin className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Pinned Messages</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Hash className="w-4 h-4" />
                <span>{channelName}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Loading pinned messages...</p>
              </div>
            </div>
          ) : pinnedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                <Pin className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No pinned messages</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                Pin important messages to keep them easily accessible for everyone in the channel.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pinnedMessages.map((message) => (
                <div 
                  key={message.id}
                  className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50"
                >
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                    <Pin className="w-3 h-3 text-amber-400" />
                    <span>
                      Pinned by {message.pinner?.fullName || message.pinner?.email || 'Unknown'}
                    </span>
                    {message.pinnedAt && (
                      <span>
                        on {new Date(message.pinnedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  <MessageBubble
                    message={message}
                    currentUserId={currentUserId}
                    showAvatar={true}
                    onReaction={() => {}} // Disabled in modal
                    onReply={() => {}} // Disabled in modal
                    onEdit={() => {}} // Disabled in modal
                    onDelete={() => {}} // Disabled in modal
                    onUnpin={() => handleUnpin(message.id)}
                    isEditing={false}
                    editContent=""
                    onEditChange={() => {}}
                    onEditSave={() => {}}
                    onEditCancel={() => {}}
                    allUsers={allUsers}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}