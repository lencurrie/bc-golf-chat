'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Smile, X, Check } from 'lucide-react'

interface StatusPickerProps {
  currentStatus: string | null
  onStatusChange: (status: string | null) => void
  onClose: () => void
}

const PRESET_STATUSES = [
  { emoji: '🏌️', text: 'On the course' },
  { emoji: '✈️', text: 'Traveling' },
  { emoji: '📞', text: 'In a meeting' },
  { emoji: '🏠', text: 'Working from home' },
  { emoji: '🌴', text: 'On vacation' },
  { emoji: '🍺', text: 'At the 19th hole' },
  { emoji: '🚗', text: 'Commuting' },
  { emoji: '😴', text: 'Away' },
]

export default function StatusPicker({ currentStatus, onStatusChange, onClose }: StatusPickerProps) {
  const [customStatus, setCustomStatus] = useState(currentStatus || '')
  const [showCustom, setShowCustom] = useState(false)

  const handlePresetClick = (status: string) => {
    onStatusChange(status)
    onClose()
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customStatus.trim()) {
      onStatusChange(customStatus.trim())
      onClose()
    }
  }

  const handleClear = () => {
    onStatusChange(null)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute bottom-full left-0 mb-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50"
    >
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">Set a status</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {currentStatus && (
          <div className="flex items-center justify-between bg-gray-700/50 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-300">{currentStatus}</span>
            <button
              onClick={handleClear}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {showCustom ? (
        <form onSubmit={handleCustomSubmit} className="p-3">
          <input
            type="text"
            value={customStatus}
            onChange={(e) => setCustomStatus(e.target.value)}
            placeholder="What's your status?"
            maxLength={50}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={!customStatus.trim()}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowCustom(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
            >
              Back
            </button>
          </div>
        </form>
      ) : (
        <div className="p-2">
          <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto">
            {PRESET_STATUSES.map((status, i) => (
              <button
                key={i}
                onClick={() => handlePresetClick(`${status.emoji} ${status.text}`)}
                className="flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="text-lg">{status.emoji}</span>
                <span>{status.text}</span>
                {currentStatus === `${status.emoji} ${status.text}` && (
                  <Check className="w-4 h-4 text-green-400 ml-auto" />
                )}
              </button>
            ))}
          </div>
          
          <div className="border-t border-gray-700 mt-2 pt-2">
            <button
              onClick={() => setShowCustom(true)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Smile className="w-5 h-5" />
              <span>Set custom status...</span>
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
