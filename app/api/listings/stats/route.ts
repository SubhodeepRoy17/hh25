import { NextResponse } from 'next/server'
import FoodListing from '@/lib/models/FoodListing'
import connectToDB from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// Conversion factors (same as analytics endpoint)
const MEALS_PER_KG = 8
const MEALS_PER_TRAY = 4
const MEALS_PER_BOX = 10

export async function GET(request: Request) {
  try {
    await connectToDB()

    // Authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active listings
    const listings = await FoodListing.find({
      createdBy: decoded.userId,
      status: { $in: ['published', 'claimed', 'completed'] }
    })

    // Calculate exact meal counts
    const totalMeals = listings.reduce((sum, listing) => {
        return sum + (listing.unit === 'meals'
            ? listing.quantity
            : listing.quantity * {
            'kg': MEALS_PER_KG,
            'trays': MEALS_PER_TRAY,
            'boxes': MEALS_PER_BOX
            }[listing.unit as 'kg' | 'trays' | 'boxes'] || 0)
        }, 0)

    // Calculate weight (only for kg units)
    const totalWeight = listings.reduce((sum, listing) => {
      return listing.unit === 'kg' ? sum + listing.quantity : sum
    }, 0)

    // Count metrics
    const activeListings = await FoodListing.countDocuments({
      createdBy: decoded.userId,
      status: 'published'
    })

    const completedPickups = await FoodListing.countDocuments({
      createdBy: decoded.userId,
      status: 'completed'
    })

    // Monthly growth calculation
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const [thisMonthCount, lastMonthCount] = await Promise.all([
      FoodListing.countDocuments({
        createdBy: decoded.userId,
        createdAt: { $gte: thisMonthStart },
        status: { $in: ['published', 'claimed', 'completed'] }
      }),
      FoodListing.countDocuments({
        createdBy: decoded.userId,
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        status: { $in: ['published', 'claimed', 'completed'] }
      })
    ])

    const monthlyGrowth = lastMonthCount > 0
      ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
      : thisMonthCount > 0 ? 100 : 0

    // Response time
    const responseTimeAgg = await FoodListing.aggregate([
      {
        $match: {
          createdBy: decoded.userId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: "$responseTime" }
        }
      }
    ])
    const avgResponseTime = responseTimeAgg[0]?.avgResponseTime 
      ? Math.round(responseTimeAgg[0].avgResponseTime / 60)
      : 0

    return NextResponse.json({
      totalMeals, // This will now correctly show 350 (150 + 200)
      totalWeight: Math.round(totalWeight),
      co2Saved: (totalMeals * 0.5) / 1000, // Convert kg to tons
      peopleFed: Math.ceil(totalMeals / 1.5),
      activeListings,
      completedPickups,
      monthlyGrowth,
      avgResponseTime
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}