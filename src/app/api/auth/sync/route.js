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

export async function POST(req) {
  try {
    const { env } = getRequestContext();
    const body = await req.json();
    const { 
      uid, email, displayName, photoUrl, 
      churchName, language, contactNumber, 
      checkOnly // New flag to just check existence without creating
    } = body;

    if (!uid || !email) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // 1. Check if user already exists
    // D1: Use .first() to get the single user object
    const existingUser = await env.DB.prepare('SELECT * FROM user WHERE firebaseUid = ?')
      .bind(uid)
      .first();

    // IF USER EXISTS: Return data immediately (Login success)
    if (existingUser) {
      return NextResponse.json({
        ...existingUser,
        status: 'exists'
      });
    }

    // IF USER DOES NOT EXIST:
    
    // A) If we only wanted to check (e.g. initial Google click), return 404
    if (checkOnly) {
      return NextResponse.json({ status: 'new_user' }, { status: 404 });
    }

    // B) Otherwise, CREATE NEW USER (Registration)
    const sql = `
      INSERT INTO user 
      (firebaseUid, email, fullName, role, churchName, photoUrl, language, contactNumber, createdAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    // Default Values logic
    const finalChurch = churchName || "The Grace Evangelical Church";
    const finalRole = 'public';
    const finalLang = language || 'Tamil';
    const finalPhoto = photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=random`;
    const finalName = displayName || 'New Member';
    const finalContact = contactNumber || '';

    // Execute Insert
    await env.DB.prepare(sql)
      .bind(
        uid,
        email,
        finalName,
        finalRole,
        finalChurch,
        finalPhoto,
        finalLang,
        finalContact
      )
      .run();

    // Log Activity
    await logActivity(env, uid, 'INSERT', 'new user', `${finalName}, Signup`);

    return NextResponse.json({
      firebaseUid: uid,
      email,
      fullName: finalName,
      role: finalRole,
      churchName: finalChurch,
      photoUrl: finalPhoto,
      language: finalLang,
      contactNumber: finalContact,
      status: 'created'
    });

  } catch (error) {
    console.error('Auth Sync Error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}