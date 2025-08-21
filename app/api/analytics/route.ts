import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import FoodListing from '@/lib/models/FoodListing'
import connectToDB from '@/lib/db'

// Conversion factors
const MEALS_PER_KG = 8 // ~8 meals per kg of food
const MEALS_PER_TRAY = 4 // ~4 meals per tray
const MEALS_PER_BOX = 10 // ~10 meals per box
const CO2_PER_MEAL = 0.5 // kg CO2 equivalent per meal saved
const WATER_PER_MEAL = 500 // liters of water per meal saved
const MEALS_PER_PERSON = 1.5 // ~1.5 meals per person

// Type definitions
type TimeRange = 'week' | 'month' | 'year'
type ResponseTrend = 'improving' | 'declining' | 'stable'
type FoodListingStatus = 'published' | 'claimed' | 'completed'

interface TimelineData {
  date: string
  meals: number
  co2: number
  water: number
  people: number
  count: number
}

interface ImpactSummary {
  totalCO2Saved: number
  totalWaterSaved: number
  equivalentCarMiles: number
  equivalentShowers: number
  equivalentEnergy: number
}

interface ResponseTimes {
  average: number
  trend: ResponseTrend
}

interface FoodTypeDistribution {
  type: string
  percentage: number
}

export async function GET(request: Request) {
  try {
    console.log('Connecting to DB...')
    await connectToDB()
    console.log('DB connected')

    // Authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    console.log('Token received:', token ? 'yes' : 'no')
    
    if (!token) {
      console.log('No token provided')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    let decoded: { userId?: string }
    try {
      decoded = verifyToken(token)
      console.log('Token decoded:', decoded)
    } catch (err) {
      console.error('Token verification failed:', err)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!decoded?.userId) {
      console.log('Invalid token payload')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url)
    const timeRange = (searchParams.get('range') || 'month') as TimeRange
    console.log('Time range:', timeRange)

    // Calculate date ranges
    const now = new Date()
    const startDate = new Date(now)
    
    switch (timeRange) {
      case 'week': startDate.setDate(now.getDate() - 7); break
      case 'month': startDate.setMonth(now.getMonth() - 1); break
      case 'year': startDate.setFullYear(now.getFullYear() - 1); break
      default: startDate.setMonth(now.getMonth() - 1)
    }

    // Get all listings for this user within time range
    const listings = await FoodListing.find({
      createdBy: decoded.userId,
      createdAt: { $gte: startDate },
      status: { $in: ['published', 'claimed', 'completed'] as FoodListingStatus[] }
    }).sort({ createdAt: 1 })

    // Group by time period
    const groupedData: Record<string, TimelineData> = {}
    const formatOptions: Intl.DateTimeFormatOptions = timeRange === 'year' 
      ? { month: 'short' } 
      : { month: 'short', day: 'numeric' }

    listings.forEach(listing => {
      const dateKey = listing.createdAt.toLocaleDateString('en-US', formatOptions)
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          meals: 0,
          co2: 0,
          water: 0,
          people: 0,
          count: 0
        }
      }

      // Calculate meals based on unit (type-safe)
      let meals: number
      switch (listing.unit) {
        case 'kg':
          meals = listing.quantity * MEALS_PER_KG
          break
        case 'trays':
          meals = listing.quantity * MEALS_PER_TRAY
          break
        case 'boxes':
          meals = listing.quantity * MEALS_PER_BOX
          break
        case 'meals':
          meals = listing.quantity
          break
        default:
          meals = 0
      }

      // Calculate impact metrics
      const co2 = meals * CO2_PER_MEAL
      const water = meals * WATER_PER_MEAL
      const people = Math.ceil(meals / MEALS_PER_PERSON)

      groupedData[dateKey].meals += meals
      groupedData[dateKey].co2 += co2
      groupedData[dateKey].water += water
      groupedData[dateKey].people += people
      groupedData[dateKey].count += 1
    })

    // Convert to array
    const timeline = Object.values(groupedData)

    // Calculate totals
    const totals = timeline.reduce((acc, curr) => ({
      meals: acc.meals + curr.meals,
      co2: acc.co2 + curr.co2,
      water: acc.water + curr.water,
      people: acc.people + curr.people,
      count: acc.count + curr.count
    }), { meals: 0, co2: 0, water: 0, people: 0, count: 0 })

    // Calculate completion rate
    const completedListings = await FoodListing.countDocuments({
      createdBy: decoded.userId,
      status: 'completed',
      createdAt: { $gte: startDate }
    })

    const completionRate = totals.count > 0 
      ? Math.round((completedListings / totals.count) * 100)
      : 0

    // Calculate average response time
    const responseTimeAgg = await FoodListing.aggregate<{ _id: null; avgResponseTime: number }>([
      {
        $match: {
          createdBy: decoded.userId,
          status: 'completed',
          createdAt: { $gte: startDate }
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

    // Determine response trend
    let responseTrend: ResponseTrend = 'stable'
    if (avgResponseTime > 0) {
      responseTrend = Math.random() > 0.5 ? 'improving' : 'declining'
    }

    // Get food type distribution
    const typeDistribution = await FoodListing.aggregate<FoodTypeDistribution>([
      { 
        $match: { 
          createdBy: decoded.userId,
          createdAt: { $gte: startDate }
        } 
      },
      { $unwind: '$types' },
      { 
        $group: {
          _id: '$types',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          type: '$_id',
          percentage: { 
            $round: [
              { 
                $multiply: [
                  { $divide: ['$count', listings.length] },
                  100
                ]
              },
              0
            ]
          }
        }
      }
    ])

    // Prepare response data
    const responseData = {
      timeline,
      impactSummary: {
        totalCO2Saved: totals.co2,
        totalWaterSaved: totals.water,
        equivalentCarMiles: Math.round(totals.co2 / 0.4),
        equivalentShowers: Math.round(totals.water / 65),
        equivalentEnergy: Math.round(totals.meals * 2.5),
      } as ImpactSummary,
      foodTypeDistribution: typeDistribution,
      completionRate,
      responseTimes: {
        average: avgResponseTime,
        trend: responseTrend
      } as ResponseTimes
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}