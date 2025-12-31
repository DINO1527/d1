import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(req) {
  try {
    const { env } = getRequestContext();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const author = searchParams.get('author') || 'All';

    // 1. Build Main Query
    let sql = `SELECT * FROM books WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (title LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (author !== 'All') {
      sql += ` AND author = ?`;
      params.push(author);
    }

    // Sort by Latest
    sql += ` ORDER BY created_at DESC`;

    // Execute Main Query
    // D1: Spread params into bind
    const { results: books } = await env.DB.prepare(sql)
      .bind(...params)
      .all();

    // 2. Get unique authors for filter
    // D1: Fetch distinct list
    const { results: authors } = await env.DB.prepare(
      "SELECT DISTINCT author FROM books ORDER BY author ASC"
    ).all();

    return NextResponse.json({ 
        books, 
        authors: authors.map(a => a.author).filter(Boolean) 
    });

  } catch (error) {
    console.error("Books API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}