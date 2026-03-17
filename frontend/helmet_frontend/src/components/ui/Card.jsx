import React from 'react';

export function Card({ children, className = '', title, icon, action }) {
  return (
    <div
      className={`bg-white border border-orange-200 rounded-2xl shadow-sm overflow-hidden ${className}`}
    >
      {(title || icon || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-200 bg-orange-50">
          
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl text-orange-600">{icon}</span>}
            {title && (
              <h3 className="text-lg font-semibold text-orange-600">
                {title}
              </h3>
            )}
          </div>

          {action && <div>{action}</div>}
        </div>
      )}

      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
