"use client";

import React, { useState, useMemo } from 'react';
import { Card, Button } from '@/common/ui';
import { Plus, Search, Edit2, Trash2, Eye, MapPin, Power, Loader2, Filter } from 'lucide-react';
import { useLocations } from '../api';
import { SiteType, SiteStatus, Location } from '../types';
import { AddLocationModal } from './AddLocationModal';
import { LocationDetailsModal } from './LocationDetailsModal';
import { EditLocationModal } from './EditLocationModal';
import { DeactivateLocationModal } from './DeactivateLocationModal';

export function LocationsView() {
  const { data: locations, isLoading, isError, error } = useLocations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<SiteType | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<SiteStatus | 'All'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [selectedEditLocation, setSelectedEditLocation] = useState<Location | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [selectedDeactivateLocation, setSelectedDeactivateLocation] = useState<any | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  const filteredLocations = useMemo(() => {
    if (!locations) return [];
    
    return locations.filter(loc => {
      const matchesSearch = loc.siteName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           loc.siteCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'All' || loc.siteType === selectedType;
      const matchesStatus = selectedStatus === 'All' || loc.status === selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [locations, searchQuery, selectedType, selectedStatus]);

  const TABLE_HEADERS = [
    'Site Name',
    'Site Code',
    'Site Type',
    'Country',
    'Status',
    'Created At',
    'Actions'
  ];

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getTypeBadgeStyles = (type: SiteType) => {
    switch (type) {
      case 'On-site':
        return 'bg-[#e0f2fe] text-[#0369a1]';
      case 'Remote':
        return 'bg-[#f3e8ff] text-[#7e22ce]';
      case 'Hybrid':
        return 'bg-[#dcfce7] text-[#15803d]';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const handleViewLocation = (loc: any) => {
    const enrichedLocation: Location = enrichLocation(loc);
    setSelectedLocation(enrichedLocation);
    setIsDetailsModalOpen(true);
  };

  const handleEditLocation = (loc: any) => {
    const enrichedLocation: Location = enrichLocation(loc);
    setSelectedEditLocation(enrichedLocation);
    setIsEditModalOpen(true);
  };

  const handleOpenDeactivateModal = (loc: any) => {
    setSelectedDeactivateLocation(loc);
    setIsDeactivateModalOpen(true);
  };

  const handleConfirmDeactivation = () => {
    console.log('Deactivating location:', selectedDeactivateLocation?.siteName);
    setIsDeactivateModalOpen(false);
    // Future: API call to toggle status
  };

  function enrichLocation(loc: any): Location {
    return {
      ...loc,
      timezone: loc.timezone ?? '',
      notes: loc.notes ?? '',
      addressLine1: loc.addressLine1 ?? '',
      addressLine2: loc.addressLine2 ?? '',
      city: loc.city ?? '',
      geofenceRadius: loc.geofenceRadius ?? 100,
      advancedLocationSettings: loc.advancedLocationSettings ?? { 
        entryBuffer: 30, 
        exitBuffer: 30, 
        maxAccuracy: 50 
      },
      detectedIp: loc.detectedIp ?? '',
      networkName: loc.networkName ?? '',
      cidrBlock: loc.cidrBlock ?? '',
      networkType: loc.networkType ?? '',
      ipVersion: loc.ipVersion ?? 'IPv4',
      setExpiry: loc.setExpiry ?? false,
      expiryDate: loc.expiryDate ?? '',
      networkNotes: loc.networkNotes ?? '',
      priorityOverride: loc.priorityOverride ?? '1',
    };
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[30px] font-bold text-[#1E2939] leading-[36px] font-sans">Locations</h1>
          <p className="text-[16px] font-normal text-[#4A5565] leading-[24px] font-sans">
            Manage your company locations and geofencing settings
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} strokeWidth={2.5} />}
          iconPosition="left"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-[#155DFC] to-[#01c951] hover:shadow-lg hover:shadow-[#155dfc]/20 shadow-md h-11 rounded-xl px-6 min-w-[180px]"
        >
          Add Location
        </Button>
      </div>

      {/* Filters Row */}
      <Card className="p-4 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px]">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={18} strokeWidth={2} />
            </div>
            <input
              type="text"
              placeholder="Search by site name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-gray-50/50 border border-gray-100 rounded-xl text-[13.5px] font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#155dfc]/10 focus:border-[#155dfc]/40 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="relative min-w-[160px]">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full h-11 pl-4 pr-10 bg-gray-50/50 border border-gray-100 rounded-xl text-[13.5px] font-semibold text-gray-600 appearance-none outline-none focus:border-[#155dfc]/40 transition-all cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>

            <div className="relative min-w-[160px]">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full h-11 pl-4 pr-10 bg-gray-50/50 border border-gray-100 rounded-xl text-[13.5px] font-semibold text-gray-600 appearance-none outline-none focus:border-[#155dfc]/40 transition-all cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </Card>

      {/* Table Container */}
      <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-[24px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30">
                {TABLE_HEADERS.map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-[12px] font-semibold text-[#4A5565] leading-[16px] tracking-normal uppercase whitespace-nowrap font-sans"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-[#155DFC] animate-spin" />
                      <p className="text-[14px] font-medium text-gray-500">Loading locations...</p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center text-red-500">
                    <p className="text-[14px] font-medium">Failed to load locations</p>
                  </td>
                </tr>
              ) : filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center text-gray-400">
                    <p className="text-[14px] font-medium">No locations found</p>
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => (
                  <tr 
                    key={loc.id} 
                    onClick={() => handleViewLocation(loc)}
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#155DFC]">
                          <MapPin size={18} strokeWidth={2.5} />
                        </div>
                        <span className="text-[14px] font-bold text-[#1E2939]">{loc.siteName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-semibold text-gray-500">{loc.siteCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getTypeBadgeStyles(loc.siteType)}`}>
                        {loc.siteType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-600 font-medium">
                      {loc.country}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${
                        loc.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {loc.status === 'ACTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />}
                        {loc.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-400 font-medium">
                      {loc.createdAt}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewLocation(loc);
                          }}
                          className="p-2 hover:bg-blue-50 text-gray-400 hover:text-[#155DFC] rounded-lg transition-all"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLocation(loc);
                          }}
                          className="p-2 hover:bg-blue-50 text-gray-400 hover:text-[#155DFC] rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeactivateModal(loc);
                          }}
                          className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-lg transition-all"
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
      />

      <LocationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        location={selectedLocation}
        onEdit={(loc) => {
          setIsDetailsModalOpen(false);
          setSelectedEditLocation(loc);
          setIsEditModalOpen(true);
        }}
      />

      <EditLocationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        location={selectedEditLocation}
      />

      <DeactivateLocationModal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        onConfirm={handleConfirmDeactivation}
        locationName={selectedDeactivateLocation?.siteName || ''}
      />
    </div>
  );
}
