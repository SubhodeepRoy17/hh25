//lib/services/pushNotifications.ts
import webpush from 'web-push'
import NotificationSubcriptionModel from '@/lib/models/NotificationSubcriptionModel'

// Initialize webpush
webpush.setVapidDetails(
  `mailto:${process.env.NOTIFICATION_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.PRIVATE_VAPID_KEY!
)

export async function sendPushNotification(notification: any) {
  try {
    const subscriptions = await NotificationSubcriptionModel.find({ 
      userId: notification.userId 
    })
    
    const payload = JSON.stringify({
      title: getNotificationTitle(notification.type),
      body: notification.message,
      icon: "/main_logo.png",
      data: { 
        url: notification.listingId 
          ? `/listings/${notification.listingId}` 
          : '/dashboard/notifications'
      },
      actions: notification.listingId ? [
        {
          action: 'view-listing',
          title: 'View Listing'
        }
      ] : []
    })

    await Promise.all(subscriptions.map(sub => 
      webpush.sendNotification(sub.subscription, payload)
    ))
    }catch (error) {
    console.error('Push notification failed:', error)
    throw error
  }
}

function getNotificationTitle(type: string) {
  switch (type) {
    case "new_listing": return "New Food Available"
    case "claim": return "Claim Update"
    case "expiring_soon": return "Expiring Soon"
    case "completed": return "Pickup Completed"
    default: return "New Notification"
  }
}