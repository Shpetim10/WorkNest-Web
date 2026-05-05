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
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between"
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
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
        >
          <Plus size={16} />
          Create Announcement
        </button>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="py-20 text-center text-gray-400 text-sm">Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="py-20 text-center">
          <Megaphone size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No announcements yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3"
              style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.priority === 'IMPORTANT' && (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={priorityBadgeStyle(item.priority)}
                    >
                      <AlertCircle size={11} />
                      Important
                    </span>
                  )}
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={audienceBadgeStyle(item.targetAudience)}
                  >
                    {audienceLabel(item.targetAudience)}
                  </span>
                </div>
                <button
                  onClick={() => setToDelete(item)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold text-gray-800 leading-snug line-clamp-2">
                {item.title}
              </h3>

              {/* Content preview */}
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">
                {item.content}
              </p>

              {/* Footer */}
              <p className="text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
                By {item.createdByName} &bull; {formatDate(item.createdAt)}
              </p>
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