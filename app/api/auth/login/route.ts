import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Donor from '@/lib/models/Donor';
import Receiver from '@/lib/models/Receiver';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  await dbConnect();
  
  const { email, password, role } = await request.json();

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ error: 'Please verify your email first' }, { status: 403 });
    }

    if (user.role !== role) {
      return NextResponse.json({ error: `Please login as a ${user.role}` }, { status: 403 });
    }

    let userData = {};
    if (user.role === 'donor') {
      const donor = await Donor.findOne({ userId: user._id });
      userData = { orgName: donor?.orgName, orgType: donor?.orgType };
    } else {
      const receiver = await Receiver.findOne({ userId: user._id });
      userData = { fullName: receiver?.fullName, isNgo: receiver?.isNgo };
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email, ...userData },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      ...userData,
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
