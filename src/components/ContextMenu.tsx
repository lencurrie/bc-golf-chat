'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Copy, Reply, Edit2, Trash2, Smile, MessageCircle, 
  Mail, User, AtSign, Pin, Forward, Flag
} from 'lucide-react'

interface MenuItem {
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position to stay in viewport
  const adjustedX = Math.min(x, window.innerWidth - 200)
  const adjustedY = Math.min(y, window.innerHeight - (items.length * 40 + 20))

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="fixed z-[100] min-w-[180px] bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 overflow-hidden"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.divider && index > 0 && (
            <div className="h-px bg-gray-700 my-1" />
          )}
          <button
            onClick={() => {
              if (!item.disabled) {
                item.onClick()
                onClose()
              }
            }}
            disabled={item.disabled}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
              item.disabled 
                ? 'text-gray-600 cursor-not-allowed' 
                : item.danger 
                  ? 'text-red-400 hover:bg-red-500/10' 
                  : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="w-4 h-4 flex items-center justify-center">
              {item.icon}
            </span>
            {item.label}
          </button>
        </div>
      ))}
    </motion.div>
  )
}

// Helper to create message context menu items
export function getMessageMenuItems(options: {
  onCopy: () => void
  onReply: () => void
  onReact: () => void
  onEdit?: () => void
  onDelete?: () => void
  onPin?: () => void
  isOwn: boolean
}): MenuItem[] {
  const items: MenuItem[] = [
    {
      label: 'Copy Text',
      icon: <Copy className="w-4 h-4" />,
      onClick: options.onCopy,
    },
    {
      label: 'Reply',
      icon: <Reply className="w-4 h-4" />,
      onClick: options.onReply,
    },
    {
      label: 'Add Reaction',
      icon: <Smile className="w-4 h-4" />,
      onClick: options.onReact,
    },
  ]

  if (options.onPin) {
    items.push({
      label: 'Pin Message',
      icon: <Pin className="w-4 h-4" />,
      onClick: options.onPin,
    })
  }

  if (options.isOwn) {
    items.push({
      label: 'Edit',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: options.onEdit || (() => {}),
      divider: true,
    })
    items.push({
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: options.onDelete || (() => {}),
      danger: true,
    })
  }

  return items
}

// Helper to create user context menu items
export function getUserMenuItems(options: {
  user: { id: string; email: string; fullName?: string | null }
  currentUserId: string
  onDM: () => void
  onViewProfile: () => void
  onCopyEmail: () => void
  onMention?: () => void
}): MenuItem[] {
  const isCurrentUser = options.user.id === options.currentUserId
  
  const items: MenuItem[] = []

  if (!isCurrentUser) {
    items.push({
      label: 'Send Message',
      icon: <MessageCircle className="w-4 h-4" />,
      onClick: options.onDM,
    })
    
    if (options.onMention) {
      items.push({
        label: 'Mention',
        icon: <AtSign className="w-4 h-4" />,
        onClick: options.onMention,
      })
    }
  }

  items.push({
    label: 'View Profile',
    icon: <User className="w-4 h-4" />,
    onClick: options.onViewProfile,
    divider: !isCurrentUser,
  })

  items.push({
    label: 'Copy Email',
    icon: <Mail className="w-4 h-4" />,
    onClick: options.onCopyEmail,
  })

  return items
}
