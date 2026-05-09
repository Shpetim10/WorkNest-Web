"use client";

import React from 'react';
import type { LucideIcon } from 'lucide-react';

export function SuperAdminPageHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-[120px] items-center justify-between overflow-hidden rounded-2xl px-8 py-8"
      style={{
        background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
        boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
      }}
    >
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight text-white">{title}</h1>
          <p className="mt-0.5 text-sm font-medium text-white/80">{description}</p>
        </div>
      </div>

      {action && <div className="relative z-10 shrink-0">{action}</div>}
    </div>
  );
}
