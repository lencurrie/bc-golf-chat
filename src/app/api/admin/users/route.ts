import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.profile.findUnique({
    where: { id: userId },
    select: { isAdmin: true }
  })
  return user?.isAdmin ?? false
}

// GET all users
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.profile.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH update user
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, isActive, isAdmin: makeAdmin } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Prevent self-demotion
    if (userId === session.user.id && makeAdmin === false) {
      return NextResponse.json({ error: 'Cannot remove your own admin status' }, { status: 400 })
    }

    const updateData: { isActive?: boolean; isAdmin?: boolean } = {}
    if (typeof isActive === 'boolean') updateData.isActive = isActive
    if (typeof makeAdmin === 'boolean') updateData.isAdmin = makeAdmin

    const user = await prisma.profile.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
