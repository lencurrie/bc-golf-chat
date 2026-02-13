import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// POST - Update user's online status
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await request.json() // consume the body

    await prisma.profile.update({
      where: { id: session.user.id },
      data: {
        lastSeenAt: new Date(),
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
