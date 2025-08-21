//app/api/notifications/route.ts
import { NextResponse, NextRequest } from 'next/server'
import NotificationModel, { NotificationType } from "@/lib/models/Notification"
import { auth } from "@/lib/auth"
import connectToDB from '@/lib/db'
import webpush from 'web-push'
import NotificationSubcriptionModel from '@/lib/models/NotificationSubcriptionModel'
import FoodListingModel from '@/lib/models/FoodListing'
import UserModel from '@/lib/models/User'
import DonorModel from '@/lib/models/Donor'
import ReceiverModel from '@/lib/models/Receiver'


interface NotificationData {
  userId: any;
  listingId?: any;
  type: "new_listing" | "claim" | "expiring_soon" | "completed";
  message: string;
  urgent: boolean;
  metadata?: Record<string, any>;
}

export const dynamic = 'force-dynamic'

// Initialize webpush
webpush.setVapidDetails(
  `mailto:${process.env.NOTIFICATION_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.PRIVATE_VAPID_KEY!
)

export async function GET(req: NextRequest) {
  try {
    await connectToDB()
    const session = await auth(req)
    
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [notifications, unreadCount] = await Promise.all([
      NotificationModel.find({ userId: session.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate({
          path: 'listingId',
          select: 'title'
        })
        .lean(),
      NotificationModel.countDocuments({ 
        userId: session.userId,
        read: false
      })
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB()
    const session = await auth(req)
    
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { type, listingId, customMessage } = body

    if (!type || !listingId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const listing = await FoodListingModel.findById(listingId);

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      )
    }

    let notification
    const baseNotification = {
      listingId: listing._id,
      type,
      urgent: false
    }

    switch (type) {
      case "new_listing":
        notification = await createNewListingNotification(listing)
        break
      case "claim":
        notification = await createClaimNotification(listing, session.userId)
        break
      case "expiring_soon":
        notification = await createExpiringNotification(listing)
        break
      case "completed":
        notification = await createCompletedNotification(listing)
        break
      default:
        return NextResponse.json(
          { error: "Invalid notification type" },
          { status: 400 }
        )
    }

    if (customMessage) {
      notification.message = customMessage
    }

    await notification.save()
    await sendPushNotification(notification)

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    )
  }
}

async function createNewListingNotification(listing: any) {
  // Get donor info directly from Donor model
  const donor = await DonorModel.findOne({ userId: listing.createdBy });
  const donorName = donor?.orgName || 'Unknown Donor';

  // FIXED: Properly query for receivers with location data
  const receivers = await UserModel.find({
    role: 'receiver',
    isVerified: true,
    'location.geoPoint': {
      $near: {
        $geometry: listing.location.geoPoint,
        $maxDistance: 5000 // 5km radius
      }
    }
  })

  const notifications = receivers.map(receiver => ({
    userId: receiver._id,
    listingId: listing._id,
    type: "new_listing" as const,
    message: `New food available: ${listing.title} from ${donorName}`,
    urgent: false,
    metadata: {
      distance: calculateDistance(receiver.location, listing.location),
      donorName: donorName
    }
  }))

  return NotificationModel.insertMany(notifications)
}

async function createClaimNotification(listing: any, claimerId: string) {
  // Get donor info directly from Donor model
  const donor = await DonorModel.findOne({ userId: listing.createdBy });
  const donorName = donor?.orgName || 'Unknown Donor';

  // Get claimer info directly from Receiver model
  const claimer = await ReceiverModel.findOne({ userId: claimerId });
  const claimerName = claimer?.isNgo 
    ? claimer.ngoName 
    : claimer?.fullName || 'Unknown Claimer';

  const notifications = [
    {
      userId: listing.createdBy, // Donor
      listingId: listing._id,
      type: "claim" as const,
      message: `Your listing "${listing.title}" was claimed by ${claimerName}`,
      urgent: true,
      metadata: {
        claimerName: claimerName
      }
    },
    {
      userId: claimerId, // Receiver
      listingId: listing._id,
      type: "claim" as const,
      message: `Claim successful for "${listing.title}" from ${donorName}`,
      urgent: false,
      metadata: {
        donorName: donorName
      }
    }
  ]

  return NotificationModel.insertMany(notifications)
}

async function createExpiringNotification(listing: any) {
  // Get donor info directly from Donor model
  const donor = await DonorModel.findOne({ userId: listing.createdBy });
  const donorName = donor?.orgName || 'Unknown Donor';

  return new NotificationModel({
    userId: listing.claimedBy,
    listingId: listing._id,
    type: "expiring_soon",
    message: `Hurry! "${listing.title}" from ${donorName} expires soon`,
    urgent: true,
    metadata: {
      expiryTime: listing.availableUntil,
      donorName: donorName
    }
  })
}

async function createCompletedNotification(listing: any) {
  // Get donor info directly from Donor model
  const donor = await DonorModel.findOne({ userId: listing.createdBy });
  const donorName = donor?.orgName || 'Unknown Donor';

  const notifications: NotificationData[] = [
    {
      userId: listing.createdBy, // Donor
      listingId: listing._id,
      type: "completed" as const,
      message: `Pickup completed for ${listing.title}`,
      urgent: false
    }
  ]

  if (listing.claimedBy) {
    notifications.push({
      userId: listing.claimedBy, // Receiver
      listingId: listing._id,
      type: "completed" as const,
      message: `Pickup completed for ${listing.title} from ${donorName}`,
      urgent: false,
      metadata: {
        donorName: donorName
      }
    })
  }

  return NotificationModel.insertMany(notifications)
}

async function sendPushNotification(notification: any) {
  try {
    const subscriptions = await NotificationSubcriptionModel.find({ 
      userId: notification.userId 
    })
    
    await Promise.all(subscriptions.map(sub => 
      webpush.sendNotification(
        sub.subscription,
        JSON.stringify({
          title: getNotificationTitle(notification.type),
          body: notification.message,
          icon: "/main_logo.png",
          data: { 
            url: notification.listingId 
              ? `/listings/${notification.listingId}` 
              : '/dashboard'
          }
        })
      )
    ))
  } catch (error) {
    console.error('Push notification failed:', error)
  }
}

function getNotificationTitle(type: NotificationType) {
  switch (type) {
    case "new_listing": return "New Food Available"
    case "claim": return "Claim Update"
    case "expiring_soon": return "Expiring Soon"
    case "completed": return "Pickup Completed"
    default: return "New Notification"
  }
}

function calculateDistance(loc1: any, loc2: any) {
  const R = 6371e3 // Earth radius in meters
  const φ1 = loc1.coordinates.lat * Math.PI/180
  const φ2 = loc2.coordinates.lat * Math.PI/180
  const Δφ = (loc2.coordinates.lat - loc1.coordinates.lat) * Math.PI/180
  const Δλ = (loc2.coordinates.lng - loc1.coordinates.lng) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}