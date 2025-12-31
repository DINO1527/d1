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

// PUT: Update a book
export async function PUT(req, { params }) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;
    const body = await req.json();
    const { title, author, pages, stock_status, publish_year, description, image_url, userId } = body;

    const sql = `
      UPDATE books 
      SET title=?, author=?, pages=?, stock_status=?, publish_year=?, description=?, image_url=?
      WHERE id=?
    `;
    
    // Execute Update
    await env.DB.prepare(sql)
      .bind(title, author, pages, stock_status, publish_year, description, image_url, id)
      .run();

    // Log the activity
    // Note: Adjusted arguments to match the helper: (env, uid, action, module, details, recordId)
    await logActivity(env, userId, 'UPDATE', 'BOOK', `${title}, book updated`, id);

    return NextResponse.json({ message: 'Book updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a book
export async function DELETE(req, { params }) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get('userId');

    // 1. Get the book title for the log (Check if exists)
    const book = await env.DB.prepare('SELECT title FROM books WHERE id = ?')
      .bind(id)
      .first();
    
    const bookTitle = book ? book.title : 'Unknown Book';

    // 2. Delete the book
    await env.DB.prepare('DELETE FROM books WHERE id = ?')
      .bind(id)
      .run();

    // 3. Log the activity
    if (userId) {
       await logActivity(env, userId, 'DELETE', 'BOOK', `Book Deleted: ${bookTitle}`, id);
    }

    return NextResponse.json({ message: 'Book deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}