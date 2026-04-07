import React, { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  options: SelectOption[];
  error?: string;
}

export const Select = ({ 
  label, 
  id, 
  options, 
  error, 
  className = '', 
  ...props 
}: SelectProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={id} 
        className="block text-[13px] font-semibold text-gray-700"
      >
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        <select
          id={id}
          className={`
            w-full h-11 pl-4 pr-10 bg-[#f8fafc] border border-gray-100 rounded-xl
            text-[14px] font-medium text-gray-700 appearance-none outline-none
            focus:ring-2 focus:ring-[#155dfc]/10 focus:border-[#155dfc]/40
            transition-all cursor-pointer group-hover:border-gray-200
            ${error ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : ''}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors pointer-events-none">
          <ChevronDown size={18} strokeWidth={2.5} />
        </div>
      </div>
      {error && <p className="text-[12px] text-red-500 ml-1 font-medium">{error}</p>}
    </div>
  );
};
