import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// POST - Update user's online status and/or custom status message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body // Custom status message

    const updateData: { lastSeenAt: Date; status?: string | null } = {
      lastSeenAt: new Date(),
    }

    // If status is explicitly provided, update it (including null to clear)
    if ('status' in body) {
      updateData.status = status || null
    }

    const user = await prisma.profile.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        status: true,
        lastSeenAt: true
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get online users
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const onlineUsers = await prisma.profile.findMany({
      where: {
        isActive: true,
        lastSeenAt: {
          gte: fiveMinutesAgo
        }
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        lastSeenAt: true
      }
    })

    return NextResponse.json({ users: onlineUsers })
  } catch (error) {
    console.error('Get online users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
