import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(req) {
  try {
    const { env } = getRequestContext();
    const { searchParams } = new URL(req.url);
    const requesterUid = searchParams.get('requester');

    if (!requesterUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get Requester Role
    // D1: Use .prepare().bind().first() to get a single row
    const requester = await env.DB.prepare('SELECT role FROM user WHERE firebaseUid = ?')
      .bind(requesterUid)
      .first();
    
    if (!requester) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const requesterRole = requester.role;

    if (requesterRole !== 'admin' && requesterRole !== 'editor') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Build Query
    let sql = 'SELECT firebaseUid, email, fullName, role, photoUrl FROM user';
    
    // SECURITY RULE: Editors cannot see Admins
    if (requesterRole === 'editor') {
      sql += " WHERE role != 'admin'";
    }

    // Removed ORDER BY created_at DESC per original logic

    // 3. Execute Query
    // D1: Use .prepare().all() for fetching list
    const { results } = await env.DB.prepare(sql).all();
    
    return NextResponse.json(results);

  } catch (error) {
    console.error("Fetch Users Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}