import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const getDb = () => {
  // 1. Get the Cloudflare Context
  let context;
  try {
    context = getRequestContext();
  } catch (e) {
    // If we can't get context, we are likely not in the Edge runtime properly
    throw new Error("❌ Failed to get Cloudflare Request Context. Are you running in Edge Runtime?");
  }

  // 2. Check if DB binding exists
  if (!context || !context.env || !context.env.DB) {
    // Let's log what IS available to help debug
    const available = context && context.env ? Object.keys(context.env).join(', ') : 'NONE';
    
    // Fallback for local dev (npm run dev)
    if (process.env.NODE_ENV === 'development') {
       throw new Error("❌ Local Dev Error: D1 binding not found. Did you run `wrangler d1 create`?");
    }

    // The Real Error for Production
    throw new Error(`❌ Production Error: DB binding is missing. Available bindings: [${available}]`);
  }

  // 3. Return the Drizzle instance
  return drizzle(context.env.DB);
};