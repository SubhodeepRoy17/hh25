import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import FoodListing from '@/lib/models/FoodListing'
import connectDB from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(
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

    // Validate listing ID
    if (!mongoose.Types.ObjectId.isValid(params.listingId)) {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 }
      )
    }

    // Find the claimed listing
    const listing = await FoodListing.findOne({
      _id: params.listingId,
      claimedBy: decoded.userId,
      status: 'claimed'
    }).populate('createdBy', 'name')

    if (!listing || !listing.qrCodeData) {
      return NextResponse.json(
        { error: 'Claim not found or QR code not generated' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      listingId: listing._id.toString(),
      qrCode: listing.qrCodeData.code,
      title: listing.title,
      quantity: listing.quantity,
      unit: listing.unit,
      availableUntil: listing.availableUntil,
      location: listing.location.address,
      donorName: (listing.createdBy as any).name,
      claimedAt: listing.claimedAt,
      expiresAt: listing.qrCodeData.expiresAt
    })

  } catch (error) {
    console.error('[CLAIM_DETAILS_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}