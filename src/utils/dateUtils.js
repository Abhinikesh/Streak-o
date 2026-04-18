import { format, parseISO } from 'date-fns';

/**
 * Returns today's date as a "YYYY-MM-DD" string.
 */
export function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns "YYYY-MM" from a given Date object.
 * @param {Date} date
 */
export function getMonthString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns an array of all "YYYY-MM-DD" strings for a given year/month.
 * @param {number} year
 * @param {number} month  - 1-indexed (January = 1)
 */
export function getDaysInMonth(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    days.push(`${year}-${mm}-${dd}`);
  }
  return days;
}

/**
 * Takes a "YYYY-MM-DD" string and returns "April 19, 2025".
 * @param {string} dateStr
 */
export function formatDisplayDate(dateStr) {
  return format(parseISO(dateStr), 'MMMM d, yyyy');
}
