import { NextResponse } from 'next/server';
import FoodListing from '@/lib/models/FoodListing';
import connectDB from '@/lib/db';
import { notifyExpiringSoon } from '@/lib/services/notifications';

export async function POST() {
  try {
    await connectDB();
    
    const now = new Date();
    const warningThreshold = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
    
    // Find expiring listings
    const expiringListings = await FoodListing.find({
      status: 'claimed',
      availableUntil: {
        $lte: warningThreshold,
        $gt: now
      },
      expiryNotified: { $ne: true }
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
    
    // Expire old listings
    const expiredCount = await FoodListing.updateMany(
      { 
        availableUntil: { $lt: now },
        status: { $in: ['published', 'claimed'] }
      },
      { $set: { status: 'expired' } }
    );
    
    return NextResponse.json({
      success: true,
      expiringNotificationsSent: notifiedCount,
      expiredListings: expiredCount.modifiedCount
    });
    
  } catch (error) {
    console.error('Error checking expirations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}