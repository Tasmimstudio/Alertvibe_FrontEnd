/**
 * Formats a Firestore timestamp, Date object, or ISO string into a consistent display string.
 * @param {object|string|Date|null} ts - Firestore {_seconds}, Date, or ISO string
 * @param {'date'|'time'|'datetime'} mode
 * @returns {string}
 */
export function formatDate(ts, mode = 'datetime') {
  let d;
  if (!ts) {
    d = new Date();
  } else if (ts._seconds !== undefined) {
    d = new Date(ts._seconds * 1000);
  } else {
    d = new Date(ts);
  }

  if (isNaN(d.getTime())) return '—';

  const dateStr = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (mode === 'date') return dateStr;
  if (mode === 'time') return timeStr;
  return `${dateStr}, ${timeStr}`;
}
