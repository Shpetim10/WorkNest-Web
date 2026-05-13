"use client";

import React from 'react';
import {
  Activity,
  AlertCircle,
  Building2,
  Loader2,
  Map,
  MapPin,
  MonitorSmartphone,
  Network,
  QrCode,
  X,
} from 'lucide-react';
import { Modal, Button } from '@/common/ui';
import { useI18n } from '@/common/i18n';
import { mapDetailsToLocation, useSiteDetails } from '../api';
import { AttendancePolicyModal } from './AttendancePolicyModal';
import { CreateQrTerminalModal } from './CreateQrTerminalModal';

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
  companyId: string | null;
}

export function LocationDetailsModal({
  isOpen,
  onClose,
  siteId,
  companyId,
}: LocationDetailsModalProps) {
  const { t } = useI18n();
  const [isPolicyModalOpen, setIsPolicyModalOpen] = React.useState(false);
  const [isCreateTerminalModalOpen, setIsCreateTerminalModalOpen] = React.useState(false);
  const { data, isLoading, isError } = useSiteDetails(companyId, isOpen ? siteId : null);
  const location = data ? mapDetailsToLocation(data) : null;
  const attendancePolicy = data?.attendancePolicy ?? null;
  const linkedQrTerminals = data?.linkedQrTerminals ?? [];

  const openTerminalDisplay = (terminalId: string, terminalName: string) => {
    const params = new URLSearchParams();
    params.set('terminalName', terminalName);
    if (location?.siteName) {
      params.set('siteName', location.siteName);
    }

    window.open(`/dashboard/locations/terminals/${terminalId}?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  const formatHeartbeat = (value: string | null) => {
    if (!value) {
      return t('locations.modal.noHeartbeat');
    }

    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const policySourceText =
    attendancePolicy?.policySource === 'COMPANY_DEFAULT'
      ? t('locations.modal.companyDefaultPolicy')
      : t('locations.modal.sitePolicyOverride');
  const yesNo = (value: boolean) => (value ? t('common.yes') : t('common.no'));
  const siteTypeLabel = location?.siteType ? t(`locations.types.${location.siteType}`) : '';
  const statusLabel = location?.status ? t(`common.statuses.${location.status.toLowerCase()}`) : '';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        width="max-w-[820px]"
        containerClassName="p-0"
        showDefaultStyles={false}
      >
        <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)]">
          <div
            className="relative border-b border-[#E5E7EB] px-6 pt-6 pb-6"
            style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2B7FFF] to-[#00BBA7] shadow-lg shadow-blue-200">
                  <MapPin size={26} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-[24px] font-bold leading-tight tracking-tight text-white">
                    {location?.siteName ?? t('locations.modal.detailsTitle')}
                  </h2>
                  <p className="text-[14px] font-normal text-white/80">{location?.siteCode ?? t('locations.modal.loadingDetails')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#155DFC]" />
              </div>
            ) : isError || !location ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
                {t('locations.modal.loadDetailsFailed')}
              </div>
            ) : (
              <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-[#155DFC]" />
                  <h3 className="text-[16px] font-semibold text-[#101828]">{t('locations.modal.basicInformation')}</h3>
                </div>
                <div className="space-y-0.5 rounded-xl border border-[#F1F3F5] bg-[#F9FAFB] p-3">
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[13px] font-normal text-[#4A5565]">{t('tables.headers.siteType')}:</span>
                    <span className="rounded-full bg-[#EFF6FF] px-2.5 py-0.5 text-[12px] font-bold text-[#1D4ED8]">
                      {siteTypeLabel}
                    </span>
                  </div>
                  <DetailRow label={`${t('tables.headers.country')}:`} value={location.country} />
                  <DetailRow label={`${t('locations.form.timezone')}:`} value={location.timezone} />
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[13px] font-normal text-[#4A5565]">{t('common.fields.status')}:</span>
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
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Map size={18} className="text-[#155DFC]" />
                  <h3 className="text-[16px] font-semibold text-[#101828]">{t('locations.modal.locationDetails')}</h3>
                </div>
                <div className="space-y-0.5 rounded-xl border border-[#F1F3F5] bg-[#F9FAFB] p-3">
                  <DetailRow label={`${t('locations.form.addressLine1')}:`} value={location.addressLine1 || '-'} />
                  <DetailRow label={`${t('locations.form.city')}:`} value={location.city || '-'} />
                  <DetailRow
                    label={`${t('locations.form.latitude')} / ${t('locations.form.longitude')}:`}
                    value={
                      location.latitude != null && location.longitude != null
                        ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                        : '-'
                    }
                  />
                  <DetailRow label={`${t('locations.form.geofenceRadius')}:`} value={`${location.geofenceRadius}m`} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Network size={18} className="text-[#155DFC]" />
                  <h3 className="text-[16px] font-semibold text-[#101828]">{t('locations.modal.networkConfiguration')}</h3>
                </div>
                <div className="space-y-0.5 rounded-xl border border-[#F1F3F5] bg-[#F9FAFB] p-3">
                  <DetailRow label={`${t('locations.form.networkName')}:`} value={location.networkName || '-'} />
                  <DetailRow label={`${t('locations.form.cidrBlock')}:`} value={location.cidrBlock || '-'} isMono />
                  <DetailRow label={`${t('locations.form.detectedIpAddress')}:`} value={location.detectedIp || '-'} isMono />
                  <DetailRow label={`${t('locations.form.confidence')}:`} value={location.confidence} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-[#155DFC]" />
                    <h3 className="text-[16px] font-semibold text-[#101828]">{t('locations.modal.attendance')}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setIsPolicyModalOpen(true)}
                      className="bg-[#EFF6FF] text-[#155DFC] hover:bg-[#DBEAFE]"
                    >
                      {t('locations.modal.editAttendancePolicy')}
                    </Button>
                  </div>
                </div>

                {!attendancePolicy ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
                    {t('locations.modal.policyLoadFailed')}
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-[#D6E4FF] bg-[#F8FBFF] p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#155DFC]">
                          {t('locations.modal.policySource')}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-[#155DFC] shadow-sm">
                          {attendancePolicy.policySource}
                        </span>
                      </div>
                      <p className="mt-3 text-[13px] font-medium text-[#4A5565]">{policySourceText}</p>
                    </div>

                    <div className="grid gap-3 rounded-xl border border-[#F1F3F5] bg-[#F9FAFB] p-4 sm:grid-cols-2">
                      <DetailRow label={`${t('locations.modal.requireQr')}:`} value={yesNo(attendancePolicy.requireQr)} />
                      <DetailRow label={`${t('locations.modal.requireLocation')}:`} value={yesNo(attendancePolicy.requireLocation)} />
                      <DetailRow label={`${t('locations.modal.checkInEnabled')}:`} value={yesNo(attendancePolicy.checkInEnabled)} />
                      <DetailRow label={`${t('locations.modal.checkOutEnabled')}:`} value={yesNo(attendancePolicy.checkOutEnabled)} />
                      <DetailRow label={`${t('locations.modal.rejectOutsideGeofence')}:`} value={yesNo(attendancePolicy.rejectOutsideGeofence)} />
                      <DetailRow label={`${t('locations.modal.rejectPoorAccuracy')}:`} value={yesNo(attendancePolicy.rejectPoorAccuracy)} />
                      <DetailRow label={`${t('locations.modal.allowManagerManualEntry')}:`} value={yesNo(attendancePolicy.allowManagerManualEntry)} />
                    </div>
                  </>
                )}

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <MonitorSmartphone size={18} className="text-[#155DFC]" />
                        <h4 className="text-[15px] font-semibold text-[#101828]">{t('locations.modal.linkedQrTerminals')}</h4>
                      </div>
                      <Button
                          variant="secondary"
                          onClick={() => setIsCreateTerminalModalOpen(true)}
                          className="bg-[#ECFDF3] text-[#027A48] hover:bg-[#D1FADF]"
                      >
                        {t('locations.modal.createTerminal')}
                      </Button>
                  </div>
                  {linkedQrTerminals.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] px-4 py-4 text-[13px] font-medium text-[#4A5565]">
                      <p>{t('locations.modal.noQrTerminals')}</p>
                        {attendancePolicy?.requireQr && (
                          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                            <AlertCircle size={15} className="mt-0.5 shrink-0" />
                            <span>{t('locations.modal.qrRequiredWarning')}</span>
                          </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {linkedQrTerminals.map((terminal) => (
                        <div
                          key={terminal.id}
                          className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFD] p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[14px] font-semibold text-[#101828]">{terminal.name}</span>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                  terminal.status === 'ACTIVE'
                                    ? 'bg-[#ECFDF3] text-[#027A48]'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {terminal.status}
                                </span>
                                {terminal.autoCreated && (
                                  <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-bold text-[#155DFC]">
                                    {t('locations.modal.autoCreated')}
                                  </span>
                                )}
                              </div>
                              <div className="grid gap-1 text-[13px] font-medium text-[#4A5565] sm:grid-cols-2 sm:gap-x-6">
                                <span>{t('locations.modal.rotation')}: {terminal.rotationSeconds}s</span>
                                <span>{t('locations.modal.lastHeartbeat')}: {formatHeartbeat(terminal.lastHeartbeatAt)}</span>
                              </div>
                            </div>
                            <Button
                              variant="primary"
                              onClick={() => openTerminalDisplay(terminal.id, terminal.name)}
                              className="bg-[#111827] text-white hover:bg-[#1F2937]"
                              icon={<QrCode size={16} />}
                              iconPosition="left"
                            >
                              {t('locations.modal.openDisplayPage')}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}
          </div>

          <div className="flex items-center justify-end border-t border-[#E5E7EB] bg-gray-50/50 px-6 py-4">
            <Button
              variant="secondary"
              onClick={onClose}
              className="h-10 border-none bg-transparent px-6 font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {t('common.actions.close')}
            </Button>
          </div>
        </div>
      </Modal>

      <AttendancePolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        companyId={companyId}
        siteId={siteId}
        siteName={location?.siteName}
      />

      <CreateQrTerminalModal
        isOpen={isCreateTerminalModalOpen}
        onClose={() => setIsCreateTerminalModalOpen(false)}
        companyId={companyId}
        siteId={siteId}
        siteName={location?.siteName}
      />
    </>
  );
}
