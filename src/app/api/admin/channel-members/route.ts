import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.profile.findUnique({
    where: { id: userId },
    select: { isAdmin: true }
  })
  return user?.isAdmin ?? false
}

// POST add member to channel
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId, userId } = await request.json()

    if (!channelId || !userId) {
      return NextResponse.json({ error: 'Channel ID and user ID required' }, { status: 400 })
    }

    await prisma.channelMember.create({
      data: {
        channelId,
        userId
      }
    })

    // Return updated channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { members: true }
    })

    return NextResponse.json({ channel })
  } catch (error) {
    console.error('Add member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE remove member from channel
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const userId = searchParams.get('userId')

    if (!channelId || !userId) {
      return NextResponse.json({ error: 'Channel ID and user ID required' }, { status: 400 })
    }

    await prisma.channelMember.deleteMany({
      where: {
        channelId,
        userId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
