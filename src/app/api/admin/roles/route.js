import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function PUT(req) {
  try {
    const { env } = getRequestContext();
    const body = await req.json();
    const { targetEmail, newRole, requesterUid } = body;

    // 1. Validate Input
    if (!targetEmail || !newRole || !requesterUid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Get Requester Info
    const requester = await env.DB.prepare('SELECT role FROM user WHERE firebaseUid = ?')
        .bind(requesterUid)
        .first();
    
    if (!requester) {
        return NextResponse.json({ error: "Requester not found" }, { status: 403 });
    }
    const myRole = requester.role;

    // 3. Get Target User Info
    const target = await env.DB.prepare('SELECT role FROM user WHERE email = ?')
        .bind(targetEmail)
        .first();
    
    if (!target) {
        return NextResponse.json({ error: "Email not found in database" }, { status: 404 });
    }
    const targetCurrentRole = target.role;

    // --- 4. PERMISSION LOGIC ---

    // RULE A: Only Admin or Editor can access this API
    if (myRole !== 'admin' && myRole !== 'editor') {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // RULE B: Editors RESTRICTIONS
    if (myRole === 'editor') {
      // Cannot change an Admin's role or another Editor's role
      if (targetCurrentRole === 'admin' || targetCurrentRole === 'editor') {
        return NextResponse.json({ error: "Editors cannot modify Admins or other Editors" }, { status: 403 });
      }
      // Cannot assign 'admin' or 'editor' role
      if (newRole === 'admin' || newRole === 'editor') {
        return NextResponse.json({ error: "Editors can only assign Public or Member roles" }, { status: 403 });
      }
    }

    // 5. Update Database
    // D1: Use .run() for updates
    await env.DB.prepare('UPDATE user SET role = ? WHERE email = ?')
        .bind(newRole, targetEmail)
        .run();

    return NextResponse.json({ message: `Role updated to ${newRole} successfully` });

  } catch (error) {
    console.error("Update Role Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}