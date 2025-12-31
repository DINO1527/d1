import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request) {
  const { env } = getRequestContext();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    // 1. FETCH ROLES
    if (action === 'roles') {
      const { results } = await env.DB.prepare('SELECT * FROM roster_roles ORDER BY display_order ASC').all();
      return NextResponse.json(results);
    }

    // 2. CHECK STATUS (Last generated roster)
    if (action === 'status') {
      // D1: .first() returns the object or null
      const result = await env.DB.prepare(
        'SELECT service_date, source_week_number FROM service_roster ORDER BY service_date DESC LIMIT 1'
      ).first();
      return NextResponse.json(result || null);
    }

    // 3. FETCH TEMPLATES (Default)
    const sql = `
      SELECT t.id, t.week_number, t.person_name, t.is_alternative, t.user_uid, r.role_name, r.id as role_id
      FROM roster_templates t
      JOIN roster_roles r ON t.role_id = r.id
      ORDER BY t.week_number, r.display_order
    `;
    const { results } = await env.DB.prepare(sql).all();
    return NextResponse.json(results);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { env } = getRequestContext();
    const body = await request.json();

    // CASE A: Create New Role
    if (body.action === 'create_role') {
        const { role_name } = body;
        
        // D1: Get max order
        const maxRes = await env.DB.prepare('SELECT MAX(display_order) as maxOrder FROM roster_roles').first();
        const nextOrder = (maxRes?.maxOrder || 0) + 1;

        await env.DB.prepare('INSERT INTO roster_roles (role_name, display_order) VALUES (?, ?)')
          .bind(role_name, nextOrder)
          .run();
        
        return NextResponse.json({ message: "Role created successfully" });
    }

    // CASE B: Generate Live Roster
    if (body.action === 'generate') {
      const { date, week_template_num, overwrite } = body;
      
      // Check if roster exists
      const check = await env.DB.prepare('SELECT id FROM service_roster WHERE service_date = ? LIMIT 1')
        .bind(date)
        .first();
      
      if (check) {
        if (!overwrite) {
            return NextResponse.json({ message: "Roster already exists", code: "EXISTS" }, { status: 409 });
        }
        // Delete existing if overwrite is true
        await env.DB.prepare('DELETE FROM service_roster WHERE service_date = ?')
          .bind(date)
          .run();
      }

      // Copy Template to Live Roster (Including user_uid)
      // Note: We map the ? placeholders to the arguments in .bind() order
      const sql = `
        INSERT INTO service_roster (service_date, role_id, assigned_person, source_week_number, is_alternative, user_uid)
        SELECT ?, role_id, person_name, ?, is_alternative, user_uid
        FROM roster_templates
        WHERE week_number = ?
      `;
      
      await env.DB.prepare(sql)
        .bind(date, week_template_num, week_template_num)
        .run();
      
      return NextResponse.json({ message: "Generated successfully" });
    }

    // CASE C: Add Template Entry
    const { week_number, role_id, person_name, is_alternative, user_uid } = body;
    const sql = `INSERT INTO roster_templates (week_number, role_id, person_name, is_alternative, user_uid) VALUES (?, ?, ?, ?, ?)`;
    
    await env.DB.prepare(sql)
      .bind(week_number, role_id, person_name, is_alternative || 0, user_uid || null)
      .run();
      
    return NextResponse.json({ message: "Entry added" });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { env } = getRequestContext();
    const body = await request.json();
    const { id, person_name, is_alternative, user_uid } = body;

    // 1. Update the Template
    const sql = `UPDATE roster_templates SET person_name = ?, is_alternative = ?, user_uid = ? WHERE id = ?`;
    
    await env.DB.prepare(sql)
      .bind(person_name, is_alternative, user_uid || null, id)
      .run();

    return NextResponse.json({ message: "Updated" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { env } = getRequestContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    await env.DB.prepare(`DELETE FROM roster_templates WHERE id = ?`)
      .bind(id)
      .run();
      
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}