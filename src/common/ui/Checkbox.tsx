import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Checkbox = ({ label, error, className = '', ...props }: CheckboxProps) => {
  return (
    <div className="space-y-1.5">
      <label className={`flex items-center gap-3 cursor-pointer group ${className}`}>
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-md bg-white checked:bg-[#0066FF] checked:border-[#0066FF] transition-all cursor-pointer focus:ring-2 focus:ring-[#0066FF]/20"
            {...props}
          />
          <svg
            className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-[14px] text-gray-600 font-medium select-none group-hover:text-gray-900 transition-colors">
          {label}
        </span>
      </label>
      {error && <p className="text-[12px] text-red-500 font-medium ml-8">{error}</p>}
    </div>
  );
};
