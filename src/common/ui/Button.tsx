"use client";

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { useI18n } from '@/common/i18n';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive';
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
  const { t } = useI18n();
  const isDisabled = disabled || isLoading;

  const baseStyle = "flex items-center justify-center gap-2 transition-all duration-200 font-bold relative";
  
  const widthStyle = fullWidth ? "w-full py-3.5 rounded-xl text-[15px]" : "px-6 py-2.5 rounded-[10px] text-[13px] w-auto shrink-0";

  const primaryStyle = "text-white shadow-[0_4px_12px_-2px_rgba(43,127,255,0.3)] bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7]";
  const primaryHover = "hover:brightness-110 hover:shadow-[0_8px_20px_-4px_rgba(21,93,252,0.4)] hover:-translate-y-[1px] active:scale-[0.98]";
  
  const secondaryStyle = "bg-[#f4f7fb] text-gray-800 hover:bg-[#e2e8f0]";
  
  const destructiveStyle = "bg-[#EF4444] text-white shadow-md shadow-red-500/10 hover:bg-[#DC2626] hover:shadow-red-500/20";
  
  const disabledStyle = "opacity-60 cursor-not-allowed grayscale-[0.5]";

  const combinedClassName = `
    ${baseStyle} 
    ${widthStyle} 
    ${isDisabled ? disabledStyle : 'cursor-pointer'}
    ${variant === 'primary' ? primaryStyle : variant === 'secondary' ? secondaryStyle : destructiveStyle} 
    ${!isDisabled && (variant === 'primary' || variant === 'destructive') ? primaryHover : ''}
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
          <span>{t('common.feedback.processing')}</span>
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
