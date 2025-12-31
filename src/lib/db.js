// lib/db.js
import { getRequestContext } from '@cloudflare/next-on-pages';

export const getDB = () => {
  try {
    const { env } = getRequestContext();
    return env.DB;
  } catch (e) {
    console.error("D1 Database binding not found. Are you running with 'wrangler pages dev'?");
    throw new Error('Database binding failed');
  }
};