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

  const response = NextResponse.json({ success: true, message: 'Session terminated' });

  // [Security] Scorched Earth: Instruct browser to clear all site data
  response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"');

  return response;
}
