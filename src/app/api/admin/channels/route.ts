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

// GET all channels with members
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channels = await prisma.channel.findMany({
      include: {
        members: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Get channels error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create channel
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Channel name required' }, { status: 400 })
    }

    // Create channel
    const channel = await prisma.channel.create({
      data: {
        name,
        description: description || null,
        createdById: session.user.id
      }
    })

    // Add all active users to the channel
    const activeUsers = await prisma.profile.findMany({
      where: { isActive: true },
      select: { id: true }
    })

    await prisma.channelMember.createMany({
      data: activeUsers.map(u => ({
        channelId: channel.id,
        userId: u.id
      }))
    })

    // Fetch channel with members
    const channelWithMembers = await prisma.channel.findUnique({
      where: { id: channel.id },
      include: { members: true }
    })

    return NextResponse.json({ channel: channelWithMembers })
  } catch (error) {
    console.error('Create channel error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE channel
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 })
    }

    await prisma.channel.delete({
      where: { id: channelId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete channel error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
