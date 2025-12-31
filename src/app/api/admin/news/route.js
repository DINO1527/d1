import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET() {
  try {
    const { env } = getRequestContext();
    
    // Fetch all news ordered by date
    // D1: Use .prepare().all()
    const { results } = await env.DB.prepare('SELECT * FROM news ORDER BY news_date DESC').all();
    
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { env } = getRequestContext();
    const body = await req.json();
    
    // Default language to 'English' if null/undefined
    const { title, description, news_date, language = 'English' } = body;

    // Validation
    if (!title || !description || !news_date) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure language is never null
    const finalLanguage = language || 'English';

    const sql = `
      INSERT INTO news (title, description, news_date, language, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `;

    // Execute Insert
    // D1: Use .bind().run()
    // We added created_at explicitly with datetime('now') to ensure consistency
    const result = await env.DB.prepare(sql)
      .bind(title, description, news_date, finalLanguage)
      .run();
    
    return NextResponse.json({ 
        message: 'News uploaded successfully',
        id: result.meta.last_row_id // D1 way to get the new ID
    });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}