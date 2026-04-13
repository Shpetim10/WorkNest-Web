"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
}: DeleteConfirmationModalProps) {
  
  // Escape key closes the modal
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[250] bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[251] flex items-center justify-center p-4"
      >
        <div
          className="relative flex flex-col w-full max-w-[420px] rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_24px_48px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <X size={20} strokeWidth={2.2} />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-2 mb-8">
            <h2 className="text-[20px] font-bold text-gray-900 font-[Inter,sans-serif]">
              {title}
            </h2>
            <p className="text-[14px] leading-[22px] text-gray-500 font-[Inter,sans-serif]">
              {message} {itemName && (
                <span className="font-bold text-gray-900">"{itemName}"</span>
              )}? This action cannot be undone.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-gray-200 bg-white text-[14px] font-semibold text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 font-[Inter,sans-serif]"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-11 rounded-xl bg-red-600 text-[14px] font-semibold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 font-[Inter,sans-serif]"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
