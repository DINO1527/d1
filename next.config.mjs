import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["async_hooks", "node:async_hooks"],
};

if (process.env.NODE_ENV === 'development') {
  // WE ADD OPTIONS HERE TO FORCE IT TO SEE WRANGLER.TOML
  await setupDevPlatform({
    persist: true, 
    configPath: './wrangler.toml',
    bindings: {
      DB: {
        type: 'd1',
        databaseName: 'example', 
        databaseId: 'eb2dbfd1-c591-49b2-94e1-71277a8c790b'
      }
    }
  });
}

export default nextConfig;