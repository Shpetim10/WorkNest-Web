import React from 'react';
import { Checkbox, Input, Select, Textarea } from '@/common/ui';
import { COUNTRIES } from '../constants/countries';
import { TIMEZONES } from '../constants/timezones';
import {
  LocationFormData,
  LocationFormErrors,
  SiteType,
  CompanySiteFormValues
} from '../types';

interface AddLocationStepDetailsProps {
  data: LocationFormData;
  errors: LocationFormErrors;
  attendanceSettings: CompanySiteFormValues['attendanceRules'];
  onChange: (updates: Partial<LocationFormData>) => void;
  onAttendanceChange: (updates: Partial<CompanySiteFormValues['attendanceRules']>) => void;
}

export const AddLocationStepDetails: React.FC<AddLocationStepDetailsProps> = ({
  data,
  errors,
  attendanceSettings,
  onChange,
  onAttendanceChange,
}) => {
  const labelClasses = 'text-[14px] font-semibold text-[#364153] leading-[20px] mb-1 font-inter';
  const inputOverrideClasses =
    'h-[40px] rounded-[10px] bg-[#F9FAFB] border-[#E5E7EB] text-[16px] text-[#0A0A0A] placeholder:text-[rgba(10,10,10,0.5)] placeholder:text-[16px] placeholder:leading-[24px] font-inter';

  return (
    <div className="space-y-3">
      <Select
        id="siteType"
        label="Site Type"
        required
        value={data.siteType}
        onChange={(e) => onChange({ siteType: e.target.value as SiteType })}
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
          maxLength={120}
          placeholder="Tirana Headquarters"
          value={data.siteName}
          onChange={(e) => onChange({ siteName: e.target.value })}
          error={errors.siteName}
          className={inputOverrideClasses}
        />
        <Input
          id="siteCode"
          label="Site Code"
          required
          maxLength={80}
          placeholder="HQ-TIR"
          value={data.siteCode}
          onChange={(e) => onChange({ siteCode: e.target.value.toUpperCase() })}
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

      <div className="grid grid-cols-2 gap-3 rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] p-4">
        <Checkbox
          label="Location Required"
          checked={attendanceSettings.locationRequired}
          onChange={(event) => onAttendanceChange({ locationRequired: event.target.checked })}
        />
        <Checkbox
          label="QR Enabled"
          checked={attendanceSettings.qrEnabled}
          onChange={(event) => onAttendanceChange({ qrEnabled: event.target.checked })}
        />
        <Checkbox
          label="Check-In Enabled"
          checked={attendanceSettings.checkInEnabled}
          onChange={(event) => onAttendanceChange({ checkInEnabled: event.target.checked })}
        />
        <Checkbox
          label="Check-Out Enabled"
          checked={attendanceSettings.checkOutEnabled}
          onChange={(event) => onAttendanceChange({ checkOutEnabled: event.target.checked })}
        />
      </div>
    </div>
  );
};
