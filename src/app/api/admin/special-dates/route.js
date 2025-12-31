import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET() {
  try {
    const { env } = getRequestContext();
    
    // D1/SQLite specific: Use strftime to extract Month (%m) and Day (%d) for sorting
    // This ensures birthdays/anniversaries are sorted by calendar month/day, not year
    const sql = `
      SELECT * FROM special_dates 
      ORDER BY strftime('%m', event_date), strftime('%d', event_date)
    `;
    
    const { results } = await env.DB.prepare(sql).all();
    
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { env } = getRequestContext();
    const body = await req.json();
    const { person_name, event_type, event_date, details } = body;

    const sql = `
      INSERT INTO special_dates (person_name, event_type, event_date, details, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `;

    // Execute Insert
    // D1: Use .prepare().bind().run()
    await env.DB.prepare(sql)
      .bind(person_name, event_type, event_date, details)
      .run();

    return NextResponse.json({ message: 'Date added successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}