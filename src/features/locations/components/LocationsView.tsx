"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, Button, TablePagination } from '@/common/ui';
import { Check, ChevronDown, Edit3, Eye, Loader2, MapPin, Network, Plus, Power, Search, Settings, Trash2 } from 'lucide-react';
import { SITES_LIST_UNAVAILABLE_MESSAGE, useLocations } from '../api';
import { LocationListItem, SiteStatus, SiteType } from '../types';
import { AddLocationModal } from './AddLocationModal';
import { LocationDetailsModal } from './LocationDetailsModal';
import { EditLocationModal } from './EditLocationModal';
import { DeactivateLocationModal } from './DeactivateLocationModal';
import { ActivateLocationModal } from './ActivateLocationModal';
import { DeleteLocationModal } from './DeleteLocationModal';

const SITE_TYPE_OPTIONS: Array<SiteType | 'All'> = ['All', 'FIELD_ZONE', 'BRANCH', 'WAREHOUSE', 'HQ', 'CLIENT_SITE', 'STORE'];
const SITE_STATUS_OPTIONS: Array<SiteStatus | 'All'> = ['All', 'PENDING_REVIEW', 'ACTIVE', 'DISABLED', 'ARCHIVED', 'DRAFT'];
const ITEMS_PER_PAGE = 10;

function formatDate(dateString: string) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function statusLabel(status: SiteStatus) {
  switch (status) {
    case 'PENDING_REVIEW': return 'Pending Review';
    case 'DRAFT': return 'Draft';
    case 'ACTIVE': return 'Active';
    case 'DISABLED': return 'Disabled';
    case 'ARCHIVED': return 'Archived';
    case 'INACTIVE': return 'Inactive';
    default: return status;
  }
}

function getTypeBadgeStyles(type: SiteType) {
  switch (type) {
    case 'HQ': return 'bg-[#E8F1FF] text-[#155DFC]';
    case 'BRANCH': return 'bg-[#E6FFFA] text-[#00C950]';
    case 'WAREHOUSE': return 'bg-[#FFF3E0] text-[#E65100]';
    case 'STORE': return 'bg-[#F0FDF4] text-[#008236]';
    case 'CLIENT_SITE': return 'bg-indigo-50 text-indigo-700';
    case 'FIELD_ZONE': return 'bg-orange-50 text-orange-700';
    default: return 'bg-gray-100 text-gray-500';
  }
}

function getStatusBadgeStyles(status: SiteStatus) {
  if (status === 'ACTIVE') return 'bg-[#F0FDF4] text-[#008236]';
  return 'bg-[#FFF7ED] text-[#CA3500]';
}

export function LocationsView() {
  const [companyId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : localStorage.getItem('current_company_id'),
  );
  const { data, isLoading, isError } = useLocations(companyId);
  const listUnavailable = data?.listUnavailable ?? false;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<SiteType | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<SiteStatus | 'All'>('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedStatus]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEditSiteId, setSelectedEditSiteId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDeactivateLocation, setSelectedDeactivateLocation] = useState<LocationListItem | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedActivateLocation, setSelectedActivateLocation] = useState<LocationListItem | null>(null);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [selectedDeleteLocation, setSelectedDeleteLocation] = useState<LocationListItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [openEditMenuRowId, setOpenEditMenuRowId] = useState<string | null>(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null);
  const [editStep, setEditStep] = useState<number>(1);
  const [isStandaloneEdit, setIsStandaloneEdit] = useState(false);

  useEffect(() => {
    const handleClose = () => { if (openEditMenuRowId) { setOpenEditMenuRowId(null); setMenuAnchorRect(null); } };
    window.addEventListener('keydown', (e) => e.key === 'Escape' && handleClose());
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('keydown', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [openEditMenuRowId]);

  const filteredLocations = useMemo(() => {
    const locations = data?.items ?? [];
    return locations.filter((location) => {
      const ms = location.siteName.toLowerCase().includes(searchQuery.toLowerCase()) || location.siteCode.toLowerCase().includes(searchQuery.toLowerCase());
      const mt = selectedType === 'All' || location.siteType === selectedType;
      const mst = selectedStatus === 'All' || location.status === selectedStatus;
      return ms && mt && mst;
    });
  }, [data?.items, searchQuery, selectedStatus, selectedType]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredLocations.length / ITEMS_PER_PAGE);
  const paginatedLocations = filteredLocations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const TABLE_HEADERS = ['Site Name', 'Site Code', 'Site Type', 'Country', 'Status', 'Created At', 'Actions'];

  return (
    <div className="animate-in slide-in-from-bottom-2 w-full space-y-8 duration-500 fade-in pb-10">
      
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="font-[Inter,sans-serif] text-[35px] font-semibold leading-[36px] text-[#1E2939]">Locations</h1>
          <p className="font-[Inter,sans-serif] text-[16px] font-normal leading-[24px] text-[#4A5565]">
            Manage your company locations and geofencing settings
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} strokeWidth={2.5} />}
          iconPosition="left"
          onClick={() => setIsAddModalOpen(true)}
          className="h-11 min-w-[180px] rounded-xl bg-gradient-to-r from-[#155DFC] to-[#01c951] px-6 shadow-md hover:shadow-lg hover:shadow-[#155dfc]/20"
        >
          Add Location
        </Button>
      </div>

      {/* Filters section */}
      <Card className="rounded-[24px] border-0 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={18} strokeWidth={2} />
            </div>
            <input
              type="text"
              placeholder="Search by site name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 pr-4 text-[13.5px] font-medium text-gray-700 transition-all placeholder:text-gray-400 focus:border-[#155dfc]/40 focus:outline-none focus:ring-2 focus:ring-[#155dfc]/10"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="relative min-w-[160px]">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as SiteType | 'All')}
                className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 pl-4 pr-10 text-[13.5px] font-semibold text-gray-600 outline-none transition-all focus:border-[#155dfc]/40"
              >
                {SITE_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All Types' : option.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
            </div>

            <div className="relative min-w-[160px]">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as SiteStatus | 'All')}
                className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 pl-4 pr-10 text-[13.5px] font-semibold text-gray-600 outline-none transition-all focus:border-[#155dfc]/40"
              >
                {SITE_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All Statuses' : statusLabel(option)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
            </div>
          </div>
        </div>
      </Card>

      {/* Unavailable Message */}
      {!isLoading && !isError && companyId && listUnavailable && (
        <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-5 py-4 text-[13px] font-medium text-amber-800">
          {SITES_LIST_UNAVAILABLE_MESSAGE}
        </div>
      )}

      {/* Table Container */}
      <Card className="overflow-hidden rounded-[24px] border border-[#155DFC]/30 p-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#E8F1FF]/50 text-left">
                {TABLE_HEADERS.map((header) => (
                  <th
                    key={header}
                    className="whitespace-nowrap px-6 py-4 font-[Inter,sans-serif] text-[12px] font-semibold uppercase leading-[16px] tracking-[0.06em] text-[#4A5565]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] bg-white text-left">
              {isLoading ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#155DFC]" />
                      <p className="text-[14px] font-medium text-gray-500 font-[Inter,sans-serif]">Loading locations...</p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center text-red-500 font-[Inter,sans-serif]">
                    <p className="text-[14px] font-medium">Failed to load locations</p>
                  </td>
                </tr>
              ) : paginatedLocations.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center text-gray-400 font-[Inter,sans-serif]">
                    <p className="text-[14px] font-medium">No locations found</p>
                  </td>
                </tr>
              ) : (
                paginatedLocations.map((location) => (
                  <tr
                    key={location.id}
                    onClick={() => { setSelectedSiteId(location.id); setIsDetailsModalOpen(true); }}
                    className="group cursor-pointer transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#155DFC]">
                          <MapPin size={18} strokeWidth={2.5} />
                        </div>
                        <span className="text-[16px] font-semibold text-[#1E2939] font-[Inter,sans-serif] whitespace-nowrap">{location.siteName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] font-normal text-[#4A5565] font-[Inter,sans-serif]">{location.siteCode}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`rounded-lg px-3 py-1.5 text-[12px] font-bold font-[Inter,sans-serif] ${getTypeBadgeStyles(location.siteType)}`}>
                        {location.siteType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] font-normal text-[#4A5565] font-[Inter,sans-serif]">{location.country}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center rounded-full px-3.5 py-1 text-[11px] font-bold font-[Inter,sans-serif] ${getStatusBadgeStyles(location.status)}`}>
                        <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                        {statusLabel(location.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] font-normal text-[#4A5565] font-[Inter,sans-serif]">{formatDate(location.createdAt)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedSiteId(location.id); setIsDetailsModalOpen(true); }}
                          title="View Details"
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC]"
                        >
                          <Eye size={18} />
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openEditMenuRowId === location.id) { setOpenEditMenuRowId(null); setMenuAnchorRect(null); }
                              else { setOpenEditMenuRowId(location.id); setMenuAnchorRect(e.currentTarget.getBoundingClientRect()); }
                            }}
                            title="Edit Options"
                            className={`rounded-lg p-2 transition-all ${openEditMenuRowId === location.id ? 'bg-blue-50 text-[#155DFC]' : 'text-gray-400 hover:bg-blue-50 hover:text-[#155DFC]'}`}
                          >
                            <Edit3 size={18} />
                          </button>
                          {openEditMenuRowId === location.id && menuAnchorRect && createPortal(
                            <>
                              <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); setOpenEditMenuRowId(null); setMenuAnchorRect(null); }} />
                              <div
                                className="fixed z-[70] min-w-[200px] overflow-hidden rounded-[10px] border border-[#155DFC] bg-white py-1 animate-in fade-in zoom-in-95 duration-100"
                                style={{
                                  top: menuAnchorRect.bottom + 4,
                                  left: menuAnchorRect.right - 200,
                                  boxShadow: `0px 9px 28px 8px rgba(0,0,0,0.10), 0px 3px 6px -4px rgba(0,0,0,0.24), 0px 6px 16px rgba(0,0,0,0.35)`
                                }}
                              >
                                {[{ id: 1, label: 'Details', icon: Settings }, { id: 2, label: 'Location', icon: MapPin }, { id: 3, label: 'Network', icon: Network }].map((opt) => (
                                  <button
                                    key={opt.id}
                                    onClick={(e) => {
                                      e.stopPropagation(); setSelectedEditSiteId(location.id); setEditStep(opt.id); setIsStandaloneEdit(true); setIsEditModalOpen(true); setOpenEditMenuRowId(null); setMenuAnchorRect(null);
                                    }}
                                    className="flex h-10 w-full items-center gap-2.5 px-4 pr-6 text-left text-[14px] font-medium leading-[22px] text-gray-700 transition-colors hover:bg-[rgba(43,127,255,0.30)] font-[Inter,sans-serif]"
                                  >
                                    <opt.icon size={16} className="text-[#155DFC]" />
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </>,
                            document.body
                          )}
                        </div>
                        {location.status === 'ACTIVE' ? (
                          <button onClick={(e) => { e.stopPropagation(); setSelectedDeactivateLocation(location); setIsDeactivateModalOpen(true); }} title="Disable Site" className="rounded-lg p-2 text-gray-400 transition-all hover:bg-amber-50 hover:text-amber-500">
                            <Power size={18} />
                          </button>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setSelectedActivateLocation(location); setIsActivateModalOpen(true); }} title="Activate Site" className="rounded-lg p-2 text-gray-400 transition-all hover:bg-emerald-50 hover:text-emerald-500">
                            <Check size={18} />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setSelectedDeleteLocation(location); setIsDeleteModalOpen(true); }} title="Delete Site" className="rounded-lg p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination Footer */}
      <TablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <AddLocationModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} companyId={companyId} onCompleted={() => setIsAddModalOpen(false)} />
      <LocationDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} siteId={selectedSiteId} companyId={companyId} />
      <EditLocationModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} siteId={selectedEditSiteId} companyId={companyId} initialStep={editStep} isStandalone={isStandaloneEdit} onCompleted={() => setIsEditModalOpen(false)} />
      <DeactivateLocationModal isOpen={isDeactivateModalOpen} onClose={() => setIsDeactivateModalOpen(false)} siteId={selectedDeactivateLocation?.id || null} companyId={companyId} locationName={selectedDeactivateLocation?.siteName || ''} />
      <ActivateLocationModal isOpen={isActivateModalOpen} onClose={() => setIsActivateModalOpen(false)} siteId={selectedActivateLocation?.id || null} companyId={companyId} locationName={selectedActivateLocation?.siteName || ''} />
      <DeleteLocationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} siteId={selectedDeleteLocation?.id || null} companyId={companyId} locationName={selectedDeleteLocation?.siteName || ''} />
    </div>
  );
}
