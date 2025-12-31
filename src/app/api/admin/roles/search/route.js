import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(req) {
  try {
    const { env } = getRequestContext();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const requesterUid = searchParams.get('requester'); // We need to know WHO is searching

    // Autocomplete behavior: Return empty if query is too short
    if (!query || query.length < 2) return NextResponse.json([]);

    // 1. Security Check: Verify Requester
    if (!requesterUid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // D1: Get Requester's Role
    const requester = await env.DB.prepare('SELECT role FROM user WHERE firebaseUid = ?')
        .bind(requesterUid)
        .first();

    if (!requester) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const requesterRole = requester.role;

    // 2. Build Query
    // Note: We select churchName as requested in your snippet
    let sql = `
      SELECT firebaseUid, email, fullName, role, photoUrl, churchName 
      FROM user 
      WHERE (email LIKE ? OR fullName LIKE ?)
    `;
    
    // D1: Prepare params with wildcards
    const params = [`%${query}%`, `%${query}%`];

    // 3. SECURITY: If Editor, HIDE Admins
    if (requesterRole === 'editor') {
      sql += " AND role != 'admin'";
    }

    // Limit results for UI performance
    sql += " LIMIT 5";

    // 4. Execute
    const { results } = await env.DB.prepare(sql)
        .bind(...params)
        .all();

    return NextResponse.json(results);

  } catch (error) {
    console.error("Search Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}