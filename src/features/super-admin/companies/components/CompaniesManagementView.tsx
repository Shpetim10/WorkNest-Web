"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Ban,
  Building2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  MoreVertical,
  Search,
  XCircle,
} from 'lucide-react';
import { CompanyManagementRow, CompanyManagementStatus } from '../types';
import { CompanyDetailsModal } from './CompanyDetailsModal';
import { SuspendCompanyModal } from './SuspendCompanyModal';

const TABLE_HEADERS = ['Company Name', 'Legal Name', 'NIPT', 'Email', 'Plan', 'Status', 'Created', 'Actions'];
const ITEMS_PER_PAGE = 5;
const STATUS_FILTERS = ['All statuses', 'Active', 'Suspended'] as const;
const PLAN_FILTERS = ['All plans', 'Starter', 'Professional', 'Enterprise'] as const;

const COMPANY_ROWS: CompanyManagementRow[] = [];

function statusBadge(status: CompanyManagementStatus) {
  const isActive = status === 'active';
  const Icon = isActive ? CheckCircle2 : XCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        isActive ? 'bg-[#00C95033] text-[#008F45]' : 'bg-[#EF444433] text-[#DC2626]'
      }`}
    >
      <Icon size={12} strokeWidth={2.4} />
      {isActive ? 'active' : 'suspended'}
    </span>
  );
}

function SelectField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none h-8 pl-3 pr-8 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

function CompaniesPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) return [1, 2, 3, '...', totalPages - 1, totalPages];
    if (currentPage >= totalPages - 2) return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="flex w-full justify-center pt-2">
      <div className="flex items-center gap-3 rounded-[10px] bg-white px-3 py-2 shadow-[0_4px_10px_rgba(15,23,42,0.18)]">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex h-7 min-w-[82px] items-center justify-center gap-0.5 rounded-lg bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] px-3 text-[12px] font-medium leading-none text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronLeft size={13} strokeWidth={1.9} />
          Previous
        </button>

        <div className="flex items-center gap-1.5">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-1 text-[12px] font-medium leading-none text-[#00A3D9]">
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`flex h-7 min-w-7 items-center justify-center rounded-md text-[12px] font-medium leading-none transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] px-2 text-white shadow-[0_3px_7px_rgba(43,127,255,0.22)]'
                    : 'px-2 text-[#00A3D9] hover:bg-[#EAF4FF]'
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex h-7 min-w-[74px] items-center justify-center gap-0.5 rounded-lg bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] px-3 text-[12px] font-medium leading-none text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
          <ChevronRight size={13} strokeWidth={1.9} />
        </button>
      </div>
    </div>
  );
}

export function CompaniesManagementView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('All statuses');
  const [planFilter, setPlanFilter] = useState<(typeof PLAN_FILTERS)[number]>('All plans');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [detailsCompany, setDetailsCompany] = useState<CompanyManagementRow | null>(null);
  const [suspendCompany, setSuspendCompany] = useState<CompanyManagementRow | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return COMPANY_ROWS.filter((company) => {
      const matchesSearch =
        !query ||
        company.companyName.toLowerCase().includes(query) ||
        company.legalName.toLowerCase().includes(query) ||
        company.email.toLowerCase().includes(query) ||
        company.nipt.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === 'All statuses' || company.status === statusFilter.toLowerCase();
      const matchesPlan = planFilter === 'All plans' || company.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [planFilter, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const visibleRows = filteredRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const resetPage = () => setCurrentPage(1);

  useEffect(() => {
    if (!openDropdownId) return;

    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const clickedTrigger = target?.closest(`[data-company-dropdown-trigger="${openDropdownId}"]`);

      if (!clickedTrigger && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdownId]);

  useEffect(() => {
    if (!openDropdownId) return;

    const handleViewportChange = () => {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    };

    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);

    return () => {
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [openDropdownId]);

  const handleDropdownToggle = (event: React.MouseEvent<HTMLButtonElement>, companyId: string) => {
    if (openDropdownId === companyId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setOpenDropdownId(companyId);
    setDropdownPosition({
      top: rect.bottom + 8,
      left: rect.right - 192,
    });
  };

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4">
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between cursor-pointer group"
        style={{
          background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
          minHeight: 120,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Building2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Companies Management</h1>
            <p className="text-white/80 text-sm mt-0.5">Platform-level company administration</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
      </div>

      <div
        className="bg-white rounded-xl border border-gray-100 px-4 py-1.5 flex flex-wrap gap-3 items-center min-h-[48px]"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <div className="relative w-full max-w-[340px] md:max-w-[420px] lg:max-w-[500px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies locally..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              resetPage();
            }}
            className="w-full h-8 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <SelectField
            value={statusFilter}
            options={STATUS_FILTERS}
            onChange={(value) => {
              setStatusFilter(value as (typeof STATUS_FILTERS)[number]);
              resetPage();
            }}
          />
          <SelectField
            value={planFilter}
            options={PLAN_FILTERS}
            onChange={(value) => {
              setPlanFilter(value as (typeof PLAN_FILTERS)[number]);
              resetPage();
            }}
          />
          <button
            type="button"
            onClick={resetPage}
            className="h-8 px-6 bg-[#2B7FFF] text-white text-[13px] font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Apply
          </button>
        </div>
      </div>

      <div
        className="bg-white rounded-2xl border border-[#2B7FFF] overflow-hidden mt-2"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-xs font-semibold uppercase tracking-wide text-white"
                style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
              >
                {TABLE_HEADERS.map((header) => (
                  <th key={header} className="px-4 py-3.5 text-left font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white text-left">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-[14px] font-medium text-gray-400">
                    No companies found
                  </td>
                </tr>
              ) : (
                visibleRows.map((company, index) => (
                  <tr
                    key={company.id}
                    className={`group cursor-pointer border-b border-[#E5E7EB] transition-colors hover:bg-blue-50/30 ${
                      index % 2 === 1 ? 'bg-gray-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <p className="whitespace-nowrap text-[15px] font-medium text-gray-800">
                          {company.companyName}
                        </p>
                        <p className="text-[11px] font-medium uppercase text-gray-400">{company.countryCode}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-600 font-[Inter,sans-serif]">{company.legalName}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[12px] font-medium text-gray-700">
                        {company.nipt}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-600 font-[Inter,sans-serif]">{company.email}</td>
                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-600 font-[Inter,sans-serif]">{company.plan}</td>
                    <td className="px-4 py-3.5">{statusBadge(company.status)}</td>
                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-600 font-[Inter,sans-serif]">{company.createdAt}</td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        title="Company actions"
                        data-company-dropdown-trigger={company.id}
                        onClick={(event) => handleDropdownToggle(event, company.id)}
                        className={`rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC] ${
                          openDropdownId === company.id ? 'bg-blue-50 text-[#155DFC]' : ''
                        }`}
                      >
                        <MoreVertical size={17} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CompaniesPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {openDropdownId && dropdownPosition && (() => {
        const activeCompany = visibleRows.find((company) => company.id === openDropdownId);
        if (!activeCompany) return null;

        return createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[260] w-48 overflow-hidden rounded-xl border border-[#DDE8F8] bg-white py-1 shadow-[0_14px_34px_rgba(15,23,42,0.13)] animate-in fade-in zoom-in-95 duration-150"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <button
              type="button"
              onClick={() => {
                setDetailsCompany(activeCompany);
                setOpenDropdownId(null);
                setDropdownPosition(null);
              }}
              className="flex h-10 w-full items-center gap-3 px-4 text-left text-[13px] font-medium text-[#1F2937] transition-colors hover:bg-[#F6F9FF] hover:text-[#155DFC]"
            >
              <Eye size={15} strokeWidth={2.1} className="shrink-0 text-[#155DFC]" />
              <span>View Details</span>
            </button>

            <div className="mx-3 h-px bg-[#EEF2F7]" />

            <button
              type="button"
              onClick={() => {
                setSuspendCompany(activeCompany);
                setOpenDropdownId(null);
                setDropdownPosition(null);
              }}
              className="flex h-10 w-full items-center gap-3 px-4 text-left text-[13px] font-medium text-[#B45309] transition-colors hover:bg-[#FFF7ED] hover:text-[#C2410C]"
            >
              <Ban size={15} strokeWidth={2.1} className="shrink-0 text-[#F59E0B]" />
              <span>{activeCompany.status === 'suspended' ? 'Unsuspend' : 'Suspend'}</span>
            </button>
          </div>,
          document.body,
        );
      })()}

      <CompanyDetailsModal
        isOpen={!!detailsCompany}
        company={detailsCompany}
        onClose={() => setDetailsCompany(null)}
      />

      <SuspendCompanyModal
        isOpen={!!suspendCompany}
        company={suspendCompany}
        onClose={() => setSuspendCompany(null)}
      />
    </div>
  );
}
