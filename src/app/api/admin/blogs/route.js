import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Helper: Log activity using D1 directly (since lib/logger uses MySQL)
async function logActivity(env, userUid, actionType, module, details) {
  try {
    await env.DB.prepare(
      `INSERT INTO activity_logs (user_uid, action_type, module, details) VALUES (?, ?, ?, ?)`
    ).bind(userUid, actionType, module, details).run();
  } catch (error) {
    console.error("Activity Log Error:", error);
  }
}

// GET: Fetch blogs based on role
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid'); // The current user's Firebase UID
  const view = searchParams.get('view'); // 'all' (admin) or 'mine' (user)
  const search = searchParams.get('search') || '';

  try {
    const { env } = getRequestContext();

    // 1. Get User Role
    let userRole = 'public';
    if (uid) {
      const user = await env.DB.prepare('SELECT role FROM user WHERE firebaseUid = ?')
        .bind(uid)
        .first();
      if (user) {
        userRole = user.role;
      }
    }

    // 2. Build Base Query
    let query = `
      SELECT b.*, bt.type_name, u.fullName as author_name, u.photoUrl as author_photo 
      FROM blogs b
      LEFT JOIN blog_types bt ON b.blog_type_id = bt.id
      LEFT JOIN user u ON b.author_uid = u.firebaseUid
      WHERE (b.heading LIKE ? OR b.content LIKE ?)
    `;
    
    const params = [`%${search}%`, `%${search}%`];

    // 3. Filter Logic
    if (userRole === 'admin' && view === 'pending') {
       query += ` AND b.status = 'pending'`;
    } else if (userRole !== 'admin') {
       // Non-admins only see their own posts (per your original logic)
       query += ` AND b.author_uid = ?`;
       params.push(uid);
    }
    // (If admin and view='all', no extra filter needed, they see everything)

    query += ` ORDER BY b.created_at DESC`;

    // 4. Execute
    const { results } = await env.DB.prepare(query)
      .bind(...params)
      .all();

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create Blog
export async function POST(req) {
  try {
    const { env } = getRequestContext();
    const body = await req.json();
    const { 
      heading, sub_heading, content, photo_url, external_link, 
      blog_type_id, category, author_uid 
    } = body;

    // 1. Check Role to determine Initial Status
    let userRole = 'creator';
    if (author_uid) {
      const user = await env.DB.prepare('SELECT role FROM user WHERE firebaseUid = ?')
        .bind(author_uid)
        .first();
      if (user) userRole = user.role;
    }
    
    // Admins post directly, others go to pending
    const status = userRole === 'admin' ? 'active' : 'pending';

    // 2. Insert with datetime('now') for timestamps
    const result = await env.DB.prepare(`
      INSERT INTO blogs 
      (heading, sub_heading, content, photo_url, external_link, blog_type_id, category, author_uid, status, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      heading, sub_heading, content, photo_url, external_link, 
      blog_type_id, category, author_uid, status
    ).run();

    // 3. Log Activity
    // Use the local D1 helper
    await logActivity(env, author_uid || 'ADMIN', 'POST', 'BLOG', `Post New Blog with status: ${status}`);

    // D1 uses meta.last_row_id for the insertId
    return NextResponse.json({ success: true, id: result.meta.last_row_id, status });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}