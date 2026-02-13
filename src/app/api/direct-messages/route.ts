import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// GET direct messages with a user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')
    const after = searchParams.get('after')

    if (!recipientId) {
      return NextResponse.json({ error: 'Recipient ID required' }, { status: 400 })
    }

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id, recipientId },
          { senderId: recipientId, recipientId: session.user.id }
        ],
        ...(after ? { createdAt: { gt: new Date(after) } } : {})
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
        recipient: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: after ? 50 : 100
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Get DMs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST new direct message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recipientId, content } = await request.json()

    if (!recipientId || !content) {
      return NextResponse.json({ error: 'Recipient ID and content required' }, { status: 400 })
    }

    const message = await prisma.directMessage.create({
      data: {
        content,
        senderId: session.user.id,
        recipientId
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
        recipient: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send DM error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
