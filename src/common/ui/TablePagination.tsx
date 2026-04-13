"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: TablePaginationProps) {
  
  if (totalPages <= 1) return null;

  // Logic to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5; // Adjustment to handle smaller datasets better

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Logic for > 7 pages
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={`flex items-center justify-center gap-4 py-4 w-full ${className}`}>
      {/* Previous Button */}
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex items-center gap-1 text-[14px] font-medium text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-[Inter,sans-serif]"
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((n, idx) => {
          if (n === "...") {
            return (
              <span key={`ell-${idx}`} className="px-2 text-[13px] text-gray-300 font-[Inter,sans-serif]">
                ...
              </span>
            );
          }

          const pageNum = n as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`h-8 w-8 rounded-full text-[13px] font-medium transition-colors flex items-center justify-center font-[Inter,sans-serif] ${
                isActive 
                  ? 'bg-[#155DFC] font-bold text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 text-[14px] font-medium text-[#155DFC] transition-colors hover:text-[#0c47c5] disabled:opacity-50 disabled:cursor-not-allowed font-[Inter,sans-serif]"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
