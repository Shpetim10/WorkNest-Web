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
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4">
      
      {/* ── Page Header Card ───────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between cursor-pointer group"
        onClick={() => setIsAddModalOpen(true)}
        style={{
          background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
          minHeight: 120,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <MapPin size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Locations</h1>
            <p className="text-white/80 text-sm mt-0.5">
              Manage your company locations and geofencing settings
            </p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform">
          <Plus size={28} className="text-white" />
        </div>
        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
      </div>

      {/* ── Search / Filter Bar ────────────────────────────────────────── */}
      <div 
        className="bg-white rounded-xl border border-gray-100 px-4 py-1.5 flex flex-col lg:flex-row gap-4 items-center min-h-[48px]"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <div className="relative w-full max-w-[340px] md:max-w-[420px] lg:max-w-[500px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by site name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-[13px] font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
          />
        </div>

        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <div className="relative min-w-[140px]">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as SiteType | 'All')}
              className="h-8 w-full appearance-none rounded-lg border border-gray-100 bg-gray-50 pl-3 pr-8 text-[12px] font-semibold text-gray-600 outline-none transition-all focus:border-blue-400/40"
            >
              {SITE_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All Types' : option.replace('_', ' ')}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
          </div>

          <div className="relative min-w-[140px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as SiteStatus | 'All')}
              className="h-8 w-full appearance-none rounded-lg border border-gray-100 bg-gray-50 pl-3 pr-8 text-[12px] font-semibold text-gray-600 outline-none transition-all focus:border-blue-400/40"
            >
              {SITE_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All Statuses' : statusLabel(option)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
          </div>
        </div>
      </div>

      {/* Unavailable Message */}
      {!isLoading && !isError && companyId && listUnavailable && (
        <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-5 py-4 text-[13px] font-medium text-amber-800">
          {SITES_LIST_UNAVAILABLE_MESSAGE}
        </div>
      )}

      {/* ── Table Container ────────────────────────────────────────────── */}
      <div 
        className="bg-white rounded-2xl border border-[#2B7FFF] overflow-hidden mt-2"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr 
                className="text-xs font-semibold text-white uppercase tracking-wide"
                style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
              >
                {TABLE_HEADERS.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3.5 text-left font-semibold whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
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
                paginatedLocations.map((location, index) => (
                  <tr
                    key={location.id}
                    onClick={() => { setSelectedSiteId(location.id); setIsDetailsModalOpen(true); }}
                    className={`border-b border-[#E5E7EB] group transition-colors hover:bg-blue-50/30 cursor-pointer ${
                      index % 2 === 1 ? 'bg-gray-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#155DFC]">
                          <MapPin size={16} strokeWidth={2.5} />
                        </div>
                        <span className="text-[15px] font-medium text-gray-800 whitespace-nowrap">{location.siteName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[14px] font-normal text-gray-600 font-[Inter,sans-serif]">{location.siteCode}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getTypeBadgeStyles(location.siteType)}`}>
                        {location.siteType.replace('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {location.country}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusBadgeStyles(location.status)}`}>
                        {statusLabel(location.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-[14px]">
                      {formatDate(location.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
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
      </div>

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
