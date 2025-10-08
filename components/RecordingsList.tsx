"use client";

import { useState } from "react";
import Spinner from "./ui/Spinner";
import { formatDate } from "@/lib/formatDate";

interface Recording {
  id: string;
  transcript: string;
  audioUrl?: string;   // optional: signed URL from storage
  timestamp: any; // Firestore timestamp
}

export default function RecordingsList({ recordings, onCombine }: {
  recordings: Recording[];
  onCombine: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  if (!recordings?.length) return null; // ✅ don’t render if empty

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm mt-6">
      <h3 className="text-lg font-semibold mb-3">Session Recordings ({recordings.length})</h3>
      <ul className="space-y-3">
        {recordings.map((rec, index) => (
          <li key={rec.id} className="p-3 border rounded-lg bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  Recording {index + 1} - {formatDate(rec.timestamp)}
                </p>
                <p className="text-gray-800 text-sm mt-1 line-clamp-2">
                  {rec.transcript.slice(0, 120)}...
                </p>
              </div>
              <div className="flex gap-3 ml-4">
                {rec.audioUrl && (
                  <audio controls src={rec.audioUrl} className="w-32" />
                )}
                <button
                  onClick={() => navigator.clipboard.writeText(rec.transcript)}
                  className="text-xs px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
                >
                  Copy
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {recordings.length > 1 && (
        <div className="mt-5 flex justify-end">
          <button
            onClick={async () => {
              setLoading(true);
              await onCombine();
              setLoading(false);
            }}
            disabled={loading}
            className="px-5 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? <Spinner size="sm" text="Merging transcripts (please wait)..." /> : "Combine into Final SOAP"}
          </button>
        </div>
      )}
    </div>
  );
}