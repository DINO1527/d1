import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { env } = getRequestContext();
    const { uid } = await req.json();

    // D1: Use .prepare().bind().first() to fetch a single row
    const user = await env.DB.prepare('SELECT * FROM user WHERE firebaseUid = ?')
      .bind(uid)
      .first();
    
    // If no user found, return default public role
    if (!user) {
        return NextResponse.json({ role: 'public' });
    }

    return NextResponse.json(user); // Returns full user object (role, churchName, etc)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}