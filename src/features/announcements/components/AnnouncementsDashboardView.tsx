"use client";

import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, AlertCircle } from 'lucide-react';
import { AnnouncementListResponse, AnnouncementAudience, AnnouncementPriority } from '../types';
import { useAnnouncements, useDeleteAnnouncement } from '../api';
import { CreateAnnouncementModal } from './CreateAnnouncementModal';
import { DeleteAnnouncementModal } from './DeleteAnnouncementModal';

function audienceLabel(audience: AnnouncementAudience): string {
  switch (audience) {
    case 'ALL_EMPLOYEES': return 'All Employees';
    case 'DEPARTMENT': return 'Department';
    case 'SPECIFIC_USERS': return 'Specific Users';
  }
}

function audienceBadgeStyle(audience: AnnouncementAudience): React.CSSProperties {
  switch (audience) {
    case 'ALL_EMPLOYEES': return { color: '#1447E6', backgroundColor: '#EFF6FF' };
    case 'DEPARTMENT': return { color: '#7C3AED', backgroundColor: '#F5F3FF' };
    case 'SPECIFIC_USERS': return { color: '#0369A1', backgroundColor: '#E0F2FE' };
  }
}

function priorityBadgeStyle(priority: AnnouncementPriority): React.CSSProperties {
  return priority === 'IMPORTANT'
    ? { color: '#DC2626', backgroundColor: '#FEE2E2' }
    : { color: '#6B7280', backgroundColor: '#F3F4F6' };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function AnnouncementsDashboardView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AnnouncementListResponse | null>(null);

  const { data: announcements = [], isLoading } = useAnnouncements();
  const deleteAnnouncement = useDeleteAnnouncement();

  const handleDeleteConfirm = () => {
    if (!toDelete) return;
    deleteAnnouncement.mutate(toDelete.id, {
      onSuccess: () => setToDelete(null),
    });
  };

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4">
      {/* Hero banner */}
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-8"
        style={{
          background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
          minHeight: 120,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Megaphone size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Announcements</h1>
            <p className="text-white/80 text-sm mt-0.5">Create and manage company announcements</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end px-2">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-[0px_4px_12px_rgba(43,127,255,0.24)] transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
        >
          <Plus size={16} />
          Create Announcement
        </button>
      </div>

      {/* Announcement list */}
      {isLoading ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
          <Megaphone size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No announcements yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-2">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="flex w-full items-start justify-between gap-6 rounded-xl border border-gray-100 bg-white px-6 py-5"
              style={{ boxShadow: '0px 6px 16px rgba(15, 23, 42, 0.12)' }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[16px] font-semibold leading-6 text-[#1F2937]">
                    {item.title}
                  </h3>
                  {item.priority === 'IMPORTANT' && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={priorityBadgeStyle(item.priority)}
                    >
                      <AlertCircle size={11} />
                      Important
                    </span>
                  )}
                </div>

                <p className="mt-1 text-[12px] font-medium text-[#6A7282]">
                  By {item.createdByName} &bull; {formatDate(item.createdAt)}
                </p>

                <p className="mt-4 text-[14px] leading-6 text-[#4A5565]">
                  {item.content}
                </p>
              </div>

              <div className="flex shrink-0 items-start gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={audienceBadgeStyle(item.targetAudience)}
                >
                  {audienceLabel(item.targetAudience)}
                </span>
                <button
                  onClick={() => setToDelete(item)}
                  className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAnnouncementModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      <DeleteAnnouncementModal
        announcement={toDelete}
        isLoading={deleteAnnouncement.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
