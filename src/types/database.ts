export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  is_admin: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Channel {
  id: string
  name: string
  description: string | null
  is_private: boolean
  created_by: string | null
  created_at: string
}

export interface ChannelMember {
  id: string
  channel_id: string
  user_id: string
  joined_at: string
}

export interface Message {
  id: string
  content: string
  channel_id: string
  sender_id: string
  created_at: string
  sender?: Profile
}

export interface DirectMessage {
  id: string
  content: string
  sender_id: string
  recipient_id: string
  created_at: string
  sender?: Profile
  recipient?: Profile
}

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export interface ChannelWithMembers extends Channel {
  channel_members?: ChannelMember[]
  unread_count?: number
}
