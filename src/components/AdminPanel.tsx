'use client'

import { useState } from 'react'
import { Profile, Channel, ChannelMember } from '@/types/database'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Users, Hash, Plus, Trash2, UserCheck, UserX,
  Settings, Loader2, X, Shield, Mail, Search,
  UserPlus, Check, AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface AdminPanelProps {
  currentUser: Profile
  users: Profile[]
  channels: (Channel & { members: ChannelMember[] })[]
}

export default function AdminPanel({ currentUser, users: initialUsers, channels: initialChannels }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'channels' | 'invite'>('users')
  const [users, setUsers] = useState(initialUsers)
  const [channels, setChannels] = useState(initialChannels)
  const [loading, setLoading] = useState<string | null>(null)
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDesc, setNewChannelDesc] = useState('')
  const [showAddMember, setShowAddMember] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [inviteEmails, setInviteEmails] = useState('')
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Filter users by search
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Toggle user active status
  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    setLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus })
      })
      
      if (res.ok) {
        const { user } = await res.json()
        setUsers(users.map(u => u.id === userId ? user : u))
      }
    } catch (error) {
      console.error('Toggle user active error:', error)
    }
    setLoading(null)
  }

  // Toggle user admin status
  const toggleUserAdmin = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUser.id) return
    
    setLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAdmin: !currentStatus })
      })
      
      if (res.ok) {
        const { user } = await res.json()
        setUsers(users.map(u => u.id === userId ? user : u))
      }
    } catch (error) {
      console.error('Toggle user admin error:', error)
    }
    setLoading(null)
  }

  // Create new channel
  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim()) return
    
    setLoading('new-channel')
    try {
      const res = await fetch('/api/admin/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannelName.trim(),
          description: newChannelDesc.trim() || null
        })
      })
      
      if (res.ok) {
        const { channel } = await res.json()
        setChannels([...channels, channel])
        setNewChannelName('')
        setNewChannelDesc('')
        setShowNewChannel(false)
      }
    } catch (error) {
      console.error('Create channel error:', error)
    }
    setLoading(null)
  }

  // Delete channel
  const deleteChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel? All messages will be lost.')) return
    
    setLoading(channelId)
    try {
      const res = await fetch(`/api/admin/channels?channelId=${channelId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setChannels(channels.filter(c => c.id !== channelId))
      }
    } catch (error) {
      console.error('Delete channel error:', error)
    }
    setLoading(null)
  }

  // Add user to channel
  const addUserToChannel = async (channelId: string, userId: string) => {
    setLoading(`add-${channelId}-${userId}`)
    try {
      const res = await fetch('/api/admin/channel-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, userId })
      })
      
      if (res.ok) {
        const { channel } = await res.json()
        setChannels(channels.map(c => c.id === channelId ? channel : c))
      }
    } catch (error) {
      console.error('Add member error:', error)
    }
    setLoading(null)
    setShowAddMember(null)
  }

  // Remove user from channel
  const removeUserFromChannel = async (channelId: string, userId: string) => {
    setLoading(`remove-${channelId}-${userId}`)
    try {
      const res = await fetch(`/api/admin/channel-members?channelId=${channelId}&userId=${userId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setChannels(channels.map(c => {
          if (c.id === channelId) {
            return {
              ...c,
              members: c.members.filter(m => m.userId !== userId)
            }
          }
          return c
        }))
      }
    } catch (error) {
      console.error('Remove member error:', error)
    }
    setLoading(null)
  }

  // Bulk invite users
  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    const emails = inviteEmails.split(/[\n,]/).map(e => e.trim()).filter(e => e)
    
    if (emails.length === 0) return
    
    setLoading('invite')
    setInviteStatus(null)
    
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setInviteStatus({ 
          type: 'success', 
          message: `${data.invited} invitation(s) sent successfully!` 
        })
        setInviteEmails('')
      } else {
        setInviteStatus({ type: 'error', message: data.error || 'Failed to send invites' })
      }
    } catch {
      setInviteStatus({ type: 'error', message: 'Network error. Please try again.' })
    }
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-[#1a1d21]">
      {/* Header */}
      <header className="bg-[#222529] border-b border-gray-800 px-4 py-3 flex items-center gap-4 sticky top-0 z-10">
        <Link
          href="/chat"
          className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white">Admin Panel</h1>
            <p className="text-xs text-gray-400">Manage your workspace</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 p-4 pb-0">
        {[
          { id: 'users', label: 'Users', icon: Users, count: users.length },
          { id: 'channels', label: 'Channels', icon: Hash, count: channels.length },
          { id: 'invite', label: 'Invite', icon: UserPlus },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'users' | 'channels' | 'invite')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                activeTab === tab.id ? 'bg-blue-500' : 'bg-gray-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Info banner */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-sm text-blue-300">
                  <strong>Inactive</strong> = account disabled (cannot log in). Use this to remove access without deleting the user.
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Users list */}
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`bg-[#222529] rounded-xl p-4 border border-gray-800 transition-opacity ${
                      !user.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg ${
                        user.isAdmin 
                          ? 'bg-gradient-to-br from-yellow-500 to-orange-500' 
                          : 'bg-gradient-to-br from-blue-500 to-purple-600'
                      }`}>
                        {(user.fullName || user.email).charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate">
                            {user.fullName || 'No name'}
                          </p>
                          {user.isAdmin && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                          {!user.isActive && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 truncate">{user.email}</p>
                      </div>
                      
                      {user.id !== currentUser.id && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleUserAdmin(user.id, user.isAdmin)}
                            disabled={loading === user.id}
                            className={`p-2.5 rounded-lg transition-colors ${
                              user.isAdmin
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
                            }`}
                            title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => toggleUserActive(user.id, user.isActive)}
                            disabled={loading === user.id}
                            className={`p-2.5 rounded-lg transition-colors ${
                              user.isActive
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                            title={user.isActive ? 'Deactivate user' : 'Activate user'}
                          >
                            {loading === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : user.isActive ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'channels' && (
            <motion.div
              key="channels"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* New channel button */}
              <button
                onClick={() => setShowNewChannel(true)}
                className="w-full flex items-center justify-center gap-2 p-4 bg-[#222529] border-2 border-dashed border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-blue-500 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create New Channel</span>
              </button>

              {/* New Channel Modal */}
              <AnimatePresence>
                {showNewChannel && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#222529] rounded-xl p-4 border border-gray-700"
                  >
                    <h3 className="font-semibold text-white mb-4">Create New Channel</h3>
                    <form onSubmit={createChannel} className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-400 mb-1 block">Channel name</label>
                        <input
                          type="text"
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value)}
                          placeholder="e.g. general, announcements"
                          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-1 block">Description (optional)</label>
                        <input
                          type="text"
                          value={newChannelDesc}
                          onChange={(e) => setNewChannelDesc(e.target.value)}
                          placeholder="What's this channel about?"
                          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={loading === 'new-channel'}
                          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {loading === 'new-channel' ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                          ) : (
                            'Create Channel'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewChannel(false)}
                          className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Channels list */}
              <div className="space-y-3">
                {channels.map((channel) => (
                  <div key={channel.id} className="bg-[#222529] rounded-xl p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                          <Hash className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{channel.name}</p>
                          {channel.description && (
                            <p className="text-sm text-gray-400">{channel.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowAddMember(showAddMember === channel.id ? null : channel.id)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white rounded-lg transition-colors"
                          title="Add member"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteChannel(channel.id)}
                          disabled={loading === channel.id}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          title="Delete channel"
                        >
                          {loading === channel.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Add Member Dropdown */}
                    <AnimatePresence>
                      {showAddMember === channel.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mb-3 p-3 bg-gray-800 rounded-lg overflow-hidden"
                        >
                          <p className="text-sm text-gray-400 mb-2">Add user to channel:</p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {users
                              .filter(u => u.isActive && !channel.members.some(m => m.userId === u.id))
                              .map(user => (
                                <button
                                  key={user.id}
                                  onClick={() => addUserToChannel(channel.id, user.id)}
                                  disabled={loading === `add-${channel.id}-${user.id}`}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg text-left transition-colors"
                                >
                                  {loading === `add-${channel.id}-${user.id}` ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                  ) : (
                                    <Plus className="w-4 h-4 text-green-400" />
                                  )}
                                  <span className="text-white text-sm">{user.fullName || user.email}</span>
                                </button>
                              ))}
                            {users.filter(u => u.isActive && !channel.members.some(m => m.userId === u.id)).length === 0 && (
                              <p className="text-sm text-gray-500 py-2 text-center">All users are already members</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Members list */}
                    <div className="flex flex-wrap gap-2">
                      {channel.members.map((member) => {
                        const user = users.find(u => u.id === member.userId)
                        if (!user) return null
                        return (
                          <div
                            key={member.id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-700/50 rounded-lg text-sm group"
                          >
                            <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs">
                              {(user.fullName || user.email).charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-300">{user.fullName || user.email.split('@')[0]}</span>
                            <button
                              onClick={() => removeUserFromChannel(channel.id, user.id)}
                              disabled={loading === `remove-${channel.id}-${user.id}`}
                              className="ml-1 p-0.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                              title="Remove from channel"
                            >
                              {loading === `remove-${channel.id}-${user.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )
                      })}
                      {channel.members.length === 0 && (
                        <p className="text-sm text-gray-500">No members yet</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'invite' && (
            <motion.div
              key="invite"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-[#222529] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Invite Team Members</h3>
                    <p className="text-sm text-gray-400">Send invitations to join BC Golf Chat</p>
                  </div>
                </div>

                <form onSubmit={handleBulkInvite} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Email addresses (one per line or comma-separated)
                    </label>
                    <textarea
                      value={inviteEmails}
                      onChange={(e) => setInviteEmails(e.target.value)}
                      placeholder="john@example.com&#10;jane@example.com&#10;team@example.com"
                      rows={5}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                    />
                  </div>

                  {inviteStatus && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                      inviteStatus.type === 'success' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {inviteStatus.type === 'success' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {inviteStatus.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading === 'invite' || !inviteEmails.trim()}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading === 'invite' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Send Invitations
                      </>
                    )}
                  </button>
                </form>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Note: For now, share the signup link with your team: <br />
                  <code className="text-gray-400">{typeof window !== 'undefined' ? window.location.origin : ''}/signup</code>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
