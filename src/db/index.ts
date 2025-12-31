import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const getDB = () => {
  // 1. Try to get the binding from the Next.js Request Context (Live/Production)
  if (process.env.NODE_ENV === 'development') {
    // In local dev, next.config.mjs mocks this, 
    // but sometimes we need to fallback or handle it differently if setupDevPlatform fails.
    // However, the cleanest way in App Router is usually to assume the context works.
  }

  try {
    const { env } = getRequestContext();
    if (!env || !env.DB) {
      throw new Error('DB binding not found in request context');
    }
    return drizzle(env.DB);
  } catch (e) {
    // Fallback for when getRequestContext isn't available (rare, but happens in some dev flows)
    // or provide a helpful error log
    console.error("Failed to initialize DB:", e);
    throw new Error("Database connection failed");
  }
};