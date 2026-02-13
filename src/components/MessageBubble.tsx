'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Message, DirectMessage, Profile, Reaction, Attachment } from '@/types/database'
import { 
  Reply, Smile, Edit2, Trash2, 
  Check, X, ExternalLink, Download, Pin, PinOff
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { QuickReactions } from './EmojiPicker'

interface MessageBubbleProps {
  message: Message | DirectMessage
  currentUserId: string
  showAvatar: boolean
  onReaction: (messageId: string, emoji: string) => void
  onReply: () => void
  onEdit: () => void
  onDelete: () => void
  onPin?: () => void
  onUnpin?: () => void
  isEditing: boolean
  editContent: string
  onEditChange: (content: string) => void
  onEditSave: () => void
  onEditCancel: () => void
  allUsers: Profile[]
}

export default function MessageBubble({
  message,
  currentUserId,
  showAvatar,
  onReaction,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  isEditing,
  editContent,
  onEditChange,
  onEditSave,
  onEditCancel,
  allUsers,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const sender = (message as Message).sender
  const isOwn = message.senderId === currentUserId
  const reactions = message.reactions || []
  const attachments = message.attachments || []
  const replyTo = (message as Message).replyTo

  // Focus edit input when editing
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.selectionStart = editInputRef.current.value.length
    }
  }, [isEditing])

  // Close actions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false)
        setShowReactions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return format(date, 'h:mm a')
  }

  const formatFullTime = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`
    }
    return format(date, 'MMM d, yyyy h:mm a')
  }

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction)
    return acc
  }, {} as Record<string, Reaction[]>)

  // Parse content for mentions and links
  const parseContent = (content: string) => {
    // Match @mentions
    const mentionRegex = /@(\w+)/g
    // Match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g

    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    let match

    // Find all mentions and URLs
    const matches: { index: number; length: number; element: JSX.Element }[] = []

    // Find mentions
    while ((match = mentionRegex.exec(content)) !== null) {
      const user = allUsers.find(u => 
        u.fullName?.toLowerCase() === match![1].toLowerCase() ||
        u.email.split('@')[0].toLowerCase() === match![1].toLowerCase()
      )
      if (user) {
        matches.push({
          index: match.index,
          length: match[0].length,
          element: (
            <span 
              key={`mention-${match.index}`} 
              className="mention"
              title={user.email}
            >
              @{user.fullName || user.email.split('@')[0]}
            </span>
          )
        })
      }
    }

    // Find URLs
    while ((match = urlRegex.exec(content)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        element: (
          <a
            key={`url-${match.index}`}
            href={match[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            {match[0]}
          </a>
        )
      })
    }

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index)

    // Build parts array
    matches.forEach(({ index, length, element }) => {
      if (index > lastIndex) {
        parts.push(content.slice(lastIndex, index))
      }
      parts.push(element)
      lastIndex = index + length
    })

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    return parts.length > 0 ? parts : content
  }

  // Emoji shortcodes
  const processEmojis = (content: string) => {
    const emojiMap: Record<string, string> = {
      ':smile:': '😊', ':grin:': '😁', ':laugh:': '😂', ':joy:': '🤣',
      ':heart:': '❤️', ':thumbsup:': '👍', ':thumbsdown:': '👎', ':clap:': '👏',
      ':fire:': '🔥', ':100:': '💯', ':star:': '⭐', ':sparkles:': '✨',
      ':check:': '✅', ':x:': '❌', ':warning:': '⚠️', ':info:': 'ℹ️',
      ':rocket:': '🚀', ':golf:': '⛳', ':trophy:': '🏆', ':party:': '🎉',
      ':beer:': '🍺', ':coffee:': '☕', ':sun:': '☀️', ':rain:': '🌧️',
    }

    return content.replace(/:(\w+):/g, (match) => {
      return emojiMap[match] || match
    })
  }

  return (
    <div 
      className={`group relative flex gap-3 px-2 py-1 -mx-2 rounded-lg transition-colors hover:bg-gray-800/50 ${
        !showAvatar ? 'mt-0' : 'mt-3'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        if (!showReactions) {
          setShowActions(false)
        }
      }}
    >
      {/* Avatar */}
      <div className="w-10 flex-shrink-0">
        {showAvatar && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium ${
            isOwn 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
              : 'bg-gradient-to-br from-purple-500 to-blue-500'
          }`}>
            {(sender?.fullName || sender?.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Header - only show for first message in group */}
        {showAvatar && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-white">
              {sender?.fullName || sender?.email?.split('@')[0] || 'Unknown'}
            </span>
            <span className="text-xs text-gray-500" title={formatFullTime(message.createdAt)}>
              {formatTime(message.createdAt)}
            </span>
            {message.isEdited && (
              <span className="text-xs text-gray-500">(edited)</span>
            )}
            {(message as Message).isPinned && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                <Pin className="w-3 h-3" />
                pinned
              </span>
            )}
          </div>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div className="mb-1 pl-3 border-l-2 border-gray-600 text-sm">
            <span className="text-gray-500">↩ </span>
            <span className="text-blue-400 font-medium">
              {replyTo.sender?.fullName || 'Unknown'}
            </span>
            <span className="text-gray-400 ml-1 truncate inline-block max-w-[200px] align-bottom">
              {replyTo.content}
            </span>
          </div>
        )}

        {/* Message body */}
        {isEditing ? (
          <div className="flex items-start gap-2">
            <textarea
              ref={editInputRef}
              value={editContent}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onEditSave()
                } else if (e.key === 'Escape') {
                  onEditCancel()
                }
              }}
              className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm resize-none border border-gray-600 focus:border-blue-500 focus:outline-none"
              rows={2}
            />
            <div className="flex flex-col gap-1">
              <button
                onClick={onEditSave}
                className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onEditCancel}
                className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="message-content text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
            {parseContent(processEmojis(message.content))}
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}

        {/* Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(groupedReactions).map(([emoji, reacts]) => {
              const hasReacted = reacts.some(r => r.userId === currentUserId)
              return (
                <button
                  key={emoji}
                  onClick={() => onReaction(message.id, emoji)}
                  className={`reaction-btn ${hasReacted ? 'active' : ''}`}
                  title={reacts.map(r => {
                    const user = allUsers.find(u => u.id === r.userId)
                    return user?.fullName || user?.email || 'Unknown'
                  }).join(', ')}
                >
                  <span>{emoji}</span>
                  <span className="text-xs text-gray-400">{reacts.length}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Actions menu */}
      <AnimatePresence>
        {showActions && !isEditing && (
          <motion.div
            ref={actionsRef}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-0 right-2 -translate-y-1/2 flex items-center gap-0.5 p-1 bg-gray-800 rounded-lg shadow-xl border border-gray-700"
          >
            {/* Quick reactions */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Add reaction"
              >
                <Smile className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showReactions && (
                  <div className="absolute bottom-full right-0 mb-2 z-50">
                    <QuickReactions
                      onSelect={(emoji) => {
                        onReaction(message.id, emoji)
                        setShowReactions(false)
                        setShowActions(false)
                      }}
                      onOpenFull={() => {}}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={onReply}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Reply"
            >
              <Reply className="w-4 h-4" />
            </button>

            {/* Pin/Unpin button - only for channel messages */}
            {(message as Message).channelId && (
              <button
                onClick={(message as Message).isPinned ? onUnpin : onPin}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title={(message as Message).isPinned ? 'Unpin message' : 'Pin message'}
              >
                {(message as Message).isPinned ? (
                  <PinOff className="w-4 h-4" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </button>
            )}

            {isOwn && (
              <>
                <button
                  onClick={onEdit}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Attachment preview component
function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.mimeType.startsWith('image/')

  if (isImage) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-sm rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
      >
        <img
          src={attachment.url}
          alt={attachment.filename}
          className="max-h-60 object-contain bg-gray-900"
          loading="lazy"
        />
      </a>
    )
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
    >
      <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
        <Download className="w-5 h-5 text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-white truncate">{attachment.filename}</p>
        <p className="text-xs text-gray-400">
          {(attachment.size / 1024).toFixed(1)} KB
        </p>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-500 ml-2" />
    </a>
  )
}
