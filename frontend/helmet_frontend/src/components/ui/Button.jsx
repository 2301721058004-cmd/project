import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  type = 'button',
  disabled = false,
  className = ''
}) {
  const baseStyles = 'font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
  
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white focus:ring-indigo-500 shadow-lg shadow-indigo-500/25',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 focus:ring-slate-500 border border-slate-600',
    danger: 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white focus:ring-rose-500 shadow-lg shadow-rose-500/25',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white focus:ring-emerald-500 shadow-lg shadow-emerald-500/25',
    ghost: 'bg-transparent hover:bg-white/10 text-slate-300 hover:text-white border border-white/10',
  };

  const sizes = {
    sm: 'py-1.5 px-3 text-xs',
    md: 'py-2.5 px-5 text-sm',
    lg: 'py-3 px-6 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}