import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(req, { params }) {
  try {
    const { env } = getRequestContext();
    // 1. Await params (Required for Next.js 15+)
    const { id } = await params;
    
    const { searchParams } = new URL(req.url);
    const requesterUid = searchParams.get('requester');

    // 2. Check Access
    let canViewPrivate = false;
    if (requesterUid && requesterUid !== 'undefined') {
      // D1: Use .first() to get the single user object
      const user = await env.DB.prepare('SELECT role FROM user WHERE firebaseUid = ?')
        .bind(requesterUid)
        .first();
      
      if (user) {
        canViewPrivate = ['member', 'editor', 'admin'].includes(user.role);
      }
    }

    // 3. Fetch Main Blog (Updated to join blog_types)
    let sql = `
      SELECT 
        b.*, 
        u.fullName as author_name, 
        u.photoUrl as author_photo,
        bt.type_name as blog_type 
      FROM blogs b
      LEFT JOIN user u ON b.author_uid = u.firebaseUid
      LEFT JOIN blog_types bt ON b.blog_type_id = bt.id
      WHERE b.id = ?
    `;
    
    if (!canViewPrivate) {
      sql += ` AND b.category = 'public'`;
    }

    // D1: Use .first() for single row
    const blog = await env.DB.prepare(sql)
      .bind(id)
      .first();

    if (!blog) {
      return NextResponse.json({ error: "Not found or restricted" }, { status: 404 });
    }

    // 4. Fetch Related Blogs (For Sidebar)
    let relatedSql = `
      SELECT b.id, b.heading, b.photo_url, b.created_at, u.fullName as author_name
      FROM blogs b
      LEFT JOIN user u ON b.author_uid = u.firebaseUid
      WHERE b.id != ?
    `;

    if (!canViewPrivate) {
      relatedSql += ` AND b.category = 'public'`;
    }
    
    relatedSql += ` ORDER BY b.created_at DESC LIMIT 5`;

    // D1: Use .all() for list of rows
    const { results: relatedRows } = await env.DB.prepare(relatedSql)
      .bind(id)
      .all();

    // 5. Return composite object
    return NextResponse.json({ 
        blog: blog, 
        related: relatedRows 
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}