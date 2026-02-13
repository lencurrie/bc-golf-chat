'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Channel, ChannelMember } from '@/types/database'
import { 
  ArrowLeft, Users, Hash, Plus, Trash2, UserCheck, UserX,
  Settings, Loader2, X
} from 'lucide-react'
import Link from 'next/link'

interface AdminPanelProps {
  currentUser: Profile
  users: Profile[]
  channels: (Channel & { channel_members: ChannelMember[] })[]
}

export default function AdminPanel({ currentUser, users: initialUsers, channels: initialChannels }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'channels'>('users')
  const [users, setUsers] = useState(initialUsers)
  const [channels, setChannels] = useState(initialChannels)
  const [loading, setLoading] = useState<string | null>(null)
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDesc, setNewChannelDesc] = useState('')
  const [showAddMember, setShowAddMember] = useState<string | null>(null)
  const supabase = createClient()

  // Toggle user active status
  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    setLoading(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', userId)
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u))
    }
    setLoading(null)
  }

  // Toggle user admin status
  const toggleUserAdmin = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUser.id) return // Can't remove own admin
    
    setLoading(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', userId)
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u))
    }
    setLoading(null)
  }

  // Create new channel
  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim()) return
    
    setLoading('new-channel')
    const { data, error } = await supabase
      .from('channels')
      .insert({
        name: newChannelName.trim(),
        description: newChannelDesc.trim() || null,
        created_by: currentUser.id
      })
      .select('*, channel_members(*)')
      .single()
    
    if (!error && data) {
      // Add all active users to the channel
      const activeUsers = users.filter(u => u.is_active)
      await supabase.from('channel_members').insert(
        activeUsers.map(u => ({ channel_id: data.id, user_id: u.id }))
      )
      
      // Refresh channel members
      const { data: updated } = await supabase
        .from('channels')
        .select('*, channel_members(*)')
        .eq('id', data.id)
        .single()
      
      if (updated) {
        setChannels([...channels, updated])
      }
      setNewChannelName('')
      setNewChannelDesc('')
      setShowNewChannel(false)
    }
    setLoading(null)
  }

  // Delete channel
  const deleteChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel? All messages will be lost.')) return
    
    setLoading(channelId)
    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId)
    
    if (!error) {
      setChannels(channels.filter(c => c.id !== channelId))
    }
    setLoading(null)
  }

  // Add user to channel
  const addUserToChannel = async (channelId: string, userId: string) => {
    setLoading(`add-${channelId}-${userId}`)
    const { error } = await supabase
      .from('channel_members')
      .insert({ channel_id: channelId, user_id: userId })
    
    if (!error) {
      // Refresh channels
      const { data } = await supabase
        .from('channels')
        .select('*, channel_members(*)')
        .eq('id', channelId)
        .single()
      
      if (data) {
        setChannels(channels.map(c => c.id === channelId ? data : c))
      }
    }
    setLoading(null)
    setShowAddMember(null)
  }

  // Remove user from channel
  const removeUserFromChannel = async (channelId: string, userId: string) => {
    setLoading(`remove-${channelId}-${userId}`)
    const { error } = await supabase
      .from('channel_members')
      .delete()
      .match({ channel_id: channelId, user_id: userId })
    
    if (!error) {
      setChannels(channels.map(c => {
        if (c.id === channelId) {
          return {
            ...c,
            channel_members: c.channel_members.filter(m => m.user_id !== userId)
          }
        }
        return c
      }))
    }
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-gray-900 safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-4">
        <Link
          href="/chat"
          className="p-2 -ml-2 text-gray-400 hover:text-white touch-target"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-green-400" />
          <h1 className="text-lg font-semibold text-white">Admin Panel</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors touch-target ${
            activeTab === 'users'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('channels')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors touch-target ${
            activeTab === 'channels'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Hash className="w-5 h-5 inline mr-2" />
          Channels ({channels.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'users' ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-4">
              Manage team members. Deactivated users cannot log in.
            </p>
            {users.map((user) => (
              <div
                key={user.id}
                className={`bg-gray-800 rounded-xl p-4 ${!user.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      user.is_admin ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {user.full_name || 'No name'}
                        {user.is_admin && (
                          <span className="ml-2 text-xs bg-green-600 px-2 py-0.5 rounded-full">Admin</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Toggle Admin */}
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => toggleUserAdmin(user.id, user.is_admin)}
                        disabled={loading === user.id}
                        className={`p-2 rounded-lg transition-colors touch-target ${
                          user.is_admin
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-gray-700 text-gray-400 hover:text-white'
                        }`}
                        title={user.is_admin ? 'Remove admin' : 'Make admin'}
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    )}
                    
                    {/* Toggle Active */}
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => toggleUserActive(user.id, user.is_active)}
                        disabled={loading === user.id}
                        className={`p-2 rounded-lg transition-colors touch-target ${
                          user.is_active
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-red-600/20 text-red-400'
                        }`}
                        title={user.is_active ? 'Deactivate user' : 'Activate user'}
                      >
                        {loading === user.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : user.is_active ? (
                          <UserCheck className="w-5 h-5" />
                        ) : (
                          <UserX className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                Manage channels and members.
              </p>
              <button
                onClick={() => setShowNewChannel(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors touch-target"
              >
                <Plus className="w-4 h-4" />
                New Channel
              </button>
            </div>

            {/* New Channel Form */}
            {showNewChannel && (
              <form onSubmit={createChannel} className="bg-gray-800 rounded-xl p-4 mb-4">
                <h3 className="font-medium text-white mb-3">Create New Channel</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="Channel name"
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border-none placeholder-gray-400"
                    required
                  />
                  <input
                    type="text"
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border-none placeholder-gray-400"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading === 'new-channel'}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors touch-target"
                    >
                      {loading === 'new-channel' ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        'Create'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewChannel(false)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors touch-target"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {channels.map((channel) => (
              <div key={channel.id} className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-gray-400" />
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
                      className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white rounded-lg transition-colors touch-target"
                      title="Add member"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteChannel(channel.id)}
                      disabled={loading === channel.id}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors touch-target"
                      title="Delete channel"
                    >
                      {loading === channel.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Add Member Dropdown */}
                {showAddMember === channel.id && (
                  <div className="mb-3 p-3 bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Add user to channel:</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {users
                        .filter(u => u.is_active && !channel.channel_members.some(m => m.user_id === u.id))
                        .map(user => (
                          <button
                            key={user.id}
                            onClick={() => addUserToChannel(channel.id, user.id)}
                            disabled={loading === `add-${channel.id}-${user.id}`}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-600 rounded-lg text-left transition-colors"
                          >
                            {loading === `add-${channel.id}-${user.id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4 text-green-400" />
                            )}
                            <span className="text-white text-sm">{user.full_name || user.email}</span>
                          </button>
                        ))}
                      {users.filter(u => u.is_active && !channel.channel_members.some(m => m.user_id === u.id)).length === 0 && (
                        <p className="text-sm text-gray-500 py-2">All users are already members</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Members list */}
                <div className="flex flex-wrap gap-2">
                  {channel.channel_members.map((member) => {
                    const user = users.find(u => u.id === member.user_id)
                    if (!user) return null
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded-full text-sm"
                      >
                        <span className="text-gray-300">{user.full_name || user.email}</span>
                        <button
                          onClick={() => removeUserFromChannel(channel.id, user.id)}
                          disabled={loading === `remove-${channel.id}-${user.id}`}
                          className="p-0.5 hover:text-red-400 transition-colors"
                          title="Remove from channel"
                        >
                          {loading === `remove-${channel.id}-${user.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )
                  })}
                  {channel.channel_members.length === 0 && (
                    <p className="text-sm text-gray-500">No members yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
