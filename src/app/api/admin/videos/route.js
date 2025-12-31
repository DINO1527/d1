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

// GET: Fetch all videos
export async function GET() {
  try {
    const { env } = getRequestContext();
    
    // D1: Fetch all rows
    const { results } = await env.DB.prepare('SELECT * FROM videos ORDER BY created_at DESC').all();
    
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add a new video
export async function POST(req) {
  try {
    const { env } = getRequestContext();
    const body = await req.json();
    const { heading, sub_heading, description, youtube_link, embed_code, video_type, category, userId } = body;

    const sql = `
      INSERT INTO videos (heading, sub_heading, description, youtube_link, embed_code, video_type, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
     
    // Execute Insert
    const result = await env.DB.prepare(sql)
      .bind(heading, sub_heading, description, youtube_link, embed_code, video_type, category)
      .run();

    // Get the new ID
    const newVideoId = result.meta.last_row_id;

    // Log the activity
    if (userId) {
        // Kept 'UPDATE' action type as per your original code, though 'CREATE' might be more accurate
        await logActivity(env, userId, 'UPDATE', 'VIDEO', `${heading}, video uploaded`, newVideoId);
    }

    return NextResponse.json({ message: 'Video created successfully', id: newVideoId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}