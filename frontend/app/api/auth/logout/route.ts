import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Get the session cookie
  const sessionCookie = process.env.SESSION_COOKIE_NAME || 'session';
  const cookieStore = await cookies();
  const session = cookieStore.get(sessionCookie);

  // If the cookie exists, expire it
  if (session) {
    cookieStore.set(sessionCookie, '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  return NextResponse.json({ success: true, message: 'Session terminated' });
}
