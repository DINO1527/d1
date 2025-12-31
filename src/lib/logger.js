import pool from '@/lib/db';


export async function logActivity(uid, action, module,  details) {
  try {
    // If no UID is provided (e.g. public action), we can log as 'SYSTEM' or skip
    if (!uid) return;

    const sql = `
      INSERT INTO activity_logs (user_uid, action_type, module, details) 
      VALUES (?, ?, ?, ?)
    `;
    
    // We don't await this to prevent slowing down the main response
    pool.query(sql, [uid, action, module,  details]);
    
  } catch (error) {
    console.error("Failed to write activity log:", error);
    // Silent fail: Logging errors shouldn't crash the app
  }
}