import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function PUT(req) {
  try {
    const { env } = getRequestContext();
    const body = await req.json();
    const { 
      uid, 
      fullName, 
      churchName, 
      contactNumber, 
      language,
      photoUrl 
    } = body;

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Dynamic SQL generation to only update provided fields
    const fieldsToUpdate = [];
    const values = [];

    if (fullName) { fieldsToUpdate.push('fullName = ?'); values.push(fullName); }
    if (churchName) { fieldsToUpdate.push('churchName = ?'); values.push(churchName); }
    if (contactNumber !== undefined) { fieldsToUpdate.push('contactNumber = ?'); values.push(contactNumber); }
    if (language) { fieldsToUpdate.push('language = ?'); values.push(language); }
    if (photoUrl) { fieldsToUpdate.push('photoUrl = ?'); values.push(photoUrl); }

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json({ message: 'No changes detected' });
    }

    // Add UID to the values array for the WHERE clause
    values.push(uid);

    const sql = `UPDATE user SET ${fieldsToUpdate.join(', ')} WHERE firebaseUid = ?`;
    
    // Execute Update
    // D1: Spread the values array into .bind()
    await env.DB.prepare(sql)
      .bind(...values)
      .run();

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}