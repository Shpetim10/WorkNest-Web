"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Ban,
  Building2,
  CheckCircle2,
  ChevronDown,
  Eye,
  MoreVertical,
  Search,
  XCircle,
} from 'lucide-react';
import { PageHeaderDecorativeCircles, TablePagination } from '@/common/ui';
import { CompanyManagementRow, CompanyManagementStatus } from '../types';
import { useSuperAdminCompanies, useToggleSuspend } from '../api/use-super-admin-companies';
import { CompanyDetailsModal } from './CompanyDetailsModal';
import { SuspendCompanyModal } from './SuspendCompanyModal';
import { useI18n } from '@/common/i18n';

const TABLE_HEADER_KEYS = [
  'common.fields.companyName',
  'common.fields.legalName',
  'common.fields.nipt',
  'common.fields.email',
  'common.fields.plan',
  'tables.headers.status',
  'tables.headers.createdAt',
  'tables.headers.actions',
];
const STATUS_FILTERS = ['All statuses', 'Active', 'Suspended'] as const;
const PLAN_FILTERS = ['All plans', 'Starter', 'Professional', 'Enterprise'] as const;

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
      {isActive ? t('superAdmin.companies.active') : t('superAdmin.companies.suspended')}
    </span>
  );
}

function SelectField({
  value,
  options,
  getLabel,
  onChange,
}: {
  value: string;
  options: readonly string[];
  getLabel?: (value: string) => string;
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
          <option key={option} value={option}>
            {getLabel?.(option) ?? option}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

export function CompaniesManagementView() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('All statuses');
  const [planFilter, setPlanFilter] = useState<(typeof PLAN_FILTERS)[number]>('All plans');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [detailsCompany, setDetailsCompany] = useState<CompanyManagementRow | null>(null);
  const [suspendCompany, setSuspendCompany] = useState<CompanyManagementRow | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const apiStatus = statusFilter === 'All statuses' ? undefined : statusFilter.toLowerCase();

  const companiesQuery = useSuperAdminCompanies({
    search: debouncedSearch,
    status: apiStatus,
    page: currentPage - 1,
    size: pageSize,
  });

  const toggleSuspend = useToggleSuspend();

  const visibleRows = companiesQuery.data?.rows ?? [];
  const totalPages = companiesQuery.data?.totalPages ?? 1;
  const totalItems = companiesQuery.data?.total ?? 0;

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
        <PageHeaderDecorativeCircles />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Building2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{t('superAdmin.companies.managementTitle')}</h1>
            <p className="text-white/80 text-sm mt-0.5">{t('superAdmin.companies.subtitle')}</p>
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
            placeholder="Search companies..."
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              resetPage();
            }}
            className="w-full h-8 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <SelectField
            value={statusFilter}
            options={STATUS_FILTERS}
            getLabel={statusFilterLabel}
            onChange={(value) => {
              setStatusFilter(value as (typeof STATUS_FILTERS)[number]);
              resetPage();
            }}
          />
          <SelectField
            value={planFilter}
            options={PLAN_FILTERS}
            getLabel={planFilterLabel}
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
            {t('common.actions.apply')}
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
                {tableHeaders.map((header) => (
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
                    {t('superAdmin.companies.noCompanies')}
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
                    <td className="px-4 py-3.5">{statusBadge(company.status, t)}</td>
                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-600 font-[Inter,sans-serif]">{company.createdAt}</td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        title={t('superAdmin.companies.actions')}
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

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        totalItems={totalItems}
      />

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
              <span>{t('superAdmin.companies.viewDetails')}</span>
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
              <span>{activeCompany.status === 'suspended' ? t('superAdmin.companies.unsuspend') : t('superAdmin.companies.suspend')}</span>
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
        onConfirm={(reason) => {
          if (suspendCompany) {
            toggleSuspend.mutate({ companyId: suspendCompany.id, reason });
          }
        }}
      />
    </div>
  );
}
