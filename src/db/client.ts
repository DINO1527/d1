import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const getDb = () => {
  // 1. Try to get the Cloudflare Env (Works in Production & Preview)
  try {
    const context = getRequestContext();
    if (context && context.env && context.env.DB) {
      return drizzle(context.env.DB);
    }
  } catch (e) {
    // Context might fail in some local setups, ignore and fall through
  }

  // 2. Fallback for Local Development (npm run dev)
  // When running locally, 'process.env.DB' isn't available directly.
  // We rely on the proxy setup in next.config.mjs to handle this, 
  // OR we throw a helpful error if the setup is wrong.
  
  if (process.env.NODE_ENV === 'development') {
    throw new Error(
      "❌ D1 Database binding not found. \n" +
      "Make sure you have:\n" + 
      "1. Added `setupDevPlatform()` in next.config.mjs\n" + 
      "2. Run `npx wrangler d1 create <name>`\n" +
      "3. Configured `wrangler.toml` correctly."
    );
  }

  throw new Error("❌ Database binding 'DB' not found in this environment.");
};