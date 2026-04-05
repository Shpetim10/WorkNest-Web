import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  fullWidth = false,
  isLoading = false,
  icon,
  iconPosition = 'right',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || isLoading;

  const baseStyle = "flex items-center justify-center gap-2 transition-all duration-200 font-bold relative";
  
  const widthStyle = fullWidth ? "w-full py-3.5 rounded-xl text-[15px]" : "px-6 py-2.5 rounded-[10px] text-[13px] w-auto shrink-0";

  const primaryStyle = "text-white shadow-md bg-gradient-to-r from-[#0066FF] to-[#00C853]";
  const primaryHover = "hover:shadow-lg hover:-translate-y-[1px]";
  
  const secondaryStyle = "bg-[#f4f7fb] text-gray-800 hover:bg-[#e2e8f0]";
  
  const disabledStyle = "opacity-60 cursor-not-allowed grayscale-[0.5]";

  const combinedClassName = `
    ${baseStyle} 
    ${widthStyle} 
    ${isDisabled ? disabledStyle : 'cursor-pointer'}
    ${variant === 'primary' ? primaryStyle : secondaryStyle} 
    ${!isDisabled && variant === 'primary' ? primaryHover : ''}
    ${className}
  `.trim();

  return (
    <button className={combinedClassName} disabled={isDisabled} {...props}>
      {isLoading ? (
        <div className="flex items-center gap-2 animate-in fade-in">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Processing...</span>
        </div>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  );
};
