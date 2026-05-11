"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
  className?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems,
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
  const safeTotalItems = typeof totalItems === 'number' ? Math.max(0, totalItems) : undefined;
  const safePageSize = typeof pageSize === 'number' && pageSize > 0 ? pageSize : undefined;
  const rangeStart =
    safeTotalItems && safePageSize ? (safeCurrentPage - 1) * safePageSize + 1 : undefined;
  const rangeEnd =
    safeTotalItems !== undefined && safePageSize
      ? Math.min(safeTotalItems, safeCurrentPage * safePageSize)
      : undefined;

  return (
    <div className={`flex w-full justify-center py-2 ${className}`}>
      <nav className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 overflow-x-auto rounded-[14px] border border-[#D9E7FF] bg-white px-3 py-2 shadow-[0px_6px_18px_rgba(15,23,42,0.12)]">
        {(safePageSize || safeTotalItems !== undefined) && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#F5F9FF] px-3 py-1.5 text-[12px] font-semibold text-[#4B5565] font-[Inter,sans-serif]">
            {safePageSize && (
              <span className="inline-flex items-center gap-1.5">
                Page size
                {onPageSizeChange ? (
                  <div className="relative inline-block group">
                    <select
                      value={safePageSize}
                      onChange={(e) => onPageSizeChange(Number(e.target.value))}
                      className="appearance-none rounded-lg bg-white pl-2 pr-6 py-0.5 text-white shadow-[0px_2px_6px_rgba(21,93,252,0.1)] cursor-pointer focus:outline-none transition-all hover:shadow-[0px_4px_10px_rgba(21,93,252,0.15)]"
                      style={{ background: gradient }}
                    >
                      {[5, 10, 15, 20, 25, 50, 100].map((size) => (
                        <option key={size} value={size} className="text-[#155DFC] bg-white">
                          {size}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white pointer-events-none transition-transform group-hover:scale-110" />
                  </div>
                ) : (
                  <span className="rounded-lg bg-white px-2 py-0.5 text-[#155DFC] shadow-[inset_0_0_0_1px_rgba(21,93,252,0.08)]">
                    {safePageSize}
                  </span>
                )}
              </span>
            )}
            {safeTotalItems !== undefined && (
              <span className="text-[#6B7280]">
                {safeTotalItems === 0 || rangeStart === undefined || rangeEnd === undefined
                  ? '0 items'
                  : `${rangeStart}-${rangeEnd} of ${safeTotalItems}`}
              </span>
            )}
          </div>
        )}

        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={!canGoPrevious}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-[13px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-35 font-[Inter,sans-serif]"
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
          className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-[13px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-35 font-[Inter,sans-serif]"
          style={{ background: gradient }}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </nav>
    </div>
  );
}
