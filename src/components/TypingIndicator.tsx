'use client'

import { motion } from 'framer-motion'
import { Profile } from '@/types/database'

interface TypingIndicatorProps {
  users: Profile[]
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const names = users.map(u => u.fullName || u.email.split('@')[0])
  
  let text = ''
  if (names.length === 1) {
    text = `${names[0]} is typing`
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`
  } else if (names.length === 3) {
    text = `${names[0]}, ${names[1]}, and ${names[2]} are typing`
  } else {
    text = `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing`
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="px-6 py-2"
    >
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <div className="flex items-center gap-1">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
        <span>{text}</span>
      </div>
    </motion.div>
  )
}
