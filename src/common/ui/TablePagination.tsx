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
    <div className={`sticky bottom-6 z-20 flex w-full justify-center py-4 px-2 ${className}`}>
      <div className="relative group">
        {/* Animated gradient glow effect behind the pagination */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] rounded-[22px] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        
        <nav className="relative inline-flex max-w-full flex-wrap items-center justify-center gap-3 overflow-x-auto rounded-[20px] border border-white/40 bg-white/70 backdrop-blur-xl px-5 py-3 shadow-[0px_20px_40px_-12px_rgba(15,23,42,0.18),0px_8px_16px_-4px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.02]">
        {(safePageSize || safeTotalItems !== undefined) && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[#F5F9FF]/60 px-4 py-2 text-[12px] font-semibold text-[#4B5565] font-[Inter,sans-serif] ring-1 ring-[#D9E7FF]/40">
            {safePageSize && (
              <span className="inline-flex items-center gap-2">
                Rows
                {onPageSizeChange ? (
                  <div className="relative inline-block group">
                    <select
                      value={safePageSize}
                      onChange={(e) => onPageSizeChange(Number(e.target.value))}
                      className="appearance-none rounded-lg bg-white pl-2.5 pr-7 py-1 text-white shadow-[0px_2px_8px_rgba(21,93,252,0.15)] cursor-pointer focus:outline-none transition-all hover:shadow-[0px_4px_12px_rgba(21,93,252,0.25)] ring-1 ring-white/20"
                      style={{ background: gradient }}
                    >
                      {[5, 10, 15, 20, 25, 50, 100].map((size) => (
                        <option key={size} value={size} className="text-[#155DFC] bg-white">
                          {size}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none transition-transform group-hover:scale-110" />
                  </div>
                ) : (
                  <span className="rounded-lg bg-white px-2.5 py-1 text-[#155DFC] shadow-[inset_0_0_0_1px_rgba(21,93,252,0.1)]">
                    {safePageSize}
                  </span>
                )}
              </span>
            )}
            {safeTotalItems !== undefined && (
              <span className="text-[#6B7280] border-l border-[#D9E7FF] pl-3 ml-1">
                {safeTotalItems === 0 || rangeStart === undefined || rangeEnd === undefined
                  ? '0 items'
                  : `${rangeStart}-${rangeEnd} of ${safeTotalItems}`}
              </span>
            )}
          </div>
        )}

        <div className="h-6 w-px bg-[#D9E7FF] mx-1 hidden sm:block" />

        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={!canGoPrevious}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-[13px] font-bold text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100 font-[Inter,sans-serif] shadow-sm hover:brightness-105"
          style={{ background: gradient }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1.5 px-1">
          {pages.map((n, idx) => {
            if (n === "...") {
              return (
                <span key={`ell-${idx}`} className="px-1 text-[13px] font-bold text-[#0092D5] font-[Inter,sans-serif]">
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
                className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-[13px] font-bold transition-all active:scale-95 font-[Inter,sans-serif] ${
                  isActive
                    ? 'text-white shadow-[0px_4px_12px_rgba(21,93,252,0.25)] ring-1 ring-white/20'
                    : 'text-[#0092D5] hover:bg-[#F5F9FF] hover:text-[#2B7FFF]'
                }`}
                style={isActive ? { background: gradient } : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, safeCurrentPage + 1))}
          disabled={!canGoNext}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-[13px] font-bold text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100 font-[Inter,sans-serif] shadow-sm hover:brightness-105"
          style={{ background: gradient }}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </nav>
      </div>
    </div>
  );
}
