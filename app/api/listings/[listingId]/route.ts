// app/api/listings/[listingId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import FoodListing from '@/lib/models/FoodListing'
import Donor from '@/lib/models/Donor'
import { connectToDB } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    await connectToDB()
    const { listingId } = params

    const listing = await FoodListing.findById(listingId)
      .populate({
        path: 'createdBy',
        select: 'name email role',
        populate: {
          path: 'donorProfile',
          model: 'Donor',
          select: 'orgName orgType phone campusEmail'
        }
      })
      .exec()

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Format the response data
    const listingData = {
      _id: listing._id,
      title: listing.title,
      description: listing.description,
      donor: {
        name: listing.createdBy.name,
        email: listing.createdBy.email,
        phone: listing.createdBy.donorProfile?.phone || 'Not provided',
        orgName: listing.createdBy.donorProfile?.orgName || 'Individual',
        orgType: listing.createdBy.donorProfile?.orgType,
        campusEmail: listing.createdBy.donorProfile?.campusEmail
      },
      distance: listing.distance,
      quantity: listing.quantity,
      unit: listing.unit,
      types: listing.types,
      freshness: listing.freshness,
      availableUntil: listing.availableUntil,
      location: listing.location,
      images: listing.images,
      interestedUsers: listing.interestedUsers,
      createdAt: listing.createdAt,
      instructions: listing.instructions,
      allowPartial: listing.allowPartial,
      requireInsulated: listing.requireInsulated
    }

    return NextResponse.json(listingData)
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    )
  }
}