import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

// IMPORTANT: This line makes the API run on Cloudflare's Edge network
export const runtime = 'edge';

export async function GET(req) {
  try {
    // 1. Get the database binding
    const { env } = getRequestContext();
    const { searchParams } = new URL(req.url);

    const requesterUid = searchParams.get('requester');
    const search = searchParams.get('search') || '';
    const moduleFilter = searchParams.get('module') || 'All';
    const actionFilter = searchParams.get('action') || 'All';

    // 2. Security Check: Only Admins allowed
    if (!requesterUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // D1 Change: Use .prepare().bind().first() for single row lookups
    const admin = await env.DB.prepare('SELECT role FROM user WHERE firebaseUid = ?')
      .bind(requesterUid)
      .first();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden: Admin Access Required" }, { status: 403 });
    }

    // 3. Build Query
    // Note: D1 supports the same SQL syntax, so we build the string the same way
    let sql = `
      SELECT 
        al.id, al.action_type, al.module, al.details, al.created_at,
        u.fullName, u.email, u.role, u.photoUrl
      FROM activity_logs al
      LEFT JOIN user u ON al.user_uid = u.firebaseUid
      WHERE 1=1
    `;
    const params = [];

    // Filter by User Name/Email
    if (search) {
      sql += ` AND (u.email LIKE ? OR u.fullName LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filter by Module
    if (moduleFilter !== 'All') {
      sql += ` AND al.module = ?`;
      params.push(moduleFilter);
    }

    // Filter by Action
    if (actionFilter !== 'All') {
      sql += ` AND al.action_type = ?`;
      params.push(actionFilter);
    }

    sql += ` ORDER BY al.created_at DESC LIMIT 100`;

    // 4. Execute Query
    // D1 Change: We spread the params array (...params) into .bind()
    const { results } = await env.DB.prepare(sql)
      .bind(...params)
      .all();

    return NextResponse.json(results);

  } catch (error) {
    console.error("Logs Fetch Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}