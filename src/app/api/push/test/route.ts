import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/lib/push';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        error: 'No push subscriptions found',
        hint: 'Enable notifications in the app first (bell icon in header)'
      }, { status: 404 });
    }

    // Send test notification to all user's subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        sendPushNotification(sub, {
          title: 'BC Golf Chat Test',
          body: 'Push notifications are working! 🏌️',
          icon: '/icon-192.png',
          data: { url: '/' }
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({ 
      success: true,
      message: `Sent ${successful} notification(s)`,
      subscriptions: subscriptions.length,
      successful,
      failed
    });
  } catch (error) {
    console.error('Push test error:', error);
    return NextResponse.json({ 
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
