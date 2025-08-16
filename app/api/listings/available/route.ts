import { NextResponse } from 'next/server';
import FoodListing from '@/lib/models/FoodListing';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

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

    // Get query parameters with proper type handling
    const { searchParams } = new URL(req.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const maxDistanceParam = searchParams.get('maxDistance');
    const vegOnly = searchParams.get('vegOnly') === 'true';
    const searchQuery = searchParams.get('query') || '';

    // Convert and validate coordinates
    const lat = latParam ? parseFloat(latParam) : 0;
    const lng = lngParam ? parseFloat(lngParam) : 0;
    const maxDistance = maxDistanceParam ? parseInt(maxDistanceParam) : 10;

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Valid coordinates are required' },
        { status: 400 }
      );
    }

    // Build query conditions
    const matchConditions: any = {
      status: 'published',
      availableUntil: { $gte: new Date() }
    };

    if (vegOnly) {
      matchConditions.types = { $in: ['vegetarian', 'vegan'] };
    }

    if (searchQuery) {
      matchConditions.$text = { $search: searchQuery };
    }

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
          query: matchConditions
        }
      },
      {
        $addFields: {
          distance: { $divide: ["$distance", 1000] } // Convert meters to km
        }
      },
      { $sort: { distance: 1 } },
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
          distance: 1,
          status: 1,
          interestedUsers: 1,
          createdAt: 1,
          images: 1
        }
      }
    ]);

    return NextResponse.json({ listings }, { status: 200 });
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