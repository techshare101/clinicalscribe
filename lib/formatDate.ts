// lib/formatDate.ts
import { Timestamp } from "firebase/firestore";

/**
 * Formats Firestore Timestamp or string/number dates
 * into a consistent human-readable format.
 * 
 * Example output: "Tue, Oct 7, 2025 • 7:34 PM"
 */
export function formatDate(value?: Timestamp | string | number | null | any): string {
  if (!value) return "—";

  try {
    let date: Date;

    if (value instanceof Timestamp) {
      date = value.toDate();
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else if ((value as any)?.seconds) {
      // Fallback for serialized timestamp object
      date = new Date((value as any).seconds * 1000);
    } else if (value instanceof Date) {
      date = value;
    } else if (value?.toDate && typeof value.toDate === 'function') {
      // Handle Firestore Timestamp-like objects
      date = value.toDate();
    } else {
      return "—";
    }

    // Handle invalid date object
    if (isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (err) {
    console.error("Date format error:", err);
    return "—";
  }
}

/**
 * Formats date for compact display (no time)
 * Example: "Oct 7, 2025"
 */
export function formatDateShort(value?: Timestamp | string | number | null | any): string {
  if (!value) return "—";

  try {
    let date: Date;

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

    if (isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (err) {
    console.error("Date format error:", err);
    return "—";
  }
}

/**
 * Formats date for ISO display (sortable)
 * Example: "2025-10-07"
 */
export function formatDateISO(value?: Timestamp | string | number | null | any): string {
  if (!value) return "—";

  try {
    let date: Date;

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

    if (isNaN(date.getTime())) return "—";

    return date.toISOString().split('T')[0];
  } catch (err) {
    console.error("Date format error:", err);
    return "—";
  }
}
