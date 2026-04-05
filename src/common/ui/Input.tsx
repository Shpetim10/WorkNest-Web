import React, { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string; // making id required for accessibility label linking
  icon?: ReactNode;
  iconRight?: ReactNode;
  onIconRightClick?: () => void;
  required?: boolean;
  error?: string;
}

export const Input = ({
  label,
  id,
  icon,
  iconRight,
  onIconRightClick,
  required = false,
  error,
  className = '',
  ...props
}: InputProps) => {
  const isInvalid = !!error;

  return (
    <div className="space-y-1 w-full text-left">
      <label className="text-[13px] font-semibold text-gray-700 font-sans" htmlFor={id}>
        {label} {required && <span className="text-gray-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`w-full ${icon ? 'pl-9' : 'pl-4'} ${iconRight ? 'pr-12' : 'pr-4'} py-2.5 bg-[#f8fafc] border ${
            isInvalid 
              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
              : 'border-gray-200 focus:ring-[#0066FF]/20 focus:border-[#0066FF]'
          } rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${className}`}
          {...props}
        />
        {iconRight && (
          <button
            type="button"
            onClick={onIconRightClick}
            aria-label={`Toggle ${label}`}
            title={`Toggle ${label}`}
            className="absolute inset-y-0 right-0 z-10 flex items-center px-3.5 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:text-gray-700"
          >
            {iconRight}
          </button>
        )}
      </div>
      {isInvalid && (
        <p className="text-[12px] text-red-500 font-medium mt-1 pl-1">{error}</p>
      )}
    </div>
  );
};
