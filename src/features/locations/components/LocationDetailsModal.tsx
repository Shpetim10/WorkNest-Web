"use client";

import React, { useMemo } from 'react';
import {
  Activity,
  Building2,
  Edit3,
  Layers,
  Loader2,
  Map,
  MapPin,
  Network,
  X,
} from 'lucide-react';
import { Modal, Button } from '@/common/ui';
import { mapDetailsToLocation, useSiteDetails } from '../api';

function DetailRow({
  label,
  value,
  isMono = false,
}: {
  label: string;
  value: React.ReactNode;
  isMono?: boolean;
}) {
  return (
    <div className="flex flex-col py-2.5 gap-1 border-b border-gray-50 last:border-0 sm:flex-row sm:items-start sm:gap-4">
      <span className="text-[13px] font-medium text-[#64748B] shrink-0 sm:font-normal sm:w-32">{label}</span>
      <div className={`font-[Inter,sans-serif] text-[14px] font-normal leading-[20px] text-[#1E2939] break-words flex-1 min-w-0 flex flex-col items-start sm:items-end sm:text-right ${isMono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  );
}

interface LocationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string | null;
  companyId: string | null;
}

export function LocationDetailsModal({
  isOpen,
  onClose,
  siteId,
  companyId,
}: LocationDetailsModalProps) {
  const { data: realData, isLoading, isError } = useSiteDetails(companyId, isOpen ? siteId : null);
  
  const location = useMemo(() => {
    return realData ? mapDetailsToLocation(realData) : null;
  }, [realData]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-[560px]"
      containerClassName="p-0"
      showDefaultStyles={false}
    >
      <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)]">
        <div
          className="relative border-b border-[#E5E7EB] px-6 pt-6 pb-6"
          style={{ background: 'linear-gradient(90deg, #EFF6FF 0%, #DBEAFE 100%)' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-1 items-center gap-4 min-w-0">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#155DFC] to-[#3B82F6] shadow-lg shadow-blue-200">
                <MapPin size={26} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <h2 className="font-[Inter,sans-serif] text-[14px] font-semibold leading-[24px] text-[#1E2939] break-words">
                  {location?.siteName ?? 'Location details'}
                </h2>
                <p className="font-[Inter,sans-serif] text-[14px] font-normal leading-[20px] text-[#1E2939] truncate" title={location?.siteCode}>
                   {location?.siteCode ?? 'Loading...'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 shrink-0 rounded-full p-1.5 text-[#6A7282] transition-colors hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#155DFC]" />
            </div>
          ) : (isError || !location) ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
              Failed to load the latest location details.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-[#155DFC]" />
                  <h3 className="text-[16px] font-semibold text-[#101828]">Basic Information</h3>
                </div>
                <div className="space-y-0.5 rounded-xl border border-[#F1F3F5] bg-[#F9FAFB] p-3">
                  <DetailRow 
                    label="Site Type:" 
                    value={
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1D4ED8] text-[12px] font-medium leading-[16px] break-words font-[Inter,sans-serif] truncate max-w-[150px]">
                        {location.siteType}
                      </span>
                    }
                  />
                  <DetailRow label="Country:" value={location.country} />
                  <DetailRow label="Timezone:" value={location.timezone} />
                  <DetailRow 
                    label="Status:" 
                    value={
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium leading-[16px] break-words font-[Inter,sans-serif] truncate max-w-[150px] ${
                          location.status === 'ACTIVE'
                            ? 'bg-[#ECFDF5] text-[#059669]'
                            : location.status === 'DRAFT'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <span
                          className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                            location.status === 'ACTIVE'
                              ? 'bg-[#10B981]'
                              : location.status === 'DRAFT'
                                ? 'bg-amber-500'
                                : 'bg-gray-400'
                          }`}
                        />
                        {location.status}
                      </span>
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Map size={18} className="text-[#155DFC]" />
                  <h3 className="text-[16px] font-semibold text-[#101828]">Location Details</h3>
                </div>
                <div className="space-y-0.5 rounded-xl border border-[#F1F3F5] bg-[#F9FAFB] p-3">
                  <DetailRow label="Address:" value={location.addressLine1 || '-'} />
                  {location.addressLine2 && <DetailRow label="Address Line 2:" value={location.addressLine2} />}
                  <DetailRow label="City:" value={location.city || '-'} />
                  <DetailRow
                    label="Coordinates:"
                    value={
                      location.latitude != null && location.longitude != null
                        ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                        : '-'
                    }
                  />
                  <DetailRow label="Geofence Radius:" value={`${location.geofenceRadius}m`} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Network size={18} className="text-[#155DFC]" />
                  <h3 className="text-[16px] font-semibold text-[#101828]">Network Configuration</h3>
                </div>
                <div className="space-y-0.5 rounded-xl border border-[#F1F3F5] bg-[#F9FAFB] p-3">
                  <DetailRow label="Network Name:" value={location.networkName || '-'} />
                  <DetailRow label="CIDR Block:" value={location.cidrBlock || '-'} isMono />
                  <DetailRow label="Detected IP:" value={location.detectedIp || '-'} isMono />
                  <DetailRow label="Confidence:" value={location.confidence} />
                  {location.notes && (
                    <div className="pt-2">
                       <p className="text-[13px] font-medium text-[#64748B] mb-1">Notes</p>
                       <p className="font-[Inter,sans-serif] text-[14px] font-normal leading-[20px] text-[#1E2939] break-words whitespace-pre-wrap bg-white/50 p-2 rounded-lg border border-gray-50">
                          {location.notes}
                       </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-[#E5E7EB] bg-gray-50/50 px-6 py-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="h-10 border-none bg-transparent px-6 font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
