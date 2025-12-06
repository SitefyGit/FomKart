'use client';

export default function TestNavigation() {
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 z-50">
      <h3 className="font-semibold text-gray-900 mb-3">Quick Test Links</h3>
      <div className="space-y-2">
        <a 
          href="/auth/login"
          className="block text-blue-600 hover:text-blue-700 text-sm underline"
          target="_blank"
        >
          🔐 Creator Login
        </a>
        <a 
          href="/creator/designpro"
          className="block text-blue-600 hover:text-blue-700 text-sm underline"
          target="_blank"
        >
          👤 Creator Profile
        </a>
        <p className="text-xs text-gray-500 mt-2">
          Demo email: creator@fomkart.com (use the password you set in Supabase Auth)
        </p>
      </div>
    </div>
  );
}
