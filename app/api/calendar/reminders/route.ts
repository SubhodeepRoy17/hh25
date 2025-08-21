import { NextRequest, NextResponse } from 'next/server';
import NotificationModel from '@/lib/models/Notification';
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

    // Get event reminders for the user
    const reminders = await NotificationModel.find({
      userId: decoded.userId,
      'metadata.isEventReminder': true,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).sort({ createdAt: -1 });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Reminders fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { enabled } = await request.json();
    const reminderId = params.id;

    await NotificationModel.findByIdAndUpdate(reminderId, {
      read: !enabled // Mark as read if disabling, unread if enabling
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reminder update error:', error);
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const reminderId = params.id;
    await NotificationModel.findByIdAndDelete(reminderId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reminder delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { minutes } = await request.json();
    const reminderId = params.id;

    // Update the reminder time
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
    await NotificationModel.findByIdAndUpdate(reminderId, {
      'metadata.snoozedUntil': snoozedUntil,
      read: false
    });

    return NextResponse.json({ success: true, snoozedUntil });
  } catch (error) {
    console.error('Reminder snooze error:', error);
    return NextResponse.json(
      { error: 'Failed to snooze reminder' },
      { status: 500 }
    );
  }
}