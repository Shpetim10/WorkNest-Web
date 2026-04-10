"use client";

import React, { useMemo, useState } from 'react';
import { Card, Button } from '@/common/ui';
import { Edit2, Eye, Filter, Loader2, MapPin, Plus, Power, Search } from 'lucide-react';
import { SITES_LIST_UNAVAILABLE_MESSAGE, useLocations } from '../api';
import { LocationListItem, SiteStatus, SiteType } from '../types';
import { AddLocationModal } from './AddLocationModal';
import { LocationDetailsModal } from './LocationDetailsModal';
import { EditLocationModal } from './EditLocationModal';
import { DeactivateLocationModal } from './DeactivateLocationModal';

const SITE_TYPE_OPTIONS: Array<SiteType | 'All'> = ['All', 'OFFICE', 'HQ', 'BRANCH', 'WAREHOUSE', 'STORE', 'CLIENT_SITE', 'FIELD_ZONE'];
const SITE_STATUS_OPTIONS: Array<SiteStatus | 'All'> = ['All', 'DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED'];

function formatDate(dateString: string) {
  if (!dateString) {
    return '-';
  }

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
    case 'DRAFT':
      return 'Draft';
    case 'ACTIVE':
      return 'Active';
    case 'DISABLED':
      return 'Disabled';
    case 'ARCHIVED':
      return 'Archived';
  }
}

function getTypeBadgeStyles(type: SiteType) {
  switch (type) {
    case 'OFFICE':
      return 'bg-[#e0f2fe] text-[#0369a1]';
    case 'HQ':
      return 'bg-[#dbeafe] text-[#1d4ed8]';
    case 'BRANCH':
      return 'bg-[#dcfce7] text-[#15803d]';
    case 'WAREHOUSE':
      return 'bg-[#fef3c7] text-[#b45309]';
    case 'STORE':
      return 'bg-[#fae8ff] text-[#a21caf]';
    case 'CLIENT_SITE':
      return 'bg-[#ede9fe] text-[#6d28d9]';
    case 'FIELD_ZONE':
      return 'bg-[#fee2e2] text-[#b91c1c]';
  }
}

function getStatusBadgeStyles(status: SiteStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-600';
    case 'DRAFT':
      return 'bg-amber-50 text-amber-700';
    case 'DISABLED':
      return 'bg-slate-100 text-slate-600';
    case 'ARCHIVED':
      return 'bg-rose-50 text-rose-600';
  }
}

export function LocationsView() {
  const [companyId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null,
  );
  const { data: locations, isLoading, isError } = useLocations(companyId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<SiteType | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<SiteStatus | 'All'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEditSiteId, setSelectedEditSiteId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDeactivateLocation, setSelectedDeactivateLocation] = useState<LocationListItem | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  const filteredLocations = useMemo(() => {
    if (!locations) return [];

    return locations.filter((location) => {
      const matchesSearch =
        location.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.siteCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'All' || location.siteType === selectedType;
      const matchesStatus = selectedStatus === 'All' || location.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [locations, searchQuery, selectedStatus, selectedType]);

  const tableHeaders = ['Site Name', 'Site Code', 'Site Type', 'Country', 'Status', 'Created At', 'Actions'];

  const handleViewLocation = (location: LocationListItem) => {
    setSelectedSiteId(location.id);
    setIsDetailsModalOpen(true);
  };

  const handleEditLocation = (location: LocationListItem) => {
    setSelectedEditSiteId(location.id);
    setIsEditModalOpen(true);
  };

  return (
    <div className="animate-in slide-in-from-bottom-2 w-full space-y-8 duration-500 fade-in">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="font-sans text-[30px] font-bold leading-[36px] text-[#1E2939]">Locations</h1>
          <p className="font-sans text-[16px] font-normal leading-[24px] text-[#4A5565]">
            Manage site setup, geofencing, trusted networks, and activation readiness.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} strokeWidth={2.5} />}
          iconPosition="left"
          onClick={() => setIsAddModalOpen(true)}
          className="h-11 min-w-[180px] rounded-xl px-6 shadow-md"
        >
          Add Location
        </Button>
      </div>

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
            <div className="relative min-w-[180px]">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as SiteType | 'All')}
                className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-gray-100 bg-gray-50/50 pl-4 pr-10 text-[13.5px] font-semibold text-gray-600 outline-none transition-all focus:border-[#155dfc]/40"
              >
                {SITE_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All Types' : option.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>

            <div className="relative min-w-[180px]">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as SiteStatus | 'All')}
                className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-gray-100 bg-gray-50/50 pl-4 pr-10 text-[13.5px] font-semibold text-gray-600 outline-none transition-all focus:border-[#155dfc]/40"
              >
                {SITE_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All Statuses' : statusLabel(option)}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
        </div>
      </Card>

      {!isLoading && !isError && companyId && filteredLocations.length === 0 && (
        <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-5 py-4 text-[13px] font-medium text-amber-800">
          {SITES_LIST_UNAVAILABLE_MESSAGE}
        </div>
      )}

      <Card className="overflow-hidden rounded-[24px] border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30">
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    className="whitespace-nowrap px-6 py-4 font-sans text-[12px] font-semibold uppercase leading-[16px] tracking-normal text-[#4A5565]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={tableHeaders.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#155DFC]" />
                      <p className="text-[14px] font-medium text-gray-500">Loading locations...</p>
                    </div>
                  </td>
                </tr>
              ) : !companyId ? (
                <tr>
                  <td colSpan={tableHeaders.length} className="px-6 py-20 text-center text-amber-700">
                    <p className="text-[14px] font-medium">No company context found. Please sign in again.</p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={tableHeaders.length} className="px-6 py-20 text-center text-red-500">
                    <p className="text-[14px] font-medium">Failed to load locations.</p>
                  </td>
                </tr>
              ) : filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={tableHeaders.length} className="px-6 py-20 text-center text-gray-400">
                    <p className="text-[14px] font-medium">No locations found.</p>
                  </td>
                </tr>
              ) : (
                filteredLocations.map((location) => (
                  <tr
                    key={location.id}
                    onClick={() => handleViewLocation(location)}
                    className="group cursor-pointer transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#155DFC]">
                          <MapPin size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                          <span className="text-[14px] font-bold text-[#1E2939]">{location.siteName}</span>
                          {location.blockingIssues.length > 0 && (
                            <p className="text-[12px] font-medium text-amber-700">
                              {location.blockingIssues.length} setup blocker{location.blockingIssues.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-semibold text-gray-500">{location.siteCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${getTypeBadgeStyles(location.siteType)}`}>
                        {location.siteType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-gray-600">{location.country}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold ${getStatusBadgeStyles(location.status)}`}>
                        <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                        {statusLabel(location.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-gray-400">{formatDate(location.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleViewLocation(location);
                          }}
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC]"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditLocation(location);
                          }}
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC]"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedDeactivateLocation(location);
                            setIsDeactivateModalOpen(true);
                          }}
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-rose-50 hover:text-rose-500"
                        >
                          <Power size={18} />
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

      <AddLocationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        companyId={companyId}
        onCompleted={() => setIsAddModalOpen(false)}
      />

      <LocationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        siteId={selectedSiteId}
        onEdit={(siteId) => {
          setIsDetailsModalOpen(false);
          setSelectedEditSiteId(siteId);
          setIsEditModalOpen(true);
        }}
      />

      <EditLocationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        siteId={selectedEditSiteId}
        onCompleted={() => setIsEditModalOpen(false)}
      />

      <DeactivateLocationModal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        onConfirm={() => setIsDeactivateModalOpen(false)}
        locationName={selectedDeactivateLocation?.siteName || ''}
      />
    </div>
  );
}
