"use client";

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AnnouncementAudience, AnnouncementPriority, CreateAnnouncementBody } from '../types';
import { useCreateAnnouncement, useEmployeeLookup } from '../api';
import { useDepartmentLookup } from '@/features/departments';
import { useI18n } from '@/common/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL: CreateAnnouncementBody = {
  title: '',
  content: '',
  targetAudience: 'ALL_EMPLOYEES',
  priority: 'NORMAL',
};

export function CreateAnnouncementModal({ isOpen, onClose }: Props) {
  const { t } = useI18n();
  const [form, setForm] = useState<CreateAnnouncementBody>(INITIAL);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateAnnouncement();
  const { data: departments = [] } = useDepartmentLookup();
  const selectedDepartmentNames = useMemo(
    () =>
      departments
        .filter((department) => selectedDeptIds.includes(department.id))
        .map((department) => department.name),
    [departments, selectedDeptIds],
  );
  const {
    data: employees = [],
    isFetching: isLoadingEmployees,
  } = useEmployeeLookup(
    selectedDeptIds,
    selectedDepartmentNames,
    form.targetAudience === 'SPECIFIC_USERS',
  );

  if (!isOpen) return null;

  const handleAudienceChange = (audience: AnnouncementAudience) => {
    setForm((prev) => ({ ...prev, targetAudience: audience }));
    setSelectedDeptIds([]);
    setSelectedEmpIds([]);
  };

  const toggleDept = (id: string) => {
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
    setSelectedEmpIds([]);
  };

  const toggleEmp = (id: string) =>
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );

  const handleSubmit = () => {
    setError(null);
    if (!form.title.trim()) return setError(t('announcements.modal.titleRequired'));
    if (!form.content.trim()) return setError(t('announcements.modal.contentRequired'));
    if (form.targetAudience === 'DEPARTMENT' && selectedDeptIds.length === 0)
      return setError(t('announcements.modal.selectDepartment'));
    if (form.targetAudience === 'SPECIFIC_USERS' && selectedDeptIds.length === 0)
      return setError(t('announcements.modal.selectDepartment'));
    if (form.targetAudience === 'SPECIFIC_USERS' && selectedEmpIds.length === 0)
      return setError(t('announcements.modal.selectUser'));

    const body: CreateAnnouncementBody = {
      ...form,
      ...(form.targetAudience === 'DEPARTMENT' ? { targetDepartmentIds: selectedDeptIds } : {}),
      ...(form.targetAudience === 'SPECIFIC_USERS' ? { targetEmployeeIds: selectedEmpIds } : {}),
    };

    create.mutate(body, {
      onSuccess: () => {
        setForm(INITIAL);
        setSelectedDeptIds([]);
        setSelectedEmpIds([]);
        onClose();
      },
      onError: () => setError(t('announcements.modal.createFailed')),
    });
  };

  const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string }[] = [
    { value: 'ALL_EMPLOYEES', label: t('announcements.allEmployees') },
    { value: 'DEPARTMENT', label: t('announcements.department') },
    { value: 'SPECIFIC_USERS', label: t('announcements.specificUsers') },
  ];

  const renderDepartmentChips = () => (
    <div className="flex flex-wrap gap-3">
      {departments.length === 0 ? (
        <p className="text-xs text-gray-400">{t('tables.empty.departments')}</p>
      ) : (
        departments.map((dept) => {
          const isSelected = selectedDeptIds.includes(dept.id);
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => toggleDept(dept.id)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-[8px] border px-5 py-2 text-xs font-medium transition-colors ${
                isSelected
                  ? 'border-[#2B7FFF] bg-[#EFF6FF] text-[#1E3A8A]'
                  : 'border-[#E5E7EB] bg-white text-[#364153] hover:bg-gray-50'
              }`}
            >
              <span
                className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center ${
                  isSelected ? 'border-[#2B7FFF]' : 'border-[#D1D5DC]'
                }`}
              >
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-[#2B7FFF]" />}
              </span>
              {dept.name}
            </button>
          );
        })
      )}
    </div>
  );

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative flex h-[717px] max-h-[calc(100vh-32px)] w-[969px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[10px] border-[1.26px] border-[rgba(0,0,0,0.1)] bg-white"
        style={{
          boxShadow:
            '0px 4px 6px -4px rgba(0,0,0,0.1), 0px 10px 15px -3px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex shrink-0 items-start justify-between px-5 py-4"
          style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
        >
          <div>
            <h2 className="text-[24px] font-bold leading-7 text-white">{t('announcements.create')}</h2>
            <p className="mt-1 text-[12px] font-normal leading-4 text-white/90">
              {t('announcements.modal.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.actions.close')}
            className="rounded-md p-1 text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          <div className="flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#1F2937]">
                {t('announcements.modal.titleLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                maxLength={255}
                placeholder={t('announcements.modal.titlePlaceholder')}
                className="h-12 rounded-[10px] border border-[#D1D5DC] px-4 text-[14px] text-gray-800 placeholder:text-[#99A1AF] focus:border-[#2B7FFF] focus:outline-none focus:ring-2 focus:ring-blue-500/15"
              />
            </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#1F2937]">
              {t('announcements.modal.contentLabel')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              rows={4}
              placeholder={t('announcements.modal.contentPlaceholder')}
              className="min-h-[72px] resize-none rounded-[10px] border border-[#E5E7EB] px-4 py-3 text-[14px] text-gray-800 placeholder:text-[#99A1AF] focus:border-[#2B7FFF] focus:outline-none focus:ring-2 focus:ring-blue-500/15"
            />
          </div>

          {/* Target Audience */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium text-[#1F2937]">
              {t('announcements.modal.targetAudience')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 rounded-[10px] bg-[#F3F4F6] p-1">
              {AUDIENCE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleAudienceChange(value)}
                  className={`h-10 rounded-[8px] text-[13px] font-semibold transition-colors ${
                    form.targetAudience === value
                      ? 'bg-white text-[#155DFC] shadow-sm'
                      : 'text-[#4A5565] hover:bg-white/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Department picker */}
          {form.targetAudience === 'DEPARTMENT' && (
            <div className="flex flex-col gap-3 pt-1">
              <label className="text-[12px] font-medium text-[#1F2937]">
                {t('announcements.modal.selectDepartments')} <span className="text-red-500">*</span>
              </label>
              {renderDepartmentChips()}
            </div>
          )}

          {/* Employee picker */}
          {form.targetAudience === 'SPECIFIC_USERS' && (
            <div className="flex flex-col gap-4 pt-1">
              <div className="flex flex-col gap-3">
                <label className="text-[12px] font-medium text-[#1F2937]">
                  {t('announcements.modal.selectDepartments')} <span className="text-red-500">*</span>
                </label>
                {renderDepartmentChips()}
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[12px] font-medium text-[#1F2937]">
                  {t('announcements.modal.selectUsers')} <span className="text-red-500">*</span>
              </label>
                <div className="flex flex-wrap gap-3">
                  {selectedDeptIds.length === 0 ? (
                    <p className="text-xs text-gray-400">{t('announcements.modal.selectDepartmentToViewUsers')}</p>
                  ) : isLoadingEmployees ? (
                    <p className="text-xs text-gray-400">{t('announcements.modal.loadingUsers')}</p>
                  ) : employees.length === 0 ? (
                    <p className="text-xs text-gray-400">{t('announcements.modal.noUsers')}</p>
                  ) : (
                  employees.map((emp) => {
                    const displayName = emp.fullName?.trim() || emp.email;
                    const isSelected = selectedEmpIds.includes(emp.id);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => toggleEmp(emp.id)}
                        className={`inline-flex min-h-10 items-center gap-2 rounded-[8px] border px-5 py-2 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'border-[#2B7FFF] bg-[#EFF6FF] text-[#1E3A8A]'
                            : 'border-[#E5E7EB] bg-white text-[#364153] hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#2B7FFF]' : 'border-[#D1D5DC]'
                          }`}
                        >
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-[#2B7FFF]" />}
                        </span>
                        {displayName}
                      </button>
                    );
                  })
                )}
                </div>
              </div>
            </div>
          )}

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium text-[#1F2937]">{t('announcements.modal.priorityOptional')}</label>
            <div className="flex flex-wrap gap-3">
              {(['NORMAL', 'IMPORTANT'] as AnnouncementPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, priority: p }))}
                  className={`inline-flex h-10 min-w-[112px] items-center justify-center gap-2 rounded-[8px] border px-5 text-xs font-medium transition-colors ${
                    form.priority === p
                      ? 'border-[#2B7FFF] bg-[#EFF6FF] text-[#1E3A8A]'
                      : 'border-[#E5E7EB] bg-white text-[#364153] hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center ${
                      form.priority === p ? 'border-[#2B7FFF]' : 'border-[#D1D5DC]'
                    }`}
                  >
                    {form.priority === p && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2B7FFF]" />
                    )}
                  </span>
                  {p === 'IMPORTANT' ? t('announcements.important') : t('announcements.modal.normalPriority')}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between bg-white px-7 py-6">
          <button
            onClick={onClose}
            className="h-11 min-w-[100px] rounded-[8px] bg-[#E5E7EB] px-6 text-sm font-medium text-[#364153] transition-colors hover:bg-[#D1D5DC]"
          >
            {t('common.actions.back')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={create.isPending}
            className="h-11 min-w-[158px] rounded-[8px] px-6 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
          >
            {create.isPending ? t('announcements.modal.creating') : t('announcements.modal.add')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
