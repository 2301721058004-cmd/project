import React, { useState } from 'react';

export function InputField({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder, 
  icon,
  required = false 
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="mb-5">
      {label && (
        <label 
          className="block text-sm font-semibold text-orange-600 mb-2"
          htmlFor={name}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-orange-400">
            {icon}
          </div>
        )}

        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full 
            bg-white 
            border border-orange-200 
            rounded-xl 
            py-3 
            px-4 
            text-gray-700 
            placeholder-gray-400
            transition-all duration-200
            focus:outline-none 
            focus:border-orange-500 
            focus:ring-2 
            focus:ring-orange-200
            ${icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-10' : ''}
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-orange-500 hover:text-orange-600 transition"
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    </div>
  );
}
