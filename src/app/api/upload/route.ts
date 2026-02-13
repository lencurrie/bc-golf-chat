import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// POST - Upload file and create message with attachment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'channel' or 'dm'
    const targetId = formData.get('targetId') as string

    if (!file || !type || !targetId) {
      return NextResponse.json({ error: 'File, type, and targetId required' }, { status: 400 })
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Convert file to base64 data URL
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    if (type === 'channel') {
      // Verify user is member of channel
      const membership = await prisma.channelMember.findFirst({
        where: {
          channelId: targetId,
          userId: session.user.id
        }
      })

      if (!membership) {
        return NextResponse.json({ error: 'Not a member of this channel' }, { status: 403 })
      }

      // Create message with attachment
      const message = await prisma.message.create({
        data: {
          content: `[Uploaded: ${file.name}]`,
          channelId: targetId,
          senderId: session.user.id,
          attachments: {
            create: {
              filename: file.name,
              url: dataUrl,
              mimeType: file.type,
              size: file.size,
            }
          }
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            }
          },
          attachments: true,
          reactions: true,
        }
      })

      return NextResponse.json({ message })
    } else {
      // Direct message
      const message = await prisma.directMessage.create({
        data: {
          content: `[Uploaded: ${file.name}]`,
          senderId: session.user.id,
          recipientId: targetId,
          attachments: {
            create: {
              filename: file.name,
              url: dataUrl,
              mimeType: file.type,
              size: file.size,
            }
          }
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            }
          },
          attachments: true,
          reactions: true,
        }
      })

      return NextResponse.json({ message })
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
