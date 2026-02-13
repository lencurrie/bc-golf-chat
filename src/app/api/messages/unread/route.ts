import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// GET unread message counts for all channels
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all channels user is a member of
    const memberships = await prisma.channelMember.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        channel: true
      }
    })

    const unreadCounts: Record<string, number> = {}

    for (const membership of memberships) {
      const channelId = membership.channelId

      // Get last read receipt for this channel
      const readReceipt = await prisma.readReceipt.findUnique({
        where: {
          channelId_userId: {
            channelId,
            userId: session.user.id
          }
        }
      })

      let unreadCount = 0

      if (readReceipt?.lastReadAt) {
        // Count messages since last read
        unreadCount = await prisma.message.count({
          where: {
            channelId,
            createdAt: {
              gt: readReceipt.lastReadAt
            },
            // Don't count own messages as unread
            senderId: {
              not: session.user.id
            }
          }
        })
      } else {
        // Count all messages if never read
        unreadCount = await prisma.message.count({
          where: {
            channelId,
            senderId: {
              not: session.user.id
            }
          }
        })
      }

      unreadCounts[channelId] = unreadCount
    }

    return NextResponse.json({ unreadCounts })
  } catch (error) {
    console.error('Get unread counts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Mark messages as read
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId } = await request.json()

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 })
    }

    // Verify user is member of channel
    const membership = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: session.user.id
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this channel' }, { status: 403 })
    }

    // Get the latest message in the channel
    const latestMessage = await prisma.message.findFirst({
      where: { channelId },
      orderBy: { createdAt: 'desc' }
    })

    // Update or create read receipt
    await prisma.readReceipt.upsert({
      where: {
        channelId_userId: {
          channelId,
          userId: session.user.id
        }
      },
      update: {
        lastReadAt: new Date(),
        lastMessageId: latestMessage?.id || null
      },
      create: {
        channelId,
        userId: session.user.id,
        lastReadAt: new Date(),
        lastMessageId: latestMessage?.id || null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark as read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}