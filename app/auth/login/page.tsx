import { Suspense } from "react";
import { LoginPageContent } from "./page-client";

// Wrapper component that provides Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <LoginPageContent />
    </Suspense>
  );
}

// Loading state component
function LoginPageLoading() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md border rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Login</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in with your email and password.</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Email</div>
            <div className="h-10 w-full rounded-md border bg-gray-100 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Password</div>
            <div className="h-10 w-full rounded-md border bg-gray-100 animate-pulse"></div>
          </div>
          <div className="h-10 w-full rounded-md bg-gray-200 animate-pulse"></div>
        </div>
        <div className="text-sm text-gray-600 mt-4">
          Don't have an account? <span className="text-blue-600">Sign up</span>
        </div>
      </div>
    </div>
  );
}
