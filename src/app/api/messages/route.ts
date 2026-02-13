import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// GET messages for a channel
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const after = searchParams.get('after') // For polling new messages

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

    const messages = await prisma.message.findMany({
      where: {
        channelId,
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
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST new message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId, content, replyToId } = await request.json()

    if (!channelId || !content) {
      return NextResponse.json({ error: 'Channel ID and content required' }, { status: 400 })
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

    const message = await prisma.message.create({
      data: {
        content,
        channelId,
        senderId: session.user.id,
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

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Edit message
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
    const existing = await prisma.message.findUnique({
      where: { id }
    })

    if (!existing || existing.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to edit this message' }, { status: 403 })
    }

    const message = await prisma.message.update({
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
    console.error('Edit message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE message
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

    // Verify ownership or admin
    const existing = await prisma.message.findUnique({
      where: { id }
    })

    const user = await prisma.profile.findUnique({
      where: { id: session.user.id }
    })

    if (!existing || (existing.senderId !== session.user.id && !user?.isAdmin)) {
      return NextResponse.json({ error: 'Not authorized to delete this message' }, { status: 403 })
    }

    await prisma.message.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
