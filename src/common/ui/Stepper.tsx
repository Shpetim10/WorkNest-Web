"use client";

import React from 'react';

interface Step {
  id: number;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className = '' }: StepperProps) {
  return (
    <div className={`flex w-full justify-center px-4 py-3 ${className}`}>
      <div className="flex w-full max-w-[620px] items-start">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className={`flex ${isLast ? '' : 'flex-1'} items-start`}>
              {/* Step & Label Group */}
              <div className="flex flex-col items-center relative z-10 w-24 flex-shrink-0">
                {/* Squircle Indicator */}
                <div 
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-[16px] font-black transition-all duration-300 shadow-sm ${
                    isActive 
                      ? 'bg-[#155DFC] text-white' 
                      : isCompleted
                        ? 'bg-[#EBF1FF] text-[#155DFC]'
                        : 'bg-[#F2F4F7] text-[#667085]'
                  }`}
                  style={{ 
                    backgroundColor: isActive ? '#155DFC' : isCompleted ? '#EBF1FF' : '#F2F4F7' 
                  }}
                >
                  {step.id}
                </div>
                
                {/* Label */}
                <span className={`mt-3 text-[12px] font-bold text-center whitespace-nowrap transition-colors duration-300 ${
                  isActive ? 'text-[#155DFC]' : 'text-[#667085]'
                }`}>
                  {step.label}
                </span>
              </div>

              {/* Connector Line (Vertically centered with the h-12 squircle) */}
              {!isLast && (
                <div className="flex-1 h-12 flex items-center min-w-[30px]">
                  <div 
                    className={`h-[2px] w-full transition-colors duration-500 rounded-full ${
                      isCompleted ? 'bg-[#155DFC]' : 'bg-[#EAECF0]'
                    }`} 
                    style={{
                      backgroundColor: isCompleted ? '#155DFC' : '#EAECF0'
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
