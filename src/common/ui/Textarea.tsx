import React, { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
}

export const Textarea = ({
  label,
  id,
  required = false,
  error,
  className = '',
  ...props
}: TextareaProps) => {
  const isInvalid = !!error;

  return (
    <div className="space-y-1 w-full text-left">
      <label className="text-[13px] font-semibold text-gray-700 font-sans" htmlFor={id}>
        {label} {required && <span className="text-gray-500">*</span>}
      </label>
      <textarea
        id={id}
        className={`w-full px-4 py-2.5 bg-[#f8fafc] border ${
          isInvalid 
            ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
            : 'border-gray-200 focus:ring-[#0066FF]/20 focus:border-[#0066FF]'
        } rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 min-h-[120px] resize-none ${className}`}
        {...props}
      />
      {isInvalid && (
        <p className="text-[12px] text-red-500 font-medium mt-1 pl-1">{error}</p>
      )}
    </div>
  );
};
