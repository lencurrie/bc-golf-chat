import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// One-time bootstrap: if no admins exist, make current user admin
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if any admin exists
    const adminCount = await prisma.profile.count({
      where: { isAdmin: true }
    })

    if (adminCount > 0) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 400 })
    }

    // Make current user admin
    const user = await prisma.profile.update({
      where: { id: session.user.id },
      data: { isAdmin: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        isAdmin: true
      }
    })

    return NextResponse.json({ 
      message: 'You are now an admin',
      user 
    })
  } catch (error) {
    console.error('Bootstrap error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
