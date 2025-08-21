import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import FoodListing from '@/lib/models/FoodListing'
import connectDB from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { notifyClaim } from '@/lib/services/notifications'

export async function POST(
  request: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    await connectDB()
    
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (decoded.role !== 'receiver') {
      return NextResponse.json(
        { error: 'Only receivers can claim listings' },
        { status: 403 }
      )
    }

    // Validate listing ID
    if (!mongoose.Types.ObjectId.isValid(params.listingId)) {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 }
      )
    }

    // Check if listing is already claimed
    const existingListing = await FoodListing.findById(params.listingId);
    if (existingListing?.status === 'claimed') {
      return NextResponse.json(
        { error: 'This listing has already been claimed' },
        { status: 409 }
      );
    }

    // Generate QR code data
    const qrCodeData = {
      code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      verified: false
    };

    // Update listing status
    const listing = await FoodListing.findByIdAndUpdate(
      params.listingId,
      { 
        status: 'claimed',
        claimedBy: decoded.userId,
        claimedAt: new Date(),
        qrCodeData: qrCodeData
      },
      { new: true }
    );

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Send notifications
    await notifyClaim(params.listingId, decoded.userId)

    return NextResponse.json({ 
      success: true,
      listing: {
        id: listing._id,
        status: listing.status,
        claimedAt: listing.claimedAt,
        qrCode: qrCodeData.code // Return QR code to frontend
      }
    })

  } catch (error) {
    console.error('[CLAIM_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}