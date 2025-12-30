export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24 bg-blue-50">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        ✅ The App is Working!
      </h1>
      <p className="text-xl text-gray-700">
        If you can see this, the Cloudflare setup is perfect.
      </p>
      <p className="text-md text-gray-500 mt-4">
        The issue is definitely in the Database connection.
      </p>
    </main>
  );
}