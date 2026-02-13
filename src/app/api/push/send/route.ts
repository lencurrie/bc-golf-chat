import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendNotificationToUsers } from '@/lib/push'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, title, body, url, tag } = await request.json()

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, body' },
        { status: 400 }
      )
    }

    // Send push notification to user
    const success = await sendNotificationToUsers([userId], title, body, url, tag)

    if (success) {
      return NextResponse.json({ 
        message: 'Push notification sent successfully' 
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send push notification' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}