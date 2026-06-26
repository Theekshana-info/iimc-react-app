import { format } from 'date-fns';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Converts a 24h time string (e.g. "18:00") to a human-readable 12h format (e.g. "6:00 PM")
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Returns a human-readable schedule label for an event.
 * Examples:
 *   "May 15th, 2026 at 6:00 PM"
 *   "Daily at 6:00 PM"
 *   "Every Mon, Wed, Fri at 6:00 PM"
 */
export function formatEventSchedule(event: {
  event_date: string;
  event_time?: string | null;
  recurrence_type?: string | null;
  recurrence_days?: unknown;
}): string {
  const timePart = event.event_time ? ` at ${formatTime(event.event_time)}` : '';

  if (event.recurrence_type === 'daily') {
    return `Daily${timePart}`;
  }

  if (event.recurrence_type === 'weekly') {
    const days = Array.isArray(event.recurrence_days)
      ? (event.recurrence_days as number[])
          .sort((a, b) => a - b)
          .map((d) => DAY_NAMES_SHORT[d])
          .join(', ')
      : '';
    return days ? `Every ${days}${timePart}` : `Weekly${timePart}`;
  }

  // Default: one-time event
  const datePart = format(new Date(event.event_date), 'PPP');
  return `${datePart}${timePart}`;
}

/**
 * Returns the full day names for display on event detail page.
 */
export function formatEventScheduleLong(event: {
  event_date: string;
  event_time?: string | null;
  recurrence_type?: string | null;
  recurrence_days?: unknown;
}): string {
  const timePart = event.event_time ? ` at ${formatTime(event.event_time)}` : '';

  if (event.recurrence_type === 'daily') {
    return `Every day${timePart}`;
  }

  if (event.recurrence_type === 'weekly') {
    const days = Array.isArray(event.recurrence_days)
      ? (event.recurrence_days as number[])
          .sort((a, b) => a - b)
          .map((d) => DAY_NAMES[d])
          .join(', ')
      : '';
    return days ? `Every ${days}${timePart}` : `Weekly${timePart}`;
  }

  const datePart = format(new Date(event.event_date), 'PPP');
  return `${datePart}${timePart}`;
}

/**
 * Checks dynamically if an event is upcoming.
 * An event is considered upcoming when:
 * - If eventTimeStr (e.g. "18:30") is present, combined date and time is >= now.
 * - If eventTimeStr is absent, date-only midnight comparison is >= today local midnight.
 */
export function isEventUpcoming(eventDateStr: string, eventTimeStr?: string | null): boolean {
  const now = new Date();
  const eventDateObj = new Date(eventDateStr);
  
  // Extract UTC date components as stored by the system
  const year = eventDateObj.getUTCFullYear();
  const month = eventDateObj.getUTCMonth();
  const date = eventDateObj.getUTCDate();
  
  if (eventTimeStr) {
    // Parse time string e.g. "18:30" or "18:30:00"
    const [h, m] = eventTimeStr.split(':').map(Number);
    // Construct local date-time representing the event's start
    const combinedEventDate = new Date(year, month, date, h, m || 0, 0, 0);
    return combinedEventDate >= now;
  } else {
    // Midnight-to-midnight local date comparison
    const eventMidnight = new Date(year, month, date, 0, 0, 0, 0);
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return eventMidnight >= todayMidnight;
  }
}

