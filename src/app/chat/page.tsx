import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/db'
import ChatInterface from '@/components/ChatInterface'

export default async function ChatPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Fetch user profile
  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      isAdmin: true,
      isActive: true,
      status: true,
      lastSeenAt: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (!profile) {
    redirect('/login')
  }

  // Fetch channels user is member of
  const channelMemberships = await prisma.channelMember.findMany({
    where: { userId: session.user.id },
    select: { channelId: true }
  })

  const channelIds = channelMemberships.map(m => m.channelId)

  const channels = await prisma.channel.findMany({
    where: channelIds.length > 0 ? { id: { in: channelIds } } : { id: 'none' },
    orderBy: { name: 'asc' }
  })

  // Fetch all active users for DMs
  const users = await prisma.profile.findMany({
    where: {
      isActive: true,
      id: { not: session.user.id }
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      isAdmin: true,
      isActive: true,
      status: true,
      lastSeenAt: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { fullName: 'asc' }
  })

  // Convert dates to ISO strings for serialization
  const serializedProfile = {
    ...profile,
    lastSeenAt: profile.lastSeenAt?.toISOString() || null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  }

  const serializedChannels = channels.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString()
  }))

  const serializedUsers = users.map(u => ({
    ...u,
    lastSeenAt: u.lastSeenAt?.toISOString() || null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString()
  }))

  return (
    <ChatInterface
      currentUser={serializedProfile}
      initialChannels={serializedChannels}
      allUsers={serializedUsers}
    />
  )
}
