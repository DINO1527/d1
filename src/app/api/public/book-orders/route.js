import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { env } = getRequestContext();
    const body = await req.json();
    const { book_id, user_uid, full_name, contact_number, church_name, address, quantity } = body;

    // Validation
    if (!book_id || !full_name || !contact_number || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sql = `
      INSERT INTO book_orders (book_id, user_uid, full_name, contact_number, church_name, address, quantity, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    // Execute Insert
    // D1: Use .prepare().bind().run()
    await env.DB.prepare(sql)
      .bind(book_id, user_uid, full_name, contact_number, church_name, address, quantity)
      .run();

    return NextResponse.json({ message: "Order received successfully" });

  } catch (error) {
    console.error("Order Error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}