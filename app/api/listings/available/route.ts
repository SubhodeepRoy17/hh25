// app/api/listings/available/route.ts
import { NextResponse } from 'next/server';
import FoodListing from '@/lib/models/FoodListing';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

interface FoodListingResponse {
  _id: string;
  title: string;
  types: string[];
  quantity: number;
  unit: string;
  freshness: string;
  availableUntil: Date;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  distance?: number;
  status: string;
  interestedUsers?: number;
  createdAt: Date;
  images?: string[];
}

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
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const maxDistance = parseInt(searchParams.get('maxDistance') || '10'); // Default 10km
    const vegOnly = searchParams.get('vegOnly') === 'true';
    const searchQuery = searchParams.get('query') || '';

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Location coordinates are required' },
        { status: 400 }
      );
    }

    // Build query
    const query: any = { 
      status: 'published',
      availableUntil: { $gte: new Date() }
    };

    if (vegOnly) {
      query.types = { $in: ['vegetarian', 'vegan'] };
    }

    if (searchQuery) {
      query.$text = { $search: searchQuery };
    }

    // Geo query
    const geoQuery = {
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      }
    };

    // Fetch listings with distance calculation
    const listings: FoodListingResponse[] = await FoodListing.aggregate([
      {
        $match: {
          ...query,
          ...geoQuery
        }
      },
      {
        $addFields: {
          distance: {
            $divide: [
              {
                $sqrt: {
                  $add: [
                    { $pow: [{ $subtract: ['$location.coordinates.lng', lng] }, 2] },
                    { $pow: [{ $subtract: ['$location.coordinates.lat', lat] }, 2] }
                  ]
                }
              },
              0.009 // Approximation for km (1 degree ~ 111km)
            ]
          }
        }
      },
      { $sort: { distance: 1 } }, // Sort by nearest first
      { $limit: 20 }
    ]);

    return NextResponse.json({ listings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching available listings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new NextResponse(null, { headers });
}