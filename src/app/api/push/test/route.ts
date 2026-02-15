import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendNotificationToUser } from '@/lib/push';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Send test notification to the current user
    const success = await sendNotificationToUser(
      session.user.id,
      'BC Golf Chat Test',
      'Push notifications are working! 🏌️',
      '/',
      'test-notification'
    );

    if (success) {
      return NextResponse.json({ 
        success: true,
        message: 'Test notification sent!'
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to send notification',
        hint: 'Make sure you have enabled notifications (bell icon in header)'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Push test error:', error);
    return NextResponse.json({ 
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
