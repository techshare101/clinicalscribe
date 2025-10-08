// lib/formatRelativeTime.ts
import { Timestamp } from "firebase/firestore";

/**
 * Returns a friendly relative time (e.g. "3h ago", "2 days ago")
 * for Firestore timestamps, strings, or numbers.
 */
export function formatRelativeTime(
  value?: Timestamp | string | number | null | any
): string {
  if (!value) return "—";

  let date: Date;
  try {
    if (value instanceof Timestamp) {
      date = value.toDate();
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else if ((value as any)?.seconds) {
      date = new Date((value as any).seconds * 1000);
    } else if (value instanceof Date) {
      date = value;
    } else if (value?.toDate && typeof value.toDate === 'function') {
      date = value.toDate();
    } else {
      return "—";
    }
  } catch {
    return "—";
  }

  if (isNaN(date.getTime())) return "—";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  // Future dates
  if (diffMs < 0) {
    const absDiffSec = Math.abs(diffSec);
    const absDiffMin = Math.abs(diffMin);
    const absDiffHr = Math.abs(diffHr);
    const absDiffDay = Math.abs(diffDay);

    if (absDiffSec < 60) return "in a moment";
    if (absDiffMin < 60) return `in ${absDiffMin}m`;
    if (absDiffHr < 24) return `in ${absDiffHr}h`;
    if (absDiffDay < 7) return `in ${absDiffDay}d`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  // Past dates
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;

  // For older dates, fallback to formatted day
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Returns verbose relative time for tooltips
 * Example: "3 hours ago", "2 days ago", "just now"
 */
export function formatRelativeTimeVerbose(
  value?: Timestamp | string | number | null | any
): string {
  if (!value) return "—";

  let date: Date;
  try {
    if (value instanceof Timestamp) {
      date = value.toDate();
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else if ((value as any)?.seconds) {
      date = new Date((value as any).seconds * 1000);
    } else if (value instanceof Date) {
      date = value;
    } else if (value?.toDate && typeof value.toDate === 'function') {
      date = value.toDate();
    } else {
      return "—";
    }
  } catch {
    return "—";
  }

  if (isNaN(date.getTime())) return "—";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec} second${diffSec === 1 ? "" : "s"} ago`;
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  if (diffDay < 365) {
    const months = Math.floor(diffDay / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }

  const years = Math.floor(diffDay / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
