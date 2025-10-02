"use client";

import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { auth } from "@/lib/firebase";

export default function RoleDebugger() {
  const { profile, isLoading: profileLoading } = useProfile();
  const { user, loading: authLoading } = useAuth();
  const [idToken, setIdToken] = useState<string>("");
  const [showToken, setShowToken] = useState(false);

  const refreshToken = async () => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      setIdToken(token);
    }
  };

  if (authLoading || profileLoading) {
    return <div className="p-4 bg-gray-100 rounded">Loading...</div>;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white border-2 border-purple-500 rounded-lg shadow-xl max-w-md z-50">
      <h3 className="text-lg font-bold mb-2 text-purple-700">Role Debugger</h3>
      
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