import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET() {
  try {
    const { env } = getRequestContext();
    // D1: Use .prepare().all() to fetch all rows
    const { results } = await env.DB.prepare('SELECT * FROM blog_types ORDER BY type_name ASC').all();
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { env } = getRequestContext();
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // 1. Check if it already exists to prevent SQL errors
    // D1: .first() returns the object or null if not found
    const existing = await env.DB.prepare('SELECT id FROM blog_types WHERE type_name = ?')
      .bind(name)
      .first();

    if (existing) {
      return NextResponse.json({ error: "Type already exists" }, { status: 400 });
    }

    // 2. Insert
    // D1: .run() is used for INSERT/UPDATE/DELETE
    const result = await env.DB.prepare('INSERT INTO blog_types (type_name) VALUES (?)')
      .bind(name)
      .run();
    
    // D1: Access the new ID via result.meta.last_row_id
    return NextResponse.json({ id: result.meta.last_row_id, type_name: name });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}