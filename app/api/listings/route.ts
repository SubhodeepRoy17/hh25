import { NextResponse } from 'next/server'
import FoodListing, { FoodType } from '@/lib/models/FoodListing'
import connectDB from '@/lib/db'
import { uploadImages } from '@/lib/cloudinary'
import mongoose from 'mongoose'
import { verifyToken } from '@/lib/auth'
import sanitizeHtml from 'sanitize-html'
import { notifyNewListing } from '@/lib/services/notifications'
import { listFoodOnBlockchain } from '@/lib/blockchain'

// Type for listing response
interface ListingResponse {
  _id: string
  title: string
  status: string
  types: string[]
  quantity: number
  unit: string
  freshness: string
  availableUntil: Date
  location: string
  interestedUsers?: number
  createdAt: Date
}

// GET handler - Fetch all listings for authenticated user
export async function GET(req: Request) {
  await connectDB()

  try {
    // Verify the token from headers
    const authHeader = req.headers.get('authorization')
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

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const currentDate = new Date();
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10

    // Build query
    const query: any = { 
      createdBy: new mongoose.Types.ObjectId(decoded.userId) 
    }
    
    if (status) {
      query.status = status
    }

    // Auto-expire old listings
    await FoodListing.updateMany(
      { 
        availableUntil: { $lt: currentDate },
        status: { $in: ['published', 'claimed'] } // Don't update completed listings
      },
      { $set: { status: 'expired' } }
    );

    // Fetch listings with optional filtering
    const listings: ListingResponse[] = await FoodListing.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .lean() // Convert to plain JavaScript objects

    // Set cache headers
    const headers = new Headers()
    headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=30')

    return NextResponse.json({ listings }, { status: 200, headers })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}

// POST handler - Create new listing
export async function POST(req: Request) {
  await connectDB()
  
  try {
    // Verify the token from headers
    const authHeader = req.headers.get('authorization')
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

    if (decoded.role !== 'donor') {
      return NextResponse.json(
        { error: 'Only donors can create listings' },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    
    // Extract text fields
    const title = formData.get('title') as string
    const types = formData.get('types') as string
    const quantity = formData.get('quantity') as string
    const availableFrom = formData.get('availableFrom') as string
    const availableUntil = formData.get('availableUntil') as string
    const location = formData.get('location') as string
    const instructions = formData.get('instructions') as string || ''
    const unit = formData.get('unit') as string || 'meals'
    const freshness = formData.get('freshness') as string || 'fresh-hot'
    const allowPartial = formData.get('allowPartial') as string === 'true'
    const requireInsulated = formData.get('requireInsulated') as string === 'true'

    // Validate required fields
    if (!title || !types || !quantity || !availableFrom || !availableUntil || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Handle file uploads
    const images: string[] = []
    const files = formData.getAll('photos') as File[]
    
    if (files && files.length > 0 && files[0].size > 0) {
      try {
        const uploadResults = await uploadImages(files)
        images.push(...uploadResults.map(result => result.url))
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload images' },
          { status: 500 }
        )
      }
    }

    // Parse JSON fields
    let parsedTypes: FoodType[];
    let parsedLocation: any;
    
    try {
      parsedTypes = JSON.parse(types) as FoodType[];
      const locationData = JSON.parse(location);
      
      // Handle different location data formats
      if (locationData.coordinates) {
        // Already in our format
        parsedLocation = locationData;
      } else if (locationData.lat && locationData.lng) {
        // Raw coordinates format
        parsedLocation = {
          address: locationData.address || locationData.display_name || '',
          coordinates: {
            lat: locationData.lat,
            lng: locationData.lng
          },
          geoPoint: {
            type: 'Point',
            coordinates: [locationData.lng, locationData.lat]
          }
        };
      } else if (locationData.lat && locationData.lon) {
        // Nominatim format (lat, lon)
        parsedLocation = {
          address: locationData.display_name || '',
          coordinates: {
            lat: locationData.lat,
            lng: locationData.lon
          },
          geoPoint: {
            type: 'Point',
            coordinates: [locationData.lon, locationData.lat]
          }
        };
      } else {
        throw new Error('Invalid location format');
      }

      // Validate coordinates
      if (!parsedLocation.coordinates.lat || !parsedLocation.coordinates.lng) {
        throw new Error('Missing coordinates in location data');
      }

    } catch (e) {
      console.error('Location parsing error:', e);
      return NextResponse.json(
        { error: 'Invalid data format for types or location. Please select a valid location from suggestions.' },
        { status: 400 }
      )
    }

    // Validate availability dates
    const availableFromDate = new Date(availableFrom);
    const availableUntilDate = new Date(availableUntil);
    
    if (availableUntilDate <= availableFromDate) {
      return NextResponse.json(
        { error: 'Available until must be after available from' },
        { status: 400 }
      )
    }

    if (availableUntilDate <= new Date()) {
      return NextResponse.json(
        { error: 'Available until must be in the future' },
        { status: 400 }
      )
    }

    // Create new listing
    const listing = new FoodListing({
      title: title.trim(),
      types: parsedTypes,
      quantity: Number(quantity),
      unit,
      freshness,
      availableFrom: availableFromDate,
      availableUntil: availableUntilDate,
      location: parsedLocation,
      instructions: sanitizeHtml(instructions),
      allowPartial,
      requireInsulated,
      images,
      status: 'published',
      createdBy: new mongoose.Types.ObjectId(decoded.userId),
    })

    await listing.save()

    // Add to blockchain
    try {
      const blockchainId = await listFoodOnBlockchain(
        title,
        instructions,
        Number(quantity),
        Math.floor(availableUntilDate.getTime() / 1000),
        parsedLocation.address
      );

      // Update the database record with blockchain info
      listing.blockchainId = blockchainId;
      await listing.save();

    } catch (blockchainError) {
      console.error('Blockchain transaction failed:', blockchainError);
      // Don't fail the request if blockchain fails, but log it
    }

    // Send notifications to nearby receivers
    try {
      const notifications = await notifyNewListing(listing._id.toString());
      console.log(`New listing notifications sent successfully: ${notifications.length} notifications`);
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({ 
      success: true, 
      listing: {
        id: listing._id,
        title: listing.title,
        status: listing.status,
        createdAt: listing.createdAt,
        blockchainId: listing.blockchainId
      } 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating food listing:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create food listing' },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Origin', 'hh25-olive.vercel.app')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return new NextResponse(null, { headers })
}