import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// POST - Add or toggle DM reaction
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, emoji } = await request.json()

    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'Message ID and emoji required' }, { status: 400 })
    }

    // Check if reaction already exists
    const existing = await prisma.dMReaction.findFirst({
      where: {
        messageId,
        userId: session.user.id,
        emoji,
      }
    })

    if (existing) {
      // Remove reaction (toggle off)
      await prisma.dMReaction.delete({
        where: { id: existing.id }
      })
    } else {
      // Add reaction
      await prisma.dMReaction.create({
        data: {
          messageId,
          userId: session.user.id,
          emoji,
        }
      })
    }

    // Get updated reactions for the message
    const reactions = await prisma.dMReaction.findMany({
      where: { messageId },
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

    return NextResponse.json({ reactions })
  } catch (error) {
    console.error('DM Reaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
