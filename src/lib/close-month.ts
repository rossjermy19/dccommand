/**
 * Utility for managing deal close month rolling window and end-of-month dates.
 * Format requirement: [Month Name] [YY] (e.g., "November 26", "December 26", "January 27", "February 27")
 * Dates are pegged to the final second of the last day of the selected month in UTC (23:59:59.000Z).
 */

export interface CloseMonthOption {
  key: string;        // '2026-11'
  label: string;      // 'November 26'
  value: string;      // '2026-11-30T23:59:59.000Z'
  year: number;       // 2026
  month: number;      // 11 (1-12)
  lastDay: number;    // 30
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Returns the exact ISO-8601 UTC string for the final moment of a given month and year.
 * Handles leap years automatically (e.g. Feb 2028 -> 29, Feb 2027 -> 28).
 */
export function getEndOfMonthIso(year: number, monthIndex: number): { isoEnd: string; lastDay: number } {
  // Day 0 of next month is the last day of monthIndex
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const monthNum = String(monthIndex + 1).padStart(2, '0');
  const dayNum = String(lastDay).padStart(2, '0');
  const isoEnd = `${year}-${monthNum}-${dayNum}T23:59:59.000Z`;
  return { isoEnd, lastDay };
}

/**
 * Generates rolling close month options for the specified total number of months (default 18),
 * starting from the current month.
 */
export function getRollingCloseMonths(totalMonths = 18, baseDate = new Date()): CloseMonthOption[] {
  const options: CloseMonthOption[] = [];
  const startYear = baseDate.getFullYear();
  const startMonth = baseDate.getMonth();

  for (let i = 0; i < totalMonths; i++) {
    const d = new Date(startYear, startMonth + i, 1);
    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const { isoEnd, lastDay } = getEndOfMonthIso(year, monthIndex);
    const monthName = MONTH_NAMES[monthIndex];
    const yy = String(year).slice(-2);
    const label = `${monthName} ${yy}`;
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    options.push({
      key,
      label,
      value: isoEnd,
      year,
      month: monthIndex + 1,
      lastDay,
    });
  }

  return options;
}

/**
 * Parses an ISO date string or timestamp into a 'YYYY-MM' key for matching options.
 */
export function getCloseMonthKey(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Formats an ISO date into '[Month Name] [YY]' (e.g. 'November 26').
 */
export function formatCloseMonthLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const monthName = MONTH_NAMES[d.getUTCMonth()];
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${monthName} ${yy}`;
}
