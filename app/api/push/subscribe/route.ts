//app/api/push/subscribe/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import webpush from 'web-push';
import connectToDB from '@/lib/db';
import NotificationSubcriptionModel from '@/lib/models/NotificationSubcriptionModel';

// Initialize webpush
webpush.setVapidDetails(
  `mailto:${process.env.NOTIFICATION_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.PRIVATE_VAPID_KEY!
);

export async function POST(req: Request) {
  await connectToDB();
  const session = await auth(req);
  
  if (!session?.userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const subscription = await req.json();
  
  try {
    // Store in your database (pseudo-code)
    await NotificationSubcriptionModel.findOneAndUpdate(
      { userId: session.userId },
      { subscription },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}