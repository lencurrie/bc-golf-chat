import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// Setup: Create General channel and add all active users
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Verify admin
    const admin = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    // Find or create General channel
    let generalChannel = await prisma.channel.findFirst({
      where: { name: 'General' }
    })

    if (!generalChannel) {
      generalChannel = await prisma.channel.create({
        data: {
          name: 'General',
          description: 'General discussion for the team'
        }
      })
    }

    // Get all active users
    const activeUsers = await prisma.profile.findMany({
      where: { isActive: true },
      select: { id: true }
    })

    // Add all users to General channel (skip if already member)
    let addedCount = 0
    for (const user of activeUsers) {
      const existing = await prisma.channelMember.findFirst({
        where: {
          channelId: generalChannel.id,
          userId: user.id
        }
      })

      if (!existing) {
        await prisma.channelMember.create({
          data: {
            channelId: generalChannel.id,
            userId: user.id
          }
        })
        addedCount++
      }
    }

    return NextResponse.json({
      message: 'Setup complete',
      channelId: generalChannel.id,
      channelName: generalChannel.name,
      usersAdded: addedCount,
      totalActiveUsers: activeUsers.length
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
  }
}
