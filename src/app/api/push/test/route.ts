import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { sendNotificationToUser } from '@/lib/push'

// Test push notification - only for admins
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const user = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Get subscription count for current user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id }
    })

    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        error: 'No push subscriptions found for your user. Make sure you have allowed notifications.',
        subscriptionCount: 0
      }, { status: 400 })
    }

    // Send test notification
    const result = await sendNotificationToUser(
      session.user.id,
      '🏌️ Test Notification',
      'If you see this, push notifications are working!',
      '/chat'
    )

    return NextResponse.json({ 
      success: result,
      subscriptionCount: subscriptions.length,
      email: user.email,
      message: result ? 'Test notification sent!' : 'Failed to send notification'
    })
  } catch (error) {
    console.error('Push test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET to check subscription status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        endpoint: true,
        createdAt: true
      }
    })

    return NextResponse.json({ 
      subscriptionCount: subscriptions.length,
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        endpoint: s.endpoint.substring(0, 50) + '...',
        createdAt: s.createdAt
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
