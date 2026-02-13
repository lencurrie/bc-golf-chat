import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { sendNotificationToUsers } from '@/lib/push'

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

    const { recipientId, content, replyToId } = await request.json()

    if (!recipientId || !content) {
      return NextResponse.json({ error: 'Recipient ID and content required' }, { status: 400 })
    }

    const message = await prisma.directMessage.create({
      data: {
        content,
        senderId: session.user.id,
        recipientId,
        replyToId: replyToId || null,
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
        },
        reactions: true,
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
      }
    })

    // Send push notification to recipient
    try {
      const senderName = message.sender.fullName || message.sender.email
      await sendNotificationToUsers(
        [recipientId],
        `Direct message from ${senderName}`,
        content,
        `/chat/direct/${session.user.id}`,
        `dm-${session.user.id}`
      )
    } catch (error) {
      console.error('Failed to send DM push notification:', error)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send DM error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Edit direct message
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, content } = await request.json()

    if (!id || !content) {
      return NextResponse.json({ error: 'Message ID and content required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.directMessage.findUnique({
      where: { id }
    })

    if (!existing || existing.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to edit this message' }, { status: 403 })
    }

    const message = await prisma.directMessage.update({
      where: { id },
      data: {
        content,
        isEdited: true,
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
      }
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Edit DM error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE direct message
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.directMessage.findUnique({
      where: { id }
    })

    if (!existing || existing.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this message' }, { status: 403 })
    }

    await prisma.directMessage.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete DM error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
