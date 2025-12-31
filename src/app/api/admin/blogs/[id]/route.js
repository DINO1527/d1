import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Helper function to log activity using D1
// We need to pass 'env' because this function runs on the Edge
async function logActivity(env, userUid, actionType, module, details, recordId = null) {
  try {
    // SQLite/D1 doesn't have NOW(), so we let the default timestamp handle it 
    // or pass the current date if needed. Here we rely on the table's DEFAULT CURRENT_TIMESTAMP.
    await env.DB.prepare(
      `INSERT INTO activity_logs (user_uid, action_type, module, details, record_id) VALUES (?, ?, ?, ?, ?)`
    ).bind(userUid, actionType, module, details, recordId ? String(recordId) : null).run();
  } catch (error) {
    console.error("Activity Log Error:", error);
    // We don't throw here to prevent stopping the main request
  }
}

// PUT: Update Blog or Approve
export async function PUT(req, { params }) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;
    const body = await req.json();

    // Case 1: Status Update Only (Approval)
    if (body.status_only) {
      await env.DB.prepare(
        `UPDATE blogs SET status = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(body.status, id).run();

      // Log approval
      // Note: We await this to ensure it happens, but you could also run it without await for speed
      await logActivity(env, body.userUid, 'VERIFIED', 'BLOG', `${body.heading}, blog: ${body.status}`, id);
      
      return NextResponse.json({ success: true });
    }

    // Case 2: Full Update
    const { heading, sub_heading, content, photo_url, external_link, blog_type_id, category, author_uid } = body;

    await env.DB.prepare(`
      UPDATE blogs SET 
        heading=?, sub_heading=?, content=?, photo_url=?, 
        external_link=?, blog_type_id=?, category=?, updated_at=datetime('now') 
      WHERE id = ?
    `).bind(
      heading, sub_heading, content, photo_url, 
      external_link, blog_type_id, category, id
    ).run();

    const loggerUid = author_uid || 'UNKNOWN_USER';
    await logActivity(env, loggerUid, 'UPDATE', 'BLOG', `Updated blog: "${heading}"`, id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Blog Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove Blog
export async function DELETE(req, { params }) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const requesterUid = searchParams.get('requester');

    // 1. Check if exists
    // D1 specific: .first() returns the object or null/undefined
    const oldData = await env.DB.prepare("SELECT heading FROM blogs WHERE id = ?")
      .bind(id)
      .first();

    if (!oldData) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const blogTitle = oldData.heading || 'Unknown Blog';

    // 2. Perform Delete
    await env.DB.prepare('DELETE FROM blogs WHERE id = ?')
      .bind(id)
      .run();

    // 3. Log Activity
    const loggerUid = requesterUid || 'SYSTEM';
    
    // We pass 'env' to the helper
    // Since this is the end of the request, we await it to ensure it writes before the worker logic terminates
    await logActivity(env, loggerUid, 'DELETE', 'BLOG', `Deleted blog: "${blogTitle}"`, id);

    return NextResponse.json({ message: 'Blog deleted successfully' });

  } catch (error) {
    console.error("Blog Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}