import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Helper: Log activity using D1 directly
async function logActivity(env, userUid, actionType, module, details, recordId = null) {
  try {
    await env.DB.prepare(
      `INSERT INTO activity_logs (user_uid, action_type, module, details, record_id) VALUES (?, ?, ?, ?, ?)`
    ).bind(userUid, actionType, module, details, recordId ? String(recordId) : null).run();
  } catch (error) {
    console.error("Activity Log Error:", error);
  }
}

export async function PUT(req, { params }) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;
    const body = await req.json();
    const { heading, sub_heading, description, youtube_link, video_type, category, embed_code, userId } = body;

    const sql = `
      UPDATE videos 
      SET heading=?, sub_heading=?, description=?, youtube_link=?, embed_code=?, video_type=?, category=?
      WHERE id=?
    `;

    // Execute Update
    await env.DB.prepare(sql)
      .bind(
        heading, sub_heading, description,
        youtube_link, embed_code, video_type, category, id
      )
      .run();

    // Log Activity
    // We pass the ID as the record_id for better tracking
    await logActivity(env, userId, 'UPDATE', 'VIDEO', `${heading}, video updated`, id);

    return NextResponse.json({ message: "Video updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get('userId');

    // Execute Delete
    await env.DB.prepare('DELETE FROM videos WHERE id = ?')
      .bind(id)
      .run();

    // Log the activity
    if (userId) {
        await logActivity(env, userId, 'DELETE', 'VIDEO', `Video Deleted`, id);
    }

    return NextResponse.json({ message: 'Video deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}