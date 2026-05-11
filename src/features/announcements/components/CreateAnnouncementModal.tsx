"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Megaphone } from 'lucide-react';
import { AnnouncementAudience, AnnouncementPriority, CreateAnnouncementBody } from '../types';
import { useCreateAnnouncement, useEmployeeLookup } from '../api';
import { useDepartmentLookup } from '@/features/departments';

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
  const [form, setForm] = useState<CreateAnnouncementBody>(INITIAL);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateAnnouncement();
  const { data: departments = [] } = useDepartmentLookup();
  const { data: employees = [] } = useEmployeeLookup();

  if (!isOpen) return null;

  const handleAudienceChange = (audience: AnnouncementAudience) => {
    setForm((prev) => ({ ...prev, targetAudience: audience }));
    setSelectedDeptIds([]);
    setSelectedEmpIds([]);
  };

  const toggleDept = (id: string) =>
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );

  const toggleEmp = (id: string) =>
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );

  const handleSubmit = () => {
    setError(null);
    if (!form.title.trim()) return setError('Title is required.');
    if (!form.content.trim()) return setError('Content is required.');
    if (form.targetAudience === 'DEPARTMENT' && selectedDeptIds.length === 0)
      return setError('Select at least one department.');
    if (form.targetAudience === 'SPECIFIC_USERS' && selectedEmpIds.length === 0)
      return setError('Select at least one employee.');

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
      onError: () => setError('Failed to create announcement. Please try again.'),
    });
  };

  const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string }[] = [
    { value: 'ALL_EMPLOYEES', label: 'All Employees' },
    { value: 'DEPARTMENT', label: 'Department' },
    { value: 'SPECIFIC_USERS', label: 'Specific Users' },
  ];

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between shrink-0 rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Megaphone size={18} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Create Announcement</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              maxLength={255}
              placeholder="Announcement title"
              className="h-10 px-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/60"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              rows={4}
              placeholder="Write your announcement here..."
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/60 resize-none"
            />
          </div>

          {/* Target Audience */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Target Audience <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {AUDIENCE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleAudienceChange(value)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    form.targetAudience === value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Department picker */}
          {form.targetAudience === 'DEPARTMENT' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Select Departments <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-200 rounded-xl max-h-40 overflow-y-auto divide-y divide-gray-50">
                {departments.length === 0 ? (
                  <p className="text-xs text-gray-400 p-3">No departments found.</p>
                ) : (
                  departments.map((dept) => (
                    <label
                      key={dept.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDeptIds.includes(dept.id)}
                        onChange={() => toggleDept(dept.id)}
                        className="accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">{dept.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Employee picker */}
          {form.targetAudience === 'SPECIFIC_USERS' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Select Employees <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-50">
                {employees.length === 0 ? (
                  <p className="text-xs text-gray-400 p-3">No employees found.</p>
                ) : (
                  employees.map((emp) => {
                    return (
                      <label
                        key={emp.id}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmpIds.includes(emp.id)}
                          onChange={() => toggleEmp(emp.id)}
                          className="accent-blue-600"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700">{emp.fullName}</span>
                          <span className="text-[11px] text-gray-400">{emp.displayRoleLabel} · {emp.employmentTypeLabel}</span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Priority</label>
            <div className="flex gap-2">
              {(['NORMAL', 'IMPORTANT'] as AnnouncementPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, priority: p }))}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    form.priority === p
                      ? p === 'IMPORTANT'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p === 'IMPORTANT' ? 'Important' : 'Normal'}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={create.isPending}
            className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {create.isPending ? 'Creating...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
