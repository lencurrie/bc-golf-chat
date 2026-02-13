import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// GET - Get list of online user IDs
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Users seen in the last 60 seconds are considered online
    const oneMinuteAgo = new Date(Date.now() - 60000)

    const onlineUsers = await prisma.profile.findMany({
      where: {
        lastSeenAt: { gt: oneMinuteAgo },
        isActive: true,
      },
      select: { id: true }
    })

    return NextResponse.json({ 
      userIds: onlineUsers.map(u => u.id)
    })
  } catch (error) {
    console.error('Get online users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
