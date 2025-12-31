import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(req) {
  try {
    const { env } = getRequestContext();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'All';
    const limit = parseInt(searchParams.get('limit')) || 0; // 0 means no limit
    const requesterUid = searchParams.get('requester');

    // 1. Check Privacy Access
    let canViewPrivate = false;
    if (requesterUid && requesterUid !== 'undefined') {
      const user = await env.DB.prepare('SELECT role FROM user WHERE firebaseUid = ?')
        .bind(requesterUid)
        .first();
      
      if (user) {
        canViewPrivate = ['member', 'editor', 'admin'].includes(user.role);
      }
    }

    // 2. Build Query
    let sql = `SELECT * FROM videos WHERE 1=1`;
    const params = [];

    // Privacy Check (Default to Public only if not logged in/authorized)
    if (!canViewPrivate) {
        sql += ` AND category = 'public'`;
    }

    if (search) {
      sql += ` AND (heading LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type !== 'All') {
      sql += ` AND video_type = ?`;
      params.push(type);
    }

    sql += ` ORDER BY created_at DESC`;

    // Apply Limit if provided
    if (limit > 0) {
        sql += ` LIMIT ?`;
        params.push(limit);
    }

    // Execute Main Query
    // D1: Spread params into bind
    const { results: videos } = await env.DB.prepare(sql)
      .bind(...params)
      .all();
    
    // 3. Get Types (for filters)
    let typeSql = "SELECT DISTINCT video_type FROM videos WHERE 1=1";
    if (!canViewPrivate) {
        typeSql += " AND category = 'public'";
    }
    
    const { results: types } = await env.DB.prepare(typeSql).all();

    return NextResponse.json({ 
        data: videos, 
        types: types.map(t => t.video_type).filter(Boolean) 
    });

  } catch (error) {
    console.error("Video API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}