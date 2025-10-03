"use client";

import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";

export default function RoleDebugger() {
  const { profile, isLoading: profileLoading } = useProfile();
  const { user, loading: authLoading } = useAuth();
  const [idToken, setIdToken] = useState<string>("");
  const [showToken, setShowToken] = useState(false);
  const [isOpen, setIsOpen] = useState(() => {
    // Check localStorage for saved state
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('roleDebuggerOpen');
      return saved === 'true';
    }
    return false;
  });

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('roleDebuggerOpen', isOpen.toString());
  }, [isOpen]);

  // Add keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const refreshToken = async () => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      setIdToken(token);
    }
  };

  if (authLoading || profileLoading) {
    return <div className="p-4 bg-gray-100 rounded">Loading...</div>;
  }

  // Collapsed state - just show a floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all z-50 flex items-center gap-2"
        title="Open Dev Tools"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="text-sm font-medium">Dev</span>
      </button>
    );
  }

  // Expanded state - show the full debugger
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white border-2 border-purple-500 rounded-lg shadow-xl max-w-md z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-purple-700">Role Debugger</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Close Dev Tools"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-semibold">User UID:</span>{" "}
          <code className="bg-gray-100 px-1 rounded">{user?.uid || "Not logged in"}</code>
        </div>
        
        <div>
          <span className="font-semibold">Email:</span>{" "}
          <code className="bg-gray-100 px-1 rounded">{user?.email || "None"}</code>
        </div>
        
        <div>
          <span className="font-semibold">Profile Role:</span>{" "}
          <code className="bg-yellow-100 px-2 py-1 rounded font-bold">
            {profile?.role || "NO ROLE SET"}
          </code>
        </div>
        
        <div>
          <span className="font-semibold">Beta Active:</span>{" "}
          <code className="bg-gray-100 px-1 rounded">
            {profile?.betaActive ? "Yes" : "No"}
          </code>
        </div>

        <div className="pt-2 border-t">
          <button
            onClick={refreshToken}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            Get Fresh ID Token
          </button>
          
          {idToken && (
            <div className="mt-2">
              <button
                onClick={() => setShowToken(!showToken)}
                className="text-xs text-blue-600 hover:underline"
              >
                {showToken ? "Hide" : "Show"} Token
              </button>
              {showToken && (
                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {idToken}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="pt-2 border-t text-xs text-gray-600">
          <p>To set role, run:</p>
          <code className="block bg-gray-100 p-1 rounded mt-1">
            node scripts/make-admin.js {user?.email || "email"} system-admin
          </code>
        </div>
      </div>
    </div>
  );
}