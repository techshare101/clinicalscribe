'use client';

import { ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface AutoCombineBannerProps {
  sessionId: string;
  autoCombinedAt?: string;
  showLink?: boolean;
}

export default function AutoCombineBanner({
  sessionId,
  autoCombinedAt,
  showLink = true
}: AutoCombineBannerProps) {
  if (!autoCombinedAt) return null;

  const formattedDate = new Date(autoCombinedAt).toLocaleString();

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 p-4 mb-4 rounded-lg shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-amber-800 font-medium">
            This session was automatically combined because it exceeded 120 minutes of recording time
          </p>
          <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Auto-combined at {formattedDate}
          </p>
          
          {showLink && (
            <Link 
              href={`/patient/sessions/${sessionId}#finalSoap`}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full transition-colors"
            >
              View combined SOAP note <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}