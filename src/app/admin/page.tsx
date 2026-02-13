import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/db'
import AdminPanel from '@/components/AdminPanel'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Check if user is admin
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

  if (!profile?.isAdmin) {
    redirect('/chat')
  }

  // Fetch all users
  const users = await prisma.profile.findMany({
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
    orderBy: { createdAt: 'desc' }
  })

  // Fetch all channels with members
  const channels = await prisma.channel.findMany({
    include: {
      members: true
    },
    orderBy: { name: 'asc' }
  })

  // Serialize dates
  const serializedProfile = {
    ...profile,
    lastSeenAt: profile.lastSeenAt?.toISOString() || null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  }

  const serializedUsers = users.map(u => ({
    ...u,
    lastSeenAt: u.lastSeenAt?.toISOString() || null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString()
  }))

  const serializedChannels = channels.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    members: c.members.map(m => ({
      ...m,
      joinedAt: m.joinedAt.toISOString()
    }))
  }))

  return (
    <AdminPanel
      currentUser={serializedProfile}
      users={serializedUsers}
      channels={serializedChannels}
    />
  )
}
