// hooks/useFormattedDate.ts
import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { formatDate, formatDateShort, formatDateISO } from '@/lib/formatDate';
import { formatRelativeTime, formatRelativeTimeVerbose } from '@/lib/formatRelativeTime';

interface FormattedDateResult {
  /** Full formatted date: "Tue, Oct 7, 2025 • 7:34 PM" */
  full: string;
  /** Short date: "Oct 7, 2025" */
  short: string;
  /** ISO date: "2025-10-07" */
  iso: string;
  /** Relative time: "3h ago" */
  relative: string;
  /** Verbose relative: "3 hours ago" */
  relativeVerbose: string;
  /** Raw Date object */
  date: Date | null;
}

/**
 * Unified hook for formatting dates with multiple output formats
 * Auto-updates relative time every minute
 * 
 * @param value - Firestore Timestamp, Date, string, or number
 * @param options - Configuration options
 * @returns Object with all formatted date variants
 * 
 * @example
 * const { full, relative } = useFormattedDate(note.createdAt);
 * 
 * return (
 *   <div>
 *     <span title={full}>{relative}</span>
 *   </div>
 * );
 */
export function useFormattedDate(
  value?: Timestamp | string | number | Date | null | any,
  options: {
    /** Update relative time automatically (default: true) */
    autoUpdate?: boolean;
    /** Update interval in milliseconds (default: 60000 = 1 minute) */
    updateInterval?: number;
  } = {}
): FormattedDateResult {
  const { autoUpdate = true, updateInterval = 60000 } = options;

  const [tick, setTick] = useState(0);

  // Auto-update relative time
  useEffect(() => {
    if (!autoUpdate) return;

    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, updateInterval);

    return () => clearInterval(timer);
  }, [autoUpdate, updateInterval]);

  // Convert to Date object
  const getDateObject = (): Date | null => {
    if (!value) return null;

    try {
      if (value instanceof Timestamp) {
        return value.toDate();
      } else if (value instanceof Date) {
        return value;
      } else if (typeof value === "string" || typeof value === "number") {
        return new Date(value);
      } else if ((value as any)?.seconds) {
        return new Date((value as any).seconds * 1000);
      } else if (value?.toDate && typeof value.toDate === 'function') {
        return value.toDate();
      }
    } catch {
      return null;
    }

    return null;
  };

  const date = getDateObject();

  return {
    full: formatDate(value),
    short: formatDateShort(value),
    iso: formatDateISO(value),
    relative: formatRelativeTime(value),
    relativeVerbose: formatRelativeTimeVerbose(value),
    date,
  };
}

/**
 * Simplified hook that returns just relative time (auto-updating)
 * 
 * @example
 * const timeAgo = useRelativeTime(note.createdAt);
 * return <span>{timeAgo}</span>; // "3h ago"
 */
export function useRelativeTime(
  value?: Timestamp | string | number | Date | null | any
): string {
  const { relative } = useFormattedDate(value, { autoUpdate: true });
  return relative;
}
