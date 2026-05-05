import React from 'react';
import { Checkbox, Input, Select, Textarea } from '@/common/ui';
import {
  AttendanceSettings,
  LocationFormData,
  LocationFormErrors,
  SiteType,
} from '../types';
import { COUNTRIES } from '../constants/countries';
import { TIMEZONES } from '../constants/timezones';

interface AddLocationStepDetailsProps {
  data: LocationFormData;
  errors: LocationFormErrors;
  attendanceSettings: AttendanceSettings;
  onChange: (updates: Partial<LocationFormData>) => void;
  onAttendanceChange: (updates: Partial<AttendanceSettings>) => void;
  onBlurField: (path: string) => void;
}

const ATTENDANCE_BOOLEAN_FIELDS: Array<{
  key: keyof Pick<
    AttendanceSettings,
    | 'requireQr'
    | 'requireLocation'
    | 'checkInEnabled'
    | 'checkOutEnabled'
    | 'useNetworkAsWarning'
    | 'rejectOutsideGeofence'
    | 'rejectPoorAccuracy'
    | 'allowManualCorrection'
    | 'allowManagerManualEntry'
  >;
  label: string;
}> = [
  { key: 'requireLocation', label: 'Require Location' },
  { key: 'requireQr', label: 'Require QR' },
  { key: 'checkInEnabled', label: 'Check-In Enabled' },
  { key: 'checkOutEnabled', label: 'Check-Out Enabled' },
  { key: 'useNetworkAsWarning', label: 'Use Network As Warning' },
  { key: 'rejectOutsideGeofence', label: 'Reject Outside Geofence' },
  { key: 'rejectPoorAccuracy', label: 'Reject Poor Accuracy' },
  { key: 'allowManualCorrection', label: 'Allow Manual Correction' },
  { key: 'allowManagerManualEntry', label: 'Allow Manager Manual Entry' },
];

export const AddLocationStepDetails: React.FC<AddLocationStepDetailsProps> = ({
  data,
  errors,
  attendanceSettings,
  onChange,
  onAttendanceChange,
  onBlurField,
}) => {
  const labelClasses = 'text-[14px] font-semibold text-[#364153] leading-[20px] mb-1 font-inter';
  const inputOverrideClasses =
    'h-[40px] rounded-[10px] bg-[#F9FAFB] border-[#E5E7EB] text-[16px] text-[#0A0A0A] placeholder:text-[rgba(10,10,10,0.5)] placeholder:text-[16px] placeholder:leading-[24px] font-inter';

  return (
    <div className="space-y-4">
      <Select
        id="siteType"
        label="Site Type"
        required
        value={data.siteType}
        onChange={(e) => onChange({ siteType: e.target.value as SiteType })}
        onBlur={() => onBlurField('basicInfo.siteType')}
        error={errors.siteType}
        className={labelClasses}
        style={{ height: '40px', borderRadius: '10px', backgroundColor: '#F9FAFB' }}
        options={[
          { value: '', label: 'Select site type' },
          { value: 'HQ', label: 'HQ' },
          { value: 'BRANCH', label: 'Branch' },
          { value: 'WAREHOUSE', label: 'Warehouse' },
          { value: 'STORE', label: 'Store' },
          { value: 'CLIENT_SITE', label: 'Client Site' },
          { value: 'FIELD_ZONE', label: 'Field Zone' },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="siteName"
          label="Site Name"
          required
          placeholder="Tirana Headquarters"
          value={data.siteName}
          onChange={(e) => onChange({ siteName: e.target.value })}
          onBlur={() => onBlurField('basicInfo.siteName')}
          error={errors.siteName}
          className={inputOverrideClasses}
        />
        <Input
          id="siteCode"
          label="Site Code"
          required
          placeholder="HQ-TIR"
          value={data.siteCode}
          onChange={(e) => onChange({ siteCode: e.target.value.toUpperCase() })}
          onBlur={() => onBlurField('basicInfo.siteCode')}
          error={errors.siteCode}
          className={inputOverrideClasses}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="country"
          label="Country"
          required
          value={data.country}
          onChange={(e) => onChange({ country: e.target.value })}
          onBlur={() => onBlurField('basicInfo.country')}
          error={errors.country}
          className={labelClasses}
          style={{ height: '40px', borderRadius: '10px', backgroundColor: '#F9FAFB' }}
          options={[{ value: '', label: 'Select country' }, ...COUNTRIES]}
        />
        <Select
          id="timezone"
          label="Timezone"
          required
          value={data.timezone}
          onChange={(e) => onChange({ timezone: e.target.value })}
          onBlur={() => onBlurField('basicInfo.timezone')}
          error={errors.timezone}
          className={labelClasses}
          style={{ height: '40px', borderRadius: '10px', backgroundColor: '#F9FAFB' }}
          options={[{ value: '', label: 'Select timezone' }, ...TIMEZONES]}
        />
      </div>

      <Textarea
        id="notes"
        label="Notes"
        placeholder="Additional information..."
        value={data.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
        className="h-[40px] !min-h-[70px] resize-none rounded-[10px] border-[#E5E7EB] bg-[#F9FAFB] py-2 text-[16px] text-[#0A0A0A] placeholder:text-[rgba(10,10,10,0.5)] placeholder:text-[16px] placeholder:leading-[24px] font-inter"
      />

      <div className="rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] p-4">
        <p className="mb-3 text-[14px] font-semibold text-[#101828]">Attendance Policy</p>
        <div className="grid grid-cols-2 gap-3">
          {ATTENDANCE_BOOLEAN_FIELDS.map(({ key, label }) => (
            <Checkbox
              key={key}
              label={label}
              checked={attendanceSettings[key]}
              error={errors[key]}
              onChange={(event) => onAttendanceChange({ [key]: event.target.checked })}
              onBlur={() => onBlurField(`attendanceRules.${key}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
