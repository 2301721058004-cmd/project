import React, { useState, useEffect } from 'react';
import { getTimezones, formatDateWithTimezone } from '../../utils/timezone';

export function TimezoneSelector({ timezone, onTimezoneChange }) {
  const timezones = getTimezones();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Timezone</span>
        <select
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
          className="px-2 py-1 bg-white border border-orange-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer hover:bg-orange-50 transition-colors"
          title="Select your timezone for correct time display"
        >
          {timezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>
      <div className="text-[10px] font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
        {formatDateWithTimezone(currentTime, timezone, 'time')} {
          new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'short'
          }).formatToParts(currentTime).find(p => p.type === 'timeZoneName')?.value
        }
      </div>
    </div>
  );
}
