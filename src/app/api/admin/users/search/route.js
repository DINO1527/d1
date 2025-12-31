import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(req) {
  try {
    const { env } = getRequestContext();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const requesterUid = searchParams.get('requester'); // UID of the admin/editor making the request

    // 1. Validation
    if (!requesterUid) {
      return NextResponse.json({ error: 'Unauthorized: Missing requester ID' }, { status: 401 });
    }

    // 2. Check Requester's Role for Security
    // D1: Use .prepare().bind().first()
    const requester = await env.DB.prepare('SELECT role FROM user WHERE firebaseUid = ?')
      .bind(requesterUid)
      .first();
    
    if (!requester) {
      return NextResponse.json({ error: 'Requester not found' }, { status: 403 });
    }
    
    const role = requester.role;

    // 3. Build the Search Query
    let sql = `
      SELECT firebaseUid, email, fullName, role 
      FROM user 
      WHERE 1=1
    `;
    const params = [];

    // Security Rules based on Role
    if (role === 'admin' || role === 'editor') {
        // Admins and Editors can search everyone
        if (query) {
            sql += ` AND (email LIKE ? OR fullName LIKE ?)`;
            params.push(`%${query}%`, `%${query}%`);
        }
        sql += ` AND role != 'public'`; // Exclude public users from search results
    } else {
        // Public/Members cannot search the database for other users
        // They can only see themselves (used for auto-filling their own forms)
        sql += ` AND firebaseUid = ?`;
        params.push(requesterUid);
    }

    // Limit results to prevent massive payloads
    sql += ` ORDER BY fullName ASC LIMIT 10`;

    // 4. Execute and Return
    // D1: Spread the params array into .bind()
    const { results } = await env.DB.prepare(sql)
      .bind(...params)
      .all();

    return NextResponse.json(results);

  } catch (error) {
    console.error("User Find API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}