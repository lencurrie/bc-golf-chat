import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// POST - Pin a message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = await request.json()

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    // Get the message and verify user is in the channel
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: true
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Verify user is member of channel
    const membership = await prisma.channelMember.findFirst({
      where: {
        channelId: message.channelId,
        userId: session.user.id
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this channel' }, { status: 403 })
    }

    // Pin the message
    const pinnedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isPinned: true,
        pinnedAt: new Date(),
        pinnedBy: session.user.id
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true
          }
        },
        pinner: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      }
    })

    return NextResponse.json({ message: pinnedMessage })
  } catch (error) {
    console.error('Pin message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Unpin a message
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    // Get the message and verify user is in the channel
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: true
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Verify user is member of channel
    const membership = await prisma.channelMember.findFirst({
      where: {
        channelId: message.channelId,
        userId: session.user.id
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this channel' }, { status: 403 })
    }

    // Unpin the message
    const unpinnedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isPinned: false,
        pinnedAt: null,
        pinnedBy: null
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json({ message: unpinnedMessage })
  } catch (error) {
    console.error('Unpin message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}