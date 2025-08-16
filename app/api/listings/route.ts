//app\api\listings\route.ts
import { NextResponse } from 'next/server'
import FoodListing, { FoodType } from '@/lib/models/FoodListing'
import connectDB from '@/lib/db'
import { uploadImages } from '@/lib/cloudinary'
import mongoose from 'mongoose'
import { verifyToken } from '@/lib/auth'
import sanitizeHtml from 'sanitize-html'

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
    await FoodListing.updateMany(
  { 
    availableUntil: { $lt: currentDate },
    status: { $ne: 'completed' } // Don't update completed listings
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
    let parsedLocation: Location;
    
    try {
      parsedTypes = JSON.parse(types) as FoodType[];
      parsedLocation = JSON.parse(location) as Location;
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid data format for types or location' },
        { status: 400 }
      )
    }

    // Create new listing
    const listing = new FoodListing({
      title,
      types: parsedTypes,
      quantity: Number(quantity),
      unit,
      freshness,
      availableFrom: new Date(availableFrom),
      availableUntil: new Date(availableUntil),
      location: parsedLocation,
      instructions: sanitizeHtml(instructions),
      allowPartial,
      requireInsulated,
      images,
      status: 'published',
      createdBy: new mongoose.Types.ObjectId(decoded.userId),
    })

    await listing.save()

    return NextResponse.json({ 
      success: true, 
      listing: {
        id: listing._id,
        title: listing.title,
        status: listing.status,
        createdAt: listing.createdAt
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
