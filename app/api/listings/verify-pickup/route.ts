import { NextResponse } from 'next/server';
import FoodListing from '@/lib/models/FoodListing';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { notifyCompleted } from '@/lib/services/notifications';

export async function POST(request: Request) {
  try {
    await connectDB();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { qrCode, listingId } = await request.json();
    
    if (!qrCode || !listingId) {
      return NextResponse.json(
        { error: 'QR code and listing ID are required' },
        { status: 400 }
      );
    }

    // Find the listing with the matching QR code
    const listing = await FoodListing.findOne({
      _id: listingId,
      'qrCodeData.code': qrCode,
      status: 'claimed'
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Invalid QR code or listing not found' },
        { status: 404 }
      );
    }

    // Check if QR code is expired
    if (new Date() > new Date(listing.qrCodeData.expiresAt)) {
      return NextResponse.json(
        { error: 'QR code has expired' },
        { status: 410 }
      );
    }

    // Check if already verified
    if (listing.qrCodeData.verified) {
      return NextResponse.json(
        { error: 'QR code already used' },
        { status: 409 }
      );
    }

    // Update listing status and mark QR as verified
    listing.status = 'completed';
    listing.qrCodeData.verified = true;
    listing.qrCodeData.verifiedAt = new Date();
    listing.qrCodeData.verifiedBy = decoded.userId;
    
    await listing.save();

    // Send completion notifications
    await notifyCompleted(listingId, decoded.userId);

    // Calculate tokens earned (simplified)
    const tokensEarned = Math.floor(listing.quantity * (listing.unit === 'meals' ? 2 : 3));

    return NextResponse.json({
      success: true,
      message: 'Pickup verified successfully',
      tokensEarned: tokensEarned,
      listing: {
        id: listing._id,
        title: listing.title,
        status: listing.status
      }
    });

  } catch (error) {
    console.error('[VERIFY_PICKUP_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}