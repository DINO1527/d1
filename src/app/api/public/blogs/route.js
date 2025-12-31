import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(req) {
  try {
    const { env } = getRequestContext();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'All';
    const requesterUid = searchParams.get('requester');

    // 1. Check Privacy Access
    let canViewPrivate = false;
    if (requesterUid && requesterUid !== 'undefined') {
      // D1: Use .first() to check role
      const user = await env.DB.prepare('SELECT role FROM user WHERE firebaseUid = ?')
        .bind(requesterUid)
        .first();

      if (user) {
        canViewPrivate = ['member', 'editor', 'admin'].includes(user.role);
      }
    }

    // 2. Build Query
    let sql = `
      SELECT 
        b.id, b.heading, b.sub_heading, b.content, b.photo_url, 
        bt.type_name as blog_type, 
        b.category, b.created_at,
        u.fullName as author_name, u.photoUrl as author_photo
      FROM blogs b
      LEFT JOIN user u ON b.author_uid = u.firebaseUid
      LEFT JOIN blog_types bt ON b.blog_type_id = bt.id
      WHERE 1=1
    `;
    const params = [];

    // Filter Private Content
    if (!canViewPrivate) {
      sql += ` AND b.category = 'public'`;
    }

    // Search
    if (search) {
      sql += ` AND (b.heading LIKE ? OR b.sub_heading LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Type Filter
    if (type !== 'All') {
      sql += ` AND bt.type_name = ?`;
      params.push(type);
    }

    sql += ` ORDER BY b.created_at DESC`;

    // Execute Main Query
    // D1: Spread params into bind
    const { results: blogs } = await env.DB.prepare(sql)
      .bind(...params)
      .all();
    
    // 3. Get unique types for filter chips
    let typeSql = `
      SELECT DISTINCT bt.type_name 
      FROM blogs b 
      JOIN blog_types bt ON b.blog_type_id = bt.id 
      WHERE 1=1
    `;
    
    if (!canViewPrivate) {
        typeSql += " AND b.category = 'public'";
    }
    
    // Execute Types Query (No params needed for this part currently)
    const { results: types } = await env.DB.prepare(typeSql).all();

    return NextResponse.json({ 
        data: blogs, 
        types: types.map(t => t.type_name).filter(Boolean) 
    });

  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}