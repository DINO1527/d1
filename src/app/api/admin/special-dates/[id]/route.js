import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function DELETE(req, { params }) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;

    // Execute Delete
    // D1: Use .prepare().bind().run()
    await env.DB.prepare('DELETE FROM special_dates WHERE id = ?')
      .bind(id)
      .run();

    return NextResponse.json({ message: 'Date deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}