import webpush from 'web-push'
import prisma from './db'

// Lazy initialization of VAPID details
let vapidConfigured = false

function ensureVapidConfigured() {
  if (vapidConfigured) return true
  
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  
  if (!publicKey || !privateKey) {
    console.warn('VAPID keys not configured - push notifications disabled')
    return false
  }
  
  try {
    webpush.setVapidDetails(
      'mailto:support@bcgolfsafaris.com',
      publicKey,
      privateKey
    )
    vapidConfigured = true
    return true
  } catch (error) {
    console.error('Failed to configure VAPID:', error)
    return false
  }
}

interface PushNotificationPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

// Helper function for sending notifications to multiple users
export async function sendNotificationToUsers(
  userIds: string[],
  title: string,
  body: string,
  url?: string,
  tag?: string
) {
  console.log('[PUSH] sendNotificationToUsers called for:', userIds, title)
  
  if (!ensureVapidConfigured()) {
    console.log('[PUSH] VAPID not configured, returning false')
    return false
  }
  
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } }
    })
    
    console.log('[PUSH] Found subscriptions:', subscriptions.length)

    const payload: PushNotificationPayload = {
      title,
      body,
      url: url || '/',
      tag: tag || 'bc-golf-chat'
    }

    const promises = subscriptions.map(async (subscription) => {
      try {
        console.log('[PUSH] Sending to:', subscription.endpoint.slice(0, 60) + '...')
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          },
          JSON.stringify(payload)
        )
        console.log('[PUSH] Sent successfully')
      } catch (error) {
        console.error('[PUSH] Failed to send:', error)
        
        if (error instanceof Error && error.message.includes('410')) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id }
          })
        }
      }
    })

    await Promise.allSettled(promises)
    return true
  } catch (error) {
    console.error('Error sending notifications to users:', error)
    return false
  }
}

// Helper function for sending notification to a single user
export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  url?: string,
  tag?: string
) {
  return sendNotificationToUsers([userId], title, body, url, tag)
}