'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full right-0 mb-2 z-50"
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji: { native: string }) => onSelect(emoji.native)}
        theme="dark"
        previewPosition="none"
        skinTonePosition="none"
        maxFrequentRows={2}
        navPosition="bottom"
        perLine={8}
      />
    </motion.div>
  )
}

// Quick reaction picker for messages
interface QuickReactionsProps {
  onSelect: (emoji: string) => void
  onOpenFull: () => void
}

export function QuickReactions({ onSelect, onOpenFull }: QuickReactionsProps) {
  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉']

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="flex items-center gap-1 p-1.5 bg-gray-800 rounded-lg shadow-xl border border-gray-700"
    >
      {quickEmojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded transition-colors text-lg"
        >
          {emoji}
        </button>
      ))}
      <button
        onClick={onOpenFull}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded transition-colors text-gray-400"
      >
        <span className="text-lg">+</span>
      </button>
    </motion.div>
  )
}
