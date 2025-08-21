import NotificationModel from '@/lib/models/Notification'
import FoodListingModel from '@/lib/models/FoodListing'
import UserModel from '@/lib/models/User'
import DonorModel from '@/lib/models/Donor'
import ReceiverModel from '@/lib/models/Receiver'
import { sendPushNotification } from './pushNotifications'
import mongoose from 'mongoose'

// Define a more flexible notification interface for creation
interface NotificationData {
  userId: any;
  listingId?: any;
  type: "new_listing" | "claim" | "expiring_soon" | "completed" | "event_reminder";
  message: string;
  urgent: boolean;
  metadata?: Record<string, any>; // Use Record<string, any> for flexibility
}

export async function notifyNewListing(listingId: string) {
  try {
    const listing = await FoodListingModel.findById(listingId).exec();
      
    if (!listing) {
      console.error('Listing not found for notification:', listingId);
      return [];
    }

    // Get donor info directly from Donor model
    const donor = await DonorModel.findOne({ userId: listing.createdBy });
    const donorName = donor?.orgName || 'Unknown Donor';

    // Convert to km for notification
    const formatDistance = (meters: number) => {
      const km = meters / 1000;
      return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(meters)} m`;
    };

    // Find receivers within 5km radius - FIXED: Properly handle location query
    const receivers = await UserModel.find({
      role: 'receiver',
      isVerified: true, // Only notify verified users
      'location.geoPoint': {
        $near: {
          $geometry: listing.location.geoPoint,
          $maxDistance: 5000 // 5km radius in meters
        }
      }
    });

    console.log(`Found ${receivers.length} receivers to notify about new listing`);

    const notifications: NotificationData[] = await Promise.all(
      receivers.map(async (receiver) => {
        // Calculate distance for each receiver
        const distance = calculateDistance(
          receiver.location?.coordinates || { lat: 0, lng: 0 },
          listing.location.coordinates
        );

        return {
          userId: receiver._id,
          listingId: listing._id,
          type: "new_listing" as const,
          message: `New food available: ${listing.title} from ${donorName} (${formatDistance(distance)} away)`,
          urgent: false,
          metadata: {
            distance: distance,
            donorName: donorName
          }
        };
      })
    );

    if (notifications.length > 0) {
      const created = await NotificationModel.insertMany(notifications);
      await Promise.all(created.map(sendPushNotification));
      console.log(`Sent ${created.length} new listing notifications`);
      return created;
    }

    return [];
  } catch (error) {
    console.error('Error in notifyNewListing:', error);
    return [];
  }
}

export async function notifyClaim(listingId: string, claimerId: string) {
  try {
    const listing = await FoodListingModel.findById(listingId);
    
    if (!listing) {
      console.error('Listing not found for claim notification');
      return;
    }

    // Get donor info directly from Donor model
    const donor = await DonorModel.findOne({ userId: listing.createdBy });
    const donorName = donor?.orgName || 'Unknown Donor';

    // Get claimer info directly from Receiver model
    const claimer = await ReceiverModel.findOne({ userId: claimerId });
    const claimerName = claimer?.isNgo 
      ? claimer.ngoName 
      : claimer?.fullName || 'Unknown Claimer';

    const notifications: NotificationData[] = [
      {
        userId: listing.createdBy, // Donor
        listingId: listing._id,
        type: "claim" as const,
        message: `Your listing "${listing.title}" was claimed by ${claimerName}`,
        urgent: true,
        metadata: {
          claimerName: claimerName,
          claimerId: claimerId,
          qrCode: generateQRCodeData(listingId, claimerId)
        }
      },
      {
        userId: claimerId, // Receiver
        listingId: listing._id,
        type: "claim" as const,
        message: `Claim successful for "${listing.title}" from ${donorName}`,
        urgent: false,
        metadata: {
          pickupInstructions: listing.instructions,
          donorName: donorName
        }
      }
    ];

    const created = await NotificationModel.insertMany(notifications);
    await Promise.all(created.map(sendPushNotification));
    
    console.log('Claim notifications sent successfully');
    return created;
  } catch (error) {
    console.error('Error in notifyClaim:', error);
  }
}

export async function notifyExpiringSoon(listingId: string) {
  try {
    const listing = await FoodListingModel.findById(listingId);
      
    if (!listing?.claimedBy) {
      console.log('No claimed user for expiring notification');
      return null;
    }

    // Get donor info directly from Donor model
    const donor = await DonorModel.findOne({ userId: listing.createdBy });
    const donorName = donor?.orgName || 'Unknown Donor';

    // Calculate time until expiry
    const expiryTime = new Date(listing.availableUntil);
    const now = new Date();
    const hoursUntilExpiry = Math.floor((expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60));

    const notificationData: NotificationData = {
      userId: listing.claimedBy,
      listingId: listing._id,
      type: "expiring_soon",
      message: `Hurry! "${listing.title}" from ${donorName} expires in ${hoursUntilExpiry} hours`,
      urgent: true,
      metadata: {
        expiryTime: listing.availableUntil,
        hoursUntilExpiry: hoursUntilExpiry,
        donorName: donorName
      }
    };

    const notification = await NotificationModel.create(notificationData);
    await sendPushNotification(notification);
    console.log('Expiring soon notification sent');
    return notification;
  } catch (error) {
    console.error('Error in notifyExpiringSoon:', error);
    return null;
  }
}

export async function notifyCompleted(listingId: string, verifiedBy: string) {
  try {
    const listing = await FoodListingModel.findById(listingId);

    if (!listing) return;

    // Get donor info directly from Donor model
    const donor = await DonorModel.findOne({ userId: listing.createdBy });
    const donorName = donor?.orgName || 'Unknown Donor';

    // Get verifier info
    let verifierName = 'Staff';
    const verifierDonor = await DonorModel.findOne({ userId: verifiedBy });
    const verifierReceiver = await ReceiverModel.findOne({ userId: verifiedBy });
    
    if (verifierDonor) {
      verifierName = verifierDonor.orgName;
    } else if (verifierReceiver) {
      verifierName = verifierReceiver.isNgo 
        ? verifierReceiver.ngoName 
        : verifierReceiver.fullName;
    }

    const notifications: NotificationData[] = [
      {
        userId: listing.createdBy, // Donor
        listingId: listing._id,
        type: "completed" as const,
        message: `Pickup completed for "${listing.title}" by ${verifierName}`,
        urgent: false,
        metadata: {
          completedBy: verifierName,
          completedAt: new Date()
        }
      }
    ];

    if (listing.claimedBy) {
      const tokensEarned = calculateTokensEarned(listing.quantity, listing.unit);
      
      notifications.push({
        userId: listing.claimedBy, // Receiver
        listingId: listing._id,
        type: "completed" as const,
        message: `Pickup completed for "${listing.title}" from ${donorName}. Thank you for reducing food waste! ${tokensEarned} tokens earned.`,
        urgent: false,
        metadata: {
          completedBy: verifierName,
          completedAt: new Date(),
          tokensEarned: tokensEarned
        }
      });
    }

    const created = await NotificationModel.insertMany(notifications);
    await Promise.all(created.map(sendPushNotification));
    
    console.log('Completion notifications sent');
    return created;
  } catch (error) {
    console.error('Error in notifyCompleted:', error);
  }
}

export async function createEventReminder(
  userId: string,
  eventId: string,
  eventTitle: string,
  reminderTime: Date,
  location?: string
): Promise<any> {
  try {
    const notificationData: NotificationData = {
      userId: new mongoose.Types.ObjectId(userId),
      type: "event_reminder",
      message: `Remember to log food after your event: ${eventTitle}`,
      urgent: true,
      metadata: {
        eventId,
        eventTitle,
        reminderTime: reminderTime.toISOString(),
        location,
        isEventReminder: true
      }
    };

    const notification = await NotificationModel.create(notificationData);
    await sendPushNotification(notification);
    
    console.log('Event reminder created successfully');
    return notification;
  } catch (error) {
    console.error('Error creating event reminder:', error);
    throw error;
  }
}

function calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = loc1.lat * Math.PI / 180;
  const φ2 = loc2.lat * Math.PI / 180;
  const Δφ = (loc2.lat - loc1.lat) * Math.PI / 180;
  const Δλ = (loc2.lng - loc1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function generateQRCodeData(listingId: string, claimerId: string) {
  // Generate a unique verification code
  const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  const timestamp = Date.now();
  
  return {
    code: verificationCode,
    listingId: listingId,
    claimerId: claimerId,
    generatedAt: timestamp,
    expiresAt: timestamp + (24 * 60 * 60 * 1000) // 24 hours validity
  };
}

function calculateTokensEarned(quantity: number, unit: string) {
  // Calculate tokens based on quantity and unit
  let baseTokens = 0;
  
  switch (unit) {
    case 'meals':
      baseTokens = quantity * 2;
      break;
    case 'kg':
      baseTokens = quantity * 5;
      break;
    case 'trays':
      baseTokens = quantity * 8;
      break;
    case 'boxes':
      baseTokens = quantity * 10;
      break;
    default:
      baseTokens = quantity * 3;
  }
  
  // Add bonus for larger quantities
  if (baseTokens > 20) baseTokens += 5;
  if (baseTokens > 50) baseTokens += 10;
  
  return baseTokens;
}