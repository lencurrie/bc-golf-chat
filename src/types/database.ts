// Types matching Prisma schema

export interface Profile {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  isAdmin: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Channel {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  createdById: string | null
  createdAt: string
}

export interface ChannelMember {
  id: string
  channelId: string
  userId: string
  joinedAt: string
}

export interface Message {
  id: string
  content: string
  channelId: string
  senderId: string
  createdAt: string
  sender?: Profile
}

export interface DirectMessage {
  id: string
  content: string
  senderId: string
  recipientId: string
  createdAt: string
  sender?: Profile
  recipient?: Profile
}

export interface PushSubscription {
  id: string
  userId: string
  endpoint: string
  p256dh: string
  auth: string
  createdAt: string
}

export interface ChannelWithMembers extends Channel {
  members?: ChannelMember[]
  unreadCount?: number
}
