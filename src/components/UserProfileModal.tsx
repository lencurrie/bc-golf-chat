'use client'

import { motion } from 'framer-motion'
import { X, Mail, MessageCircle, Clock, Calendar } from 'lucide-react'
import { Profile } from '@/types/database'
import { format, formatDistanceToNow } from 'date-fns'

interface UserProfileModalProps {
  user: Profile
  currentUserId: string
  onClose: () => void
  onDM: () => void
}

export default function UserProfileModal({ user, currentUserId, onClose, onDM }: UserProfileModalProps) {
  const isCurrentUser = user.id === currentUserId
  const isOnline = user.lastSeenAt && 
    (new Date().getTime() - new Date(user.lastSeenAt).getTime()) < 5 * 60 * 1000 // 5 min

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
      >
        {/* Header with avatar */}
        <div className="relative h-24 bg-gradient-to-br from-blue-600 to-purple-600">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Avatar */}
        <div className="relative -mt-12 px-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-800">
              {(user.fullName || user.email).charAt(0).toUpperCase()}
            </div>
            {/* Online indicator */}
            <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-gray-800 ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`} />
          </div>
        </div>

        {/* User info */}
        <div className="px-6 pt-3 pb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                {user.fullName || 'No name set'}
              </h2>
              <p className="text-gray-400 text-sm">{user.email}</p>
              {user.status && (
                <p className="text-gray-300 text-sm mt-1">{user.status}</p>
              )}
            </div>
            {user.isAdmin && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                Admin
              </span>
            )}
          </div>

          {/* Status info */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>
                {isOnline ? (
                  <span className="text-green-400">Online now</span>
                ) : user.lastSeenAt ? (
                  `Last seen ${formatDistanceToNow(new Date(user.lastSeenAt), { addSuffix: true })}`
                ) : (
                  'Never seen'
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Joined {format(new Date(user.createdAt), 'MMMM yyyy')}</span>
            </div>
          </div>

          {/* Actions */}
          {!isCurrentUser && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onDM()
                  onClose()
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Message
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.email)
                }}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                title="Copy email"
              >
                <Mail className="w-5 h-5" />
              </button>
            </div>
          )}

          {isCurrentUser && (
            <p className="text-center text-gray-500 text-sm">This is you!</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
