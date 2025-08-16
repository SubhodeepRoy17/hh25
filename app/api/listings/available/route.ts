// app/api/listings/available/route.ts
import { NextResponse } from 'next/server';
import FoodListing from '@/lib/models/FoodListing';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  await connectDB();

  try {
    // Verify the token from headers
    const authHeader = req.headers.get('authorization');
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    console.log("API received coordinates:", { lat, lng });
    const maxDistance = parseInt(searchParams.get('maxDistance') || '10');
    const vegOnly = searchParams.get('vegOnly') === 'true';
    const searchQuery = searchParams.get('query') || '';

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude coordinates are required' },
        { status: 400 }
      );
    }

    // Build query conditions
    const matchConditions: any = {
      status: 'published',
      availableUntil: { $gte: new Date() },
      createdBy: { $ne: decoded.userId } // Don't show user's own listings
    };

    if (vegOnly) {
      matchConditions.types = { $in: ['vegetarian', 'vegan'] };
    }

    if (searchQuery.trim()) {
      matchConditions.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { 'location.address': { $regex: searchQuery, $options: 'i' } },
        { 'donor.name': { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Aggregation pipeline with geospatial query
    const pipeline: any[] = [
      {
        $geoNear: {
            near: { 
                type: "Point", 
                coordinates: [lng, lat] // [longitude, latitude]
            },
            distanceField: "distance",
            maxDistance: maxDistance * 1000, // meters
            spherical: true,
            query: matchConditions,
            key: "location.geoPoint",
            distanceMultiplier: 0.001 // Explicitly specify the indexed field
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'donorUser',
          pipeline: [
            {
              $lookup: {
                from: 'donors',
                localField: '_id',
                foreignField: 'userId',
                as: 'donorProfile'
              }
            },
            { $unwind: '$donorProfile' },
            {
              $project: {
                name: {
                  $cond: {
                    if: '$donorProfile.orgName',
                    then: '$donorProfile.orgName',
                    else: '$donorProfile.contactPerson'
                  }
                },
                rating: '$donorProfile.rating'
              }
            }
          ]
        }
      },
      { $unwind: '$donorUser' },
      { 
        $addFields: {
          donor: {
            name: '$donorUser.name',
            rating: '$donorUser.rating'
          }
        } 
      },
      { $sort: { distance: 1, createdAt: -1 } },
      { $limit: 50 },
      {
        $project: {
          _id: 1,
          title: 1,
          types: 1,
          quantity: 1,
          unit: 1,
          freshness: 1,
          availableUntil: 1,
          location: 1,
          distance: { $round: ['$distance', 2] },
          status: 1,
          interestedUsers: { $ifNull: ['$interestedUsers', 0] },
          createdAt: 1,
          images: 1,
          donor: 1,
          instructions: 1,
          allowPartial: 1,
          requireInsulated: 1
        }
      }
    ];

    const listings = await FoodListing.aggregate(pipeline);

    return NextResponse.json({ 
      listings,
      total: listings.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error in available listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}