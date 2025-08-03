export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-4">
        <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Test Page Working!</h1>
        <p className="text-gray-700 mb-4">
          If you can see this page, the basic routing is working correctly.
        </p>
        <div className="bg-gray-100 p-4 rounded text-sm font-mono">
          <p><strong>Environment Check (Client-side only):</strong></p>
          <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
          <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
          <p><strong>Server-side variables (not shown on client):</strong></p>
          <p>NEXTAUTH_SECRET: [Server-side only]</p>
          <p>GOOGLE_CLIENT_ID: [Server-side only]</p>
          <p>GOOGLE_CLIENT_SECRET: [Server-side only]</p>
        </div>
        <a
          href="/dashboard"
          className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
} 