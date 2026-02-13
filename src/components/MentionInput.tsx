'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Profile } from '@/types/database'

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  disabled?: boolean
  users: Profile[]
}

interface MentionSuggestion {
  user: Profile
  index: number
}

const MentionInput = forwardRef<HTMLTextAreaElement, MentionInputProps>(({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type a message...',
  disabled = false,
  users,
}, ref) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Expose ref
  useImperativeHandle(ref, () => textareaRef.current!)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [value])

  // Check for @ mentions while typing
  const checkForMention = useCallback((text: string, cursorPos: number) => {
    // Find the last @ before cursor
    let atIndex = -1
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === '@') {
        atIndex = i
        break
      }
      // Stop if we hit a space (not in the middle of mention)
      if (text[i] === ' ' || text[i] === '\n') {
        break
      }
    }

    if (atIndex === -1) {
      setShowSuggestions(false)
      setMentionStart(null)
      return
    }

    // Get the search term after @
    const searchTerm = text.slice(atIndex + 1, cursorPos).toLowerCase()
    setMentionStart(atIndex)

    // Filter users
    const filtered = users
      .filter(user => {
        const name = (user.fullName || '').toLowerCase()
        const email = user.email.toLowerCase()
        return name.includes(searchTerm) || email.includes(searchTerm)
      })
      .slice(0, 5)
      .map((user, index) => ({ user, index }))

    if (filtered.length > 0) {
      setSuggestions(filtered)
      setShowSuggestions(true)
      setSelectedIndex(0)
    } else {
      setShowSuggestions(false)
    }
  }, [users])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    checkForMention(newValue, e.target.selectionStart || 0)
  }

  // Insert mention
  const insertMention = (user: Profile) => {
    if (mentionStart === null) return

    const before = value.slice(0, mentionStart)
    const after = value.slice(textareaRef.current?.selectionStart || value.length)
    const mention = `@${user.fullName || user.email.split('@')[0]} `
    
    const newValue = before + mention + after
    onChange(newValue)
    setShowSuggestions(false)
    setMentionStart(null)

    // Focus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const cursorPos = before.length + mention.length
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(cursorPos, cursorPos)
      }
    }, 0)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex].user)
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  // Scroll selected suggestion into view
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const selected = suggestionsRef.current.children[selectedIndex] as HTMLElement
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, showSuggestions])

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="message-input w-full min-h-[44px] max-h-[200px] bg-transparent border-none focus:ring-0 focus:outline-none resize-none"
        rows={1}
      />

      {/* Mention suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 mb-2 w-64 max-h-48 overflow-y-auto bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50"
          >
            <div className="p-1">
              <p className="px-2 py-1 text-xs text-gray-500 font-medium">
                People matching
              </p>
              {suggestions.map(({ user, index }) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700 text-gray-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {(user.fullName || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {user.fullName || user.email.split('@')[0]}
                    </p>
                    {user.fullName && (
                      <p className={`text-xs truncate ${
                        index === selectedIndex ? 'text-blue-200' : 'text-gray-400'
                      }`}>
                        {user.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

MentionInput.displayName = 'MentionInput'

export default MentionInput
