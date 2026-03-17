/**
 * Timezone Utility - Format dates with timezone awareness
 * Uses standard browser Intl API for timezone support
 */

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: '(GMT+05:30) IST - India Standard Time', offset: '+5:30' },
  { value: 'Asia/Colombo', label: '(GMT+05:30) Asia/Colombo', offset: '+5:30' },
  { value: 'Asia/Bangkok', label: '(GMT+07:00) Asia/Bangkok', offset: '+7:00' },
  { value: 'Asia/Singapore', label: '(GMT+08:00) Asia/Singapore', offset: '+8:00' },
  { value: 'Asia/Hong_Kong', label: '(GMT+08:00) Asia/Hong Kong', offset: '+8:00' },
  { value: 'Asia/Shanghai', label: '(GMT+08:00) Asia/Shanghai', offset: '+8:00' },
  { value: 'Asia/Tokyo', label: '(GMT+09:00) Asia/Tokyo', offset: '+9:00' },
  { value: 'Asia/Seoul', label: '(GMT+09:00) Asia/Seoul', offset: '+9:00' },
  { value: 'Europe/London', label: '(GMT+00:00/±01:00) Europe/London', offset: '±0:00' },
  { value: 'Europe/Paris', label: '(GMT+01:00/±01:00) Europe/Paris', offset: '+1:00' },
  { value: 'Europe/Berlin', label: '(GMT+01:00/±01:00) Europe/Berlin', offset: '+1:00' },
  { value: 'Europe/Moscow', label: '(GMT+03:00) Europe/Moscow', offset: '+3:00' },
  { value: 'America/New_York', label: '(GMT-05:00/-04:00) America/New York', offset: '-5:00' },
  { value: 'America/Chicago', label: '(GMT-06:00/-05:00) America/Chicago', offset: '-6:00' },
  { value: 'America/Denver', label: '(GMT-07:00/-06:00) America/Denver', offset: '-7:00' },
  { value: 'America/Los_Angeles', label: '(GMT-08:00/-07:00) America/Los Angeles', offset: '-8:00' },
  { value: 'Australia/Sydney', label: '(GMT+10:00/±01:00) Australia/Sydney', offset: '+10:00' },
  { value: 'Australia/Melbourne', label: '(GMT+10:00/±01:00) Australia/Melbourne', offset: '+10:00' },
  { value: 'Pacific/Auckland', label: '(GMT+12:00/±01:00) Pacific/Auckland', offset: '+12:00' },
  { value: 'UTC', label: 'UTC - Coordinated Universal Time', offset: '±0:00' },
];

/**
 * Format date with timezone awareness
 * @param {string|Date} dateString - ISO date string or Date object
 * @param {string} timezone - Timezone identifier (e.g., 'Asia/Kolkata')
 * @param {string} format - Format type: 'full', 'date', 'time', 'short'
 * @returns {string} Formatted date string
 */
export function formatDateWithTimezone(dateString, timezone = 'Asia/Kolkata', format = 'full') {
  try {
    const date = new Date(dateString);

    if (isNaN(date)) {
      console.warn('Invalid date:', dateString);
      return 'Invalid date';
    }

    // Debug logging
    console.debug('formatDateWithTimezone debug:', {
      dateString,
      timezone,
      format,
      parsed_date: date.toISOString(),
      browser_offset: new Date().getTimezoneOffset()
    });

    const options = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);

    let result = {};
    parts.forEach(({ type, value }) => {
      result[type] = value;
    });

    const { year, month, day, hour, minute, second } = result;

    switch (format) {
      case 'full':
        return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
      case 'date':
        return `${day}/${month}/${year}`;
      case 'time':
        return `${hour}:${minute}:${second}`;
      case 'short':
        return `${day}/${month} ${hour}:${minute}`;
      case 'datetime':
        return `${day}/${month}/${year} ${hour}:${minute}`;
      default:
        return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(dateString);
  }
}

/**
 * Get short timezone format
 * @param {string} dateString - ISO date string
 * @param {string} timezone - Timezone identifier
 * @returns {object} { date, time, offset }
 */
export function getTimeInfo(dateString, timezone = 'Asia/Kolkata') {
  try {
    const date = new Date(dateString);
    const tzOption = TIMEZONES.find(tz => tz.value === timezone);
    const offset = tzOption ? tzOption.offset : '±0:00';

    return {
      date: formatDateWithTimezone(date, timezone, 'date'),
      time: formatDateWithTimezone(date, timezone, 'time'),
      offset,
      full: formatDateWithTimezone(date, timezone, 'full'),
    };
  } catch (error) {
    console.error('Error getting time info:', error);
    return { date: 'N/A', time: 'N/A', offset: '', full: 'N/A' };
  }
}

/**
 * Get list of available timezones
 * @returns {array} Array of timezone options
 */
export function getTimezones() {
  return TIMEZONES;
}

/**
 * Get timezone label by value
 * @param {string} timezone - Timezone identifier
 * @returns {string} Timezone label
 */
export function getTimezoneLabel(timezone) {
  const tz = TIMEZONES.find(t => t.value === timezone);
  return tz ? tz.label : timezone;
}

/**
 * Detect user's timezone from browser
 */
export function detectUserTimezone() {
  try {
    // Get browser timezone using Intl
    let browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Map common aliases
    if (browserTimezone === 'Asia/Calcutta') {
      browserTimezone = 'Asia/Kolkata';
    }

    // Check if it's in our supported list
    if (TIMEZONES.find(tz => tz.value === browserTimezone)) {
      return browserTimezone;
    }

    // If not, return default
    return 'Asia/Kolkata';
  } catch (error) {
    console.error('Error detecting timezone:', error);
    return 'Asia/Kolkata';
  }
}

/**
 * Default timezone (India Standard Time)
 */
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export default {
  formatDateWithTimezone,
  getTimeInfo,
  getTimezones,
  getTimezoneLabel,
  detectUserTimezone,
  DEFAULT_TIMEZONE,
};
