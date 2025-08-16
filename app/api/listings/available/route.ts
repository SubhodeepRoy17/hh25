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

    // Allow both receivers and donors to access this endpoint
    // (donors might want to see other listings)
    if (!['receiver', 'donor'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Get query parameters with proper type handling
    const { searchParams } = new URL(req.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const maxDistanceParam = searchParams.get('maxDistance');
    const vegOnly = searchParams.get('vegOnly') === 'true';
    const searchQuery = searchParams.get('query') || '';

    // Convert and validate coordinates
    const lat = latParam ? parseFloat(latParam) : null;
    const lng = lngParam ? parseFloat(lngParam) : null;
    const maxDistance = maxDistanceParam ? parseInt(maxDistanceParam) : 10;

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude coordinates are required' },
        { status: 400 }
      );
    }

    console.log('Search params:', { lat, lng, maxDistance, vegOnly, searchQuery });

    // Build query conditions
    const matchConditions: any = {
      status: 'published',
      availableUntil: { $gte: new Date() },
      // Don't show listings created by the same user (for receivers)
      ...(decoded.role === 'receiver' && { createdBy: { $ne: decoded.userId } })
    };

    if (vegOnly) {
      matchConditions.types = { $in: ['vegetarian', 'vegan'] };
    }

    if (searchQuery.trim()) {
      matchConditions.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { 'location.address': { $regex: searchQuery, $options: 'i' } },
        { instructions: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    console.log('Match conditions:', JSON.stringify(matchConditions, null, 2));

    // First, let's try a simple query without geospatial to see if we get any results
    const allListings = await FoodListing.find(matchConditions).limit(5);
    console.log(`Found ${allListings.length} total listings matching criteria`);

    // Try the aggregation pipeline with proper geospatial query
    const listings = await FoodListing.aggregate([
      {
        $geoNear: {
          near: { 
            type: "Point", 
            coordinates: [lng, lat] // GeoJSON uses [longitude, latitude]
          },
          distanceField: "distance",
          maxDistance: maxDistance * 1000, // Convert km to meters
          spherical: true,
          query: matchConditions,
          distanceMultiplier: 0.001 // Convert meters to km directly
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'donor',
          pipeline: [
            {
              $lookup: {
                from: 'donors',
                localField: '_id',
                foreignField: 'userId',
                as: 'donorProfile'
              }
            },
            {
              $project: {
                _id: 1,
                email: 1,
                donorProfile: { $arrayElemAt: ['$donorProfile', 0] }
              }
            }
          ]
        }
      },
      {
        $addFields: {
          donor: {
            $let: {
              vars: {
                donorUser: { $arrayElemAt: ['$donor', 0] }
              },
              in: {
                name: {
                  $cond: {
                    if: '$$donorUser.donorProfile.orgName',
                    then: '$$donorUser.donorProfile.orgName',
                    else: '$$donorUser.donorProfile.contactPerson'
                  }
                },
                rating: '$$donorUser.donorProfile.rating'
              }
            }
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
          distance: { $round: ['$distance', 2] }, // Round to 2 decimal places
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
    ]);

    console.log(`Found ${listings.length} listings within ${maxDistance}km`);

    // If no listings found with geospatial query, try fallback without distance filtering
    if (listings.length === 0 && allListings.length > 0) {
      console.log('No geospatial results, trying fallback query...');
      
      const fallbackListings = await FoodListing.find(matchConditions)
        .populate({
          path: 'createdBy',
          select: 'email',
          populate: {
            path: 'donorProfile',
            model: 'Donor',
            select: 'orgName contactPerson rating'
          }
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      const processedFallback = fallbackListings.map(listing => {
        // Calculate distance manually using Haversine formula
        const distance = calculateDistance(lat, lng, 
          listing.location.coordinates.lat, 
          listing.location.coordinates.lng
        );

        return {
          ...listing,
          distance: Math.round(distance * 100) / 100,
          donor: {
            name: (listing.createdBy as any)?.donorProfile?.orgName || 
                  (listing.createdBy as any)?.donorProfile?.contactPerson || 
                  'Anonymous Donor',
            rating: (listing.createdBy as any)?.donorProfile?.rating
          },
          interestedUsers: listing.interestedUsers || 0
        };
      }).filter(listing => listing.distance <= maxDistance);

      return NextResponse.json({ 
        listings: processedFallback,
        fallback: true,
        message: `Found ${processedFallback.length} listings using fallback method`
      }, { status: 200 });
    }

    return NextResponse.json({ 
      listings,
      total: listings.length,
      searchParams: { lat, lng, maxDistance, vegOnly, searchQuery }
    }, { status: 200 });

  } catch (error) {
    console.error('Error in available listings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch listings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}