"use client";

import React from 'react';
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
import { mapSetupStatusToLocation, useLocationSetupStatus } from '../api';

function DetailRow({
  label,
  value,
  isMono = false,
}: {
  label: string;
  value: string;
  isMono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[13px] font-normal text-[#4A5565]">{label}</span>
      <span className={`text-[13px] font-medium text-[#101828] ${isMono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

interface LocationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string | null;
  onEdit?: (siteId: string) => void;
}

export function LocationDetailsModal({
  isOpen,
  onClose,
  siteId,
  onEdit,
}: LocationDetailsModalProps) {
  const { data, isLoading, isError } = useLocationSetupStatus(isOpen ? siteId : null);
  const location = data ? mapSetupStatusToLocation(data) : null;

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
            <div className="flex items-center gap-4">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#155DFC] to-[#3B82F6] shadow-lg shadow-blue-200">
                <MapPin size={26} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-[24px] font-bold leading-tight tracking-tight text-[#101828]">
                  {location?.siteName ?? 'Location details'}
                </h2>
                <p className="text-[14px] font-normal text-[#4A5565]">{location?.siteCode ?? 'Loading...'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-[#6A7282] transition-colors hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-4">
          {isLoading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#155DFC]" />
            </div>
          ) : isError || !location ? (
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
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[13px] font-normal text-[#4A5565]">Site Type:</span>
                    <span className="rounded-full bg-[#EFF6FF] px-2.5 py-0.5 text-[12px] font-bold text-[#1D4ED8]">
                      {location.siteType}
                    </span>
                  </div>
                  <DetailRow label="Country:" value={location.country} />
                  <DetailRow label="Timezone:" value={location.timezone} />
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[13px] font-normal text-[#4A5565]">Status:</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
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
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Map size={18} className="text-[#155DFC]" />
                  <h3 className="text-[16px] font-semibold text-[#101828]">Location Details</h3>
                </div>
                <div className="space-y-0.5 rounded-xl border border-[#F1F3F5] bg-[#F9FAFB] p-3">
                  <DetailRow label="Address:" value={location.addressLine1 || '-'} />
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
                </div>
              </div>

              {(location.blockingIssues.length > 0 || location.warnings.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-rose-600" />
                      <p className="text-[13px] font-bold text-rose-700">Blocking Issues</p>
                    </div>
                    {location.blockingIssues.length === 0 ? (
                      <p className="text-[13px] text-rose-700/70">No blocking issues.</p>
                    ) : (
                      location.blockingIssues.map((issue) => (
                        <p key={issue.code} className="text-[13px] font-medium text-rose-700">
                          {issue.message}
                        </p>
                      ))
                    )}
                  </div>
                  <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-amber-700" />
                      <p className="text-[13px] font-bold text-amber-800">Warnings</p>
                    </div>
                    {location.warnings.length === 0 ? (
                      <p className="text-[13px] text-amber-800/70">No warnings.</p>
                    ) : (
                      location.warnings.map((warning) => (
                        <p key={warning.code} className="text-[13px] font-medium text-amber-800">
                          {warning.message}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] bg-gray-50/50 px-6 py-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="h-10 border-none bg-transparent px-6 font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => siteId && onEdit?.(siteId)}
            disabled={!siteId}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#155DFC] to-[#1447E6] px-6 font-semibold text-white shadow-lg shadow-blue-100"
          >
            <Edit3 size={16} />
            Edit Location
          </Button>
        </div>
      </div>
    </Modal>
  );
}
