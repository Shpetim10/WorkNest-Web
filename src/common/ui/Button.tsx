import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  fullWidth = false,
  icon,
  iconPosition = 'right',
  className = '',
  children,
  ...props
}: ButtonProps) => {
  const baseStyle = "flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer font-bold relative";

  const widthStyle = fullWidth ? "w-full py-3.5 rounded-xl text-[15px]" : "px-6 py-2.5 rounded-[10px] text-[13px] w-auto shrink-0";

  const primaryStyle = "text-white shadow-md hover:shadow-lg hover:-translate-y-[1px] bg-gradient-to-r from-[#0066FF] to-[#00C853]";
  const secondaryStyle = "bg-[#f4f7fb] text-gray-800 hover:bg-[#e2e8f0]";

  const combinedClassName = `${baseStyle} ${widthStyle} ${variant === 'primary' ? primaryStyle : secondaryStyle} ${className}`;

  return (
    <button className={combinedClassName} {...props}>
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </button>
  );
};
