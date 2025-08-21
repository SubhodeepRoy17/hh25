import FoodListing from '@/lib/models/FoodListing';
import { notifyExpiringSoon } from './notifications';

export async function checkExpiringListings() {
  try {
    const now = new Date();
    const warningThreshold = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
    
    const expiringListings = await FoodListing.find({
      status: 'claimed',
      availableUntil: {
        $lte: warningThreshold,
        $gt: now
      },
      expiryNotified: { $ne: true } // Only notify once
    }).populate('claimedBy createdBy');
    
    console.log(`Found ${expiringListings.length} listings expiring soon`);
    
    let notifiedCount = 0;
    for (const listing of expiringListings) {
      try {
        await notifyExpiringSoon(listing._id.toString());
        
        // Mark as notified to prevent duplicate notifications
        listing.expiryNotified = true;
        await listing.save();
        notifiedCount++;
      } catch (error) {
        console.error(`Failed to notify for listing ${listing._id}:`, error);
      }
    }
    
    console.log(`Sent ${notifiedCount} expiry notifications`);
    return notifiedCount;
  } catch (error) {
    console.error('Error checking expiring listings:', error);
    return 0;
  }
}

export async function expireOldListings() {
  try {
    const now = new Date();
    
    const expired = await FoodListing.updateMany(
      { 
        availableUntil: { $lt: now },
        status: { $in: ['published', 'claimed'] } // Don't update completed listings
      },
      { $set: { status: 'expired' } }
    );
    
    console.log(`Expired ${expired.modifiedCount} listings`);
    return expired.modifiedCount;
  } catch (error) {
    console.error('Error expiring old listings:', error);
    return 0;
  }
}

// Run these checks periodically (you can set this up with a cron job)
export function startExpirationChecker(intervalMinutes = 30) {
  console.log('Starting expiration checker...');
  
  // Run immediately on startup
  checkExpiringListings();
  expireOldListings();
  
  // Set up interval
  setInterval(async () => {
    await checkExpiringListings();
    await expireOldListings();
  }, intervalMinutes * 60 * 1000);
}