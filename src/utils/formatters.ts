/**
 * Formats a number to Bangladeshi Taka (৳).
 */
export function formatBDT(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '৳0';
  return `৳${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Formats ISO date string to human-readable format.
 */
export function formatDateTime(isoString?: string): string {
  if (!isoString) return '--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats duration in minutes to e.g. "1 hr 35 mins" or "45 mins"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 0) minutes = 0;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

/**
 * Generates human readable short ID (e.g. REC-20261126-001)
 */
export function generateReceiptNumber(prefix = 'BLB'): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${y}${m}${d}-${rand}`;
}
