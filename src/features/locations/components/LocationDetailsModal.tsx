"use client";

import React from 'react';
import { 
  X, 
  MapPin, 
  Building2, 
  Map, 
  Network, 
  Edit3,
  CheckCircle2,
  Calendar,
  Layers,
  Activity
} from 'lucide-react';
import { Modal, Button } from '@/common/ui';
import { Location } from '../types';

interface LocationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location | null;
  onEdit?: (location: Location) => void;
}

export function LocationDetailsModal({ 
  isOpen, 
  onClose, 
  location,
  onEdit 
}: LocationDetailsModalProps) {
  if (!location) return null;

  const DetailRow = ({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) => (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-[13px] font-normal text-[#4A5565]">{label}</span>
      <span className={`text-[13px] font-medium text-[#101828] ${isMono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-[560px]"
      containerClassName="p-0"
    >
      <div className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-xl">
        {/* Header with Gradient */}
        <div 
          className="relative pt-6 pb-[1.26px] px-8 border-b border-[#E5E7EB]"
          style={{ background: 'linear-gradient(90deg, #EFF6FF 0%, #DBEAFE 100%)' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#155DFC] to-[#3B82F6] flex items-center justify-center shadow-lg shadow-blue-200">
                <MapPin size={26} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-[24px] font-bold text-[#101828] leading-tight tracking-tight">
                  {location.siteName}
                </h2>
                <p className="text-[14px] font-mono font-normal text-[#4A5565]">
                  {location.siteCode}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-[#6A7282]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-4 space-y-6">
          
          {/* Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-[#155DFC]" />
              <h3 className="text-[16px] font-semibold text-[#101828]">Basic Information</h3>
            </div>
            <div className="bg-[#F9FAFB] border border-[#F1F3F5] rounded-xl p-3 space-y-0.5">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[13px] font-normal text-[#4A5565]">Site Type:</span>
                <span className="px-2.5 py-0.5 bg-[#EFF6FF] text-[#1D4ED8] text-[12px] font-bold rounded-full">
                  {location.siteType}
                </span>
              </div>
              <DetailRow label="Country:" value={location.country} />
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[13px] font-normal text-[#4A5565]">Status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 bg-[#ECFDF5] text-[#059669] text-[12px] font-bold rounded-full">
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full mr-1.5" />
                  {location.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <DetailRow label="Created:" value={location.createdAt} />
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Map size={18} className="text-[#155DFC]" />
              <h3 className="text-[16px] font-semibold text-[#101828]">Location Details</h3>
            </div>
            <div className="bg-[#F9FAFB] border border-[#F1F3F5] rounded-xl p-3 space-y-0.5">
              <DetailRow label="Address:" value={location.addressLine1} />
              <DetailRow label="City:" value={location.city} />
              <DetailRow label="Geofence Radius:" value={`${location.geofenceRadius}m`} />
            </div>
          </div>

          {/* Network Configuration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Network size={18} className="text-[#155DFC]" />
              <h3 className="text-[16px] font-semibold text-[#101828]">Network Configuration</h3>
            </div>
            <div className="bg-[#F9FAFB] border border-[#F1F3F5] rounded-xl p-3 space-y-0.5">
              <DetailRow label="Network Name:" value={location.networkName} />
              <DetailRow label="CIDR Block:" value={location.cidrBlock} isMono />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-gray-50/50 flex items-center justify-end gap-3">
          <Button 
            variant="secondary" 
            onClick={onClose}
            className="px-6 font-semibold text-gray-600 hover:text-gray-900 border-none bg-transparent hover:bg-gray-100 h-10"
          >
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => onEdit?.(location)}
            className="bg-gradient-to-r from-[#155DFC] to-[#1447E6] text-white px-6 font-semibold rounded-xl h-10 shadow-lg shadow-blue-100 flex items-center gap-2"
          >
            <Edit3 size={16} />
            Edit Location
          </Button>
        </div>
      </div>
    </Modal>
  );
}
