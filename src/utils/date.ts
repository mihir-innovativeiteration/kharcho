const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Format ISO date string into friendly display (e.g. "Today", "Yesterday", "24 Oct 2026")
 */
export function formatFriendlyDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  const day = date.getDate();
  const month = MONTH_NAMES_SHORT[date.getMonth()];
  const year = date.getFullYear();

  if (year === now.getFullYear()) {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${year}`;
}

/**
 * Format ISO date string into time display (e.g. "10:45 AM")
 */
export function formatTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '';

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12

  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Format date into "Month Year" string (e.g. "October 2026")
 */
export function formatMonthYear(dateInput: string | Date = new Date()): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Get Greeting based on current local hour
 */
export function getGreeting(userName = 'there'): { greeting: string; period: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { greeting: `Good morning, ${userName}`, period: 'morning' };
  }
  if (hour >= 12 && hour < 17) {
    return { greeting: `Good afternoon, ${userName}`, period: 'afternoon' };
  }
  if (hour >= 17 && hour < 22) {
    return { greeting: `Good evening, ${userName}`, period: 'evening' };
  }
  return { greeting: `Welcome back, ${userName}`, period: 'night' };
}
