import React from 'react';

export function Alert({ type = 'info', message, onClose }) {
  const styles = {
    success: 'bg-green-50 border-green-300 text-green-700',
    warning: 'bg-orange-50 border-orange-300 text-orange-700',
    error: 'bg-red-50 border-red-300 text-red-700',
    info: 'bg-orange-50 border-orange-300 text-orange-700',
  };

  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div
      className={`${styles[type]} border px-4 py-3 rounded-xl mb-4 flex items-center gap-3 shadow-sm`}
      role="alert"
    >
      <span className="text-lg font-semibold">
        {icons[type]}
      </span>

      <span className="flex-1 text-sm font-medium">
        {message}
      </span>

      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition"
        >
          ✕
        </button>
      )}
    </div>
  );
}
