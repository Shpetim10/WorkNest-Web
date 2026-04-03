import React, { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string; // making id required for accessibility label linking
  icon?: ReactNode;
  iconRight?: ReactNode;
  onIconRightClick?: () => void;
  required?: boolean;
}

export const Input = ({
  label,
  id,
  icon,
  iconRight,
  onIconRightClick,
  required = false,
  className = '',
  ...props
}: InputProps) => {
  return (
    <div className="space-y-1 w-full">
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
          className={`w-full ${icon ? 'pl-9' : 'pl-4'} ${iconRight ? 'pr-10' : 'pr-4'} py-2.5 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all placeholder:text-gray-400 ${className}`}
          {...props}
        />
        {iconRight && (
          <button
            type="button"
            onClick={onIconRightClick}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {iconRight}
          </button>
        )}
      </div>
    </div>
  );
};
