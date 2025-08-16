// app/api/debug/listings/route.ts
import { NextResponse } from 'next/server';
import FoodListing from '@/lib/models/FoodListing';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  await connectDB();

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;

    // Count total listings by status
    const statusCounts = await FoodListing.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Count published listings
    const publishedCount = await FoodListing.countDocuments({ 
      status: 'published',
      availableUntil: { $gte: new Date() }
    });

    // Get sample published listings
    const sampleListings = await FoodListing.find({ 
      status: 'published',
      availableUntil: { $gte: new Date() }
    })
    .limit(5)
    .select('title location createdBy createdAt availableUntil')
    .populate('createdBy', 'email');

    // Check if indexes exist
    const indexes = await FoodListing.collection.getIndexes();

    // Test geospatial query if coordinates provided
    let geoTest = null;
    if (lat && lng) {
      try {
        geoTest = await FoodListing.aggregate([
          {
            $geoNear: {
              near: { type: "Point", coordinates: [lng, lat] },
              distanceField: "distance",
              maxDistance: 50000, // 50km
              spherical: true,
              query: { status: 'published', availableUntil: { $gte: new Date() } }
            }
          },
          { $limit: 3 },
          { $project: { title: 1, distance: 1, location: 1 } }
        ]);
      } catch (geoError) {
        if (geoError instanceof Error) {
            geoTest = { error: geoError.message };
        } else {
            geoTest = { error: String(geoError) };
        }
      }
    }

    return NextResponse.json({
      user: {
        userId: decoded.userId,
        role: decoded.role
      },
      database: {
        statusCounts,
        publishedCount,
        sampleListings: sampleListings.map(l => ({
          _id: l._id,
          title: l.title,
          location: l.location,
          createdBy: l.createdBy,
          createdAt: l.createdAt,
          availableUntil: l.availableUntil
        }))
      },
      indexes: Object.keys(indexes),
      geoTest,
      searchParams: { lat, lng }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Debug failed'
    }, { status: 500 });
  }
}