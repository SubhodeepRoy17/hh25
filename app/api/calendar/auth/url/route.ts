import { NextRequest, NextResponse } from 'next/server';
import GoogleCalendarService from '@/lib/services/googleCalendar';
import { verifyToken, extractTokenFromHeaders } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Extract and verify token from headers
    const token = extractTokenFromHeaders(request.headers);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const authUrl = await GoogleCalendarService.getAuthUrl(decoded.userId);
    return NextResponse.json({ authUrl });
    
  } catch (error) {
    console.error('Calendar auth URL error:', error);
    return NextResponse.json(
      { error: 'Failed to get authentication URL' },
      { status: 500 }
    );
  }
}