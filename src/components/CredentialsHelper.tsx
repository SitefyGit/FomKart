'use client';

import { useState } from 'react';
import { User, Eye, EyeOff, Copy } from 'lucide-react';

export default function CredentialsHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const demoEmail = process.env.NEXT_PUBLIC_DEMO_CREATOR_EMAIL ?? 'creator@fomkart.com';
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_CREATOR_PASSWORD ?? '';
  const hasDemoPassword = demoPassword.length > 0;

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:from-emerald-700 hover:to-blue-700 transition-all duration-300 hover:scale-110 z-50 animate-float"
        title="Demo Credentials"
      >
        <User className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white rounded-xl shadow-2xl border p-6 max-w-sm z-50 animate-scale-in hover:scale-105 transition-transform duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          Demo Credentials
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 hover:scale-110 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">EMAIL</label>
          <div className="flex items-center gap-2">
            <code className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 rounded-lg text-sm flex-1 hover:from-emerald-50 hover:to-blue-50 transition-all duration-200">{demoEmail}</code>
            <button
              onClick={() => copyToClipboard(demoEmail)}
              className="p-2 text-gray-400 hover:text-emerald-600 transition-all duration-200 hover:scale-110"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">PASSWORD</label>
          <div className="flex items-center gap-2">
            <code className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 rounded-lg text-sm flex-1 hover:from-emerald-50 hover:to-blue-50 transition-all duration-200">
              {hasDemoPassword ? (showPassword ? demoPassword : '••••••••') : 'Set NEXT_PUBLIC_DEMO_CREATOR_PASSWORD'}
            </code>
            {hasDemoPassword ? (
              <>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-all duration-200 hover:scale-110"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(demoPassword)}
                  className="p-2 text-gray-400 hover:text-emerald-600 transition-all duration-200 hover:scale-110"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <a
          href="/auth/creator-login"
          className="block w-full text-center bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
        >
          Go to Login
        </a>
        <p className="text-xs text-gray-500 text-center">
          Configure demo values in your environment (NEXT_PUBLIC_DEMO_CREATOR_EMAIL / NEXT_PUBLIC_DEMO_CREATOR_PASSWORD) to enable autofill.
        </p>
      </div>
    </div>
  );
}
