import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// GET pinned messages for a channel
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

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

    const pinnedMessages = await prisma.message.findMany({
      where: {
        channelId,
        isPinned: true
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
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              }
            }
          }
        },
        attachments: true,
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                fullName: true,
              }
            }
          }
        }
      },
      orderBy: { pinnedAt: 'desc' }
    })

    return NextResponse.json({ pinnedMessages })
  } catch (error) {
    console.error('Get pinned messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}