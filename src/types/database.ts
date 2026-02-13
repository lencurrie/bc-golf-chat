// Database types - matches Prisma schema

export interface Profile {
  id: string
  email: string
  password?: string
  fullName: string | null
  avatarUrl: string | null
  isAdmin: boolean
  isActive: boolean
  status: string | null
  lastSeenAt: string | null
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
  members?: ChannelMember[]
  unreadCount?: number
}

export interface ChannelMember {
  id: string
  channelId: string
  userId: string
  joinedAt: string
  user?: Profile
}

export interface Reaction {
  id: string
  emoji: string
  messageId: string
  userId: string
  createdAt: string
  user?: Profile
}

export interface Attachment {
  id: string
  messageId: string
  filename: string
  url: string
  mimeType: string
  size: number
  createdAt: string
}

export interface Message {
  id: string
  content: string
  channelId: string
  senderId: string
  replyToId: string | null
  isEdited: boolean
  isPinned: boolean
  pinnedAt: string | null
  pinnedBy: string | null
  createdAt: string
  updatedAt: string
  sender?: Profile
  pinner?: Profile
  replyTo?: Message
  reactions?: Reaction[]
  attachments?: Attachment[]
}

export interface DirectMessage {
  id: string
  content: string
  senderId: string
  recipientId: string
  replyToId: string | null
  isEdited: boolean
  isRead: boolean
  createdAt: string
  updatedAt: string
  sender?: Profile
  recipient?: Profile
  replyTo?: DirectMessage
  reactions?: Reaction[]
  attachments?: Attachment[]
}

export interface TypingIndicator {
  id: string
  channelId: string
  userId: string
  updatedAt: string
  user?: Profile
}

export interface ReadReceipt {
  id: string
  channelId: string
  userId: string
  lastReadAt: string
  lastMessageId: string | null
}
