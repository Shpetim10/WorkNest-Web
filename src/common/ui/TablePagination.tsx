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
  const pageCount = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), pageCount);

  // Logic to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i++) pages.push(i);
    } else {
      // Logic for > 7 pages
      if (safeCurrentPage <= 3) {
        pages.push(1, 2, 3, "...", pageCount - 1, pageCount);
      } else if (safeCurrentPage >= pageCount - 2) {
        pages.push(1, 2, "...", pageCount - 2, pageCount - 1, pageCount);
      } else {
        pages.push(1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", pageCount);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();
  const canGoPrevious = safeCurrentPage > 1;
  const canGoNext = safeCurrentPage < pageCount;
  const gradient = 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)';

  return (
    <div className={`flex w-full justify-center py-2 ${className}`}>
      <nav className="inline-flex max-w-full items-center gap-1.5 overflow-x-auto rounded-[10px] bg-white px-2.5 py-2 shadow-[0px_3px_10px_rgba(15,23,42,0.14)]">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={!canGoPrevious}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[13px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-35 font-[Inter,sans-serif]"
          style={{ background: gradient }}
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        {/* Page Numbers */}
        {pages.map((n, idx) => {
          if (n === "...") {
            return (
              <span key={`ell-${idx}`} className="px-1.5 text-[13px] font-semibold text-[#0092D5] font-[Inter,sans-serif]">
                ...
              </span>
            );
          }

          const pageNum = n as number;
          const isActive = pageNum === safeCurrentPage;

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-[13px] font-semibold transition-colors font-[Inter,sans-serif] ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-[#0092D5] hover:bg-blue-50'
              }`}
              style={isActive ? { background: gradient } : undefined}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, safeCurrentPage + 1))}
          disabled={!canGoNext}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[13px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-35 font-[Inter,sans-serif]"
          style={{ background: gradient }}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </nav>
    </div>
  );
}
