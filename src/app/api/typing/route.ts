import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// POST - Set typing indicator
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

    // Upsert typing indicator
    await prisma.typingIndicator.upsert({
      where: {
        channelId_userId: {
          channelId,
          userId: session.user.id,
        }
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        channelId,
        userId: session.user.id,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Typing indicator error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get typing users for a channel
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

    // Get typing indicators from last 5 seconds (exclude current user)
    const fiveSecondsAgo = new Date(Date.now() - 5000)
    
    const typingIndicators = await prisma.typingIndicator.findMany({
      where: {
        channelId,
        updatedAt: { gt: fiveSecondsAgo },
        userId: { not: session.user.id }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          }
        }
      }
    })

    // Clean up old typing indicators (older than 10 seconds)
    await prisma.typingIndicator.deleteMany({
      where: {
        updatedAt: { lt: new Date(Date.now() - 10000) }
      }
    }).catch(() => {}) // Ignore errors

    return NextResponse.json({ 
      users: typingIndicators.map(t => t.user)
    })
  } catch (error) {
    console.error('Get typing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
