/**
 * Format UTC timestamp to IST (Indian Standard Time)
 * Handles MongoDB ISO format: 2026-02-18T10:03:00.910+00:00
 */
export const formatToIST = (utcTimestamp) => {
  if (!utcTimestamp) return 'N/A';
  
  // Parse the ISO timestamp
  const date = new Date(utcTimestamp);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  // Format to IST (UTC+5:30)
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/**
 * Show relative time (2 min ago, 1 hour ago) in IST
 */
export const timeAgoIST = (utcTimestamp) => {
  if (!utcTimestamp) return 'N/A';
  
  const date = new Date(utcTimestamp);
  const now = new Date();
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  // Calculate difference in milliseconds
  const diffMs = now - date;
  const seconds = Math.floor(diffMs / 1000);
  
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds} sec ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  
  // Older than a week, show full IST date
  return formatToIST(utcTimestamp);
};

// For your timestamp: 2026-02-18T10:03:00.910+00:00
// Output: 18 Feb 2026, 03:33:00 PM (IST)