"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X } from 'lucide-react';
import { AnnouncementListResponse } from '../types';

interface Props {
  announcement: AnnouncementListResponse | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteAnnouncementModal({ announcement, isLoading, onClose, onConfirm }: Props) {
  if (!announcement) return null;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 flex items-center justify-between bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <Trash2 size={18} className="text-red-600" />
            </div>
            <h2 className="text-base font-bold text-gray-800">Delete Announcement</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-800">&ldquo;{announcement.title}&rdquo;</span>?
          </p>
          <p className="text-xs text-gray-400">
            This action cannot be undone. All associated read records will be permanently removed.
          </p>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}