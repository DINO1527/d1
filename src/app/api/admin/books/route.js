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

// GET: Fetch all books sorted by latest
export async function GET() {
  try {
    const { env } = getRequestContext();
    
    // D1: Use .prepare().all() to fetch multiple rows
    const { results } = await env.DB.prepare('SELECT * FROM books ORDER BY created_at DESC').all();
    
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add a new book
export async function POST(req) {
  try {
    const { env } = getRequestContext();
    const body = await req.json();
    const { title, author, pages, stock_status, publish_year, description, image_url, userId } = body;

    const sql = `
      INSERT INTO books (title, author, pages, stock_status, publish_year, description, image_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    // Execute Insert
    // D1: Use .run() for INSERT
    const result = await env.DB.prepare(sql)
      .bind(title, author, pages, stock_status, publish_year, description, image_url)
      .run();

    // Log the activity
    // Note: We use result.meta.last_row_id to get the new Book ID
    const newBookId = result.meta.last_row_id;
    
    if (userId) {
        await logActivity(env, userId, 'POST', 'BOOK', `${title}, book Added`, newBookId);
    }

    return NextResponse.json({ message: 'Book created successfully', id: newBookId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}