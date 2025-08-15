//app\api\auth\register\route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Donor from '@/lib/models/Donor';
import Receiver from '@/lib/models/Receiver';

export async function POST(request: Request) {
  await dbConnect();
  
  // Set response headers
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  try {
    console.log('Register endpoint hit');
    const requestBody = await request.json();
    console.log('Request body:', requestBody);

    const {
      role,
      email,
      password,
      // Donor fields
      orgName,
      orgType,
      phone,
      campusEmail,
      // Receiver fields
      fullName,
      studentId,
      isNgo,
      ngoName,
      foodPreferences
    } = requestBody;

    // Validate required fields
    if (!email || !password || !role) {
      console.error('Missing required fields');
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers }
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error('Email already in use:', email);
      return new NextResponse(
        JSON.stringify({ error: 'Email already in use' }),
        { status: 400, headers }
      );
    }

    // Create user
    const user = new User({
      email,
      password,
      role,
      isVerified: false
    });

    await user.save();
    console.log('User created:', user.email);

    // Create role-specific profile
    if (role === 'donor') {
      if (!orgName || !orgType || !phone || !campusEmail) {
        console.error('Missing donor fields');
        return new NextResponse(
          JSON.stringify({ error: 'Missing required donor information' }),
          { status: 400, headers }
        );
      }

      const donor = new Donor({
        userId: user._id,
        orgName,
        orgType,
        phone,
        campusEmail
      });
      await donor.save();
      console.log('Donor profile created:', donor.orgName);
    } else {
      if (!fullName || !studentId) {
        console.error('Missing receiver fields');
        return new NextResponse(
          JSON.stringify({ error: 'Missing required receiver information' }),
          { status: 400, headers }
        );
      }

      const receiver = new Receiver({
        userId: user._id,
        fullName,
        studentId,
        isNgo,
        ngoName: isNgo ? ngoName : undefined,
        foodPreferences
      });
      await receiver.save();
      console.log('Receiver profile created:', receiver.fullName);
    }

    return new NextResponse(
      JSON.stringify({
        message: 'Registration successful. Please check your email to verify your account.'
      }),
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error('Registration error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: error.message || 'Registration failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Origin', 'https://hh25-olive.vercel.app')
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new NextResponse(null, { headers });
}