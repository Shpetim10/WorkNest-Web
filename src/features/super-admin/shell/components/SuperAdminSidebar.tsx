"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  ChevronsUpDown,
  LayoutGrid,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';

interface SuperAdminNavItem {
  name: string;
  icon: LucideIcon;
  href: string;
}

const NAV_ITEMS: SuperAdminNavItem[] = [
  { name: 'Dashboard', icon: LayoutGrid, href: '/superadmin_dashboard' },
  { name: 'Companies', icon: Building2, href: '/superadmin_dashboard/companies' },
  { name: 'Audit Log', icon: ShieldCheck, href: '#' },
];

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '#') return false;
  if (href === '/superadmin_dashboard') return pathname === href;

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SuperAdminSidebar({
  isSidebarExpanded,
  toggleSidebar,
}: {
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const activeItemStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.35)',
    boxShadow: '0px 4px 12px rgba(255, 255, 255, 0.20)',
    borderRadius: '16px',
    color: '#ffffff',
  };

  const inactiveItemStyle: React.CSSProperties = {
    borderRadius: '16px',
    color: 'rgba(255,255,255,0.82)',
  };

  return (
    <aside
      className={`fixed left-3 top-3 z-30 flex h-[calc(100vh-24px)] flex-col rounded-[24px] bg-[#4080ED] shadow-[0_12px_36px_rgba(0,0,0,0.20),0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 ease-in-out ${
        isSidebarExpanded ? 'w-[228px]' : 'w-[62px]'
      }`}
    >
      <div className={`shrink-0 pb-1 pt-3 transition-all duration-300 ${isSidebarExpanded ? 'px-3' : 'px-2'}`}>
        <div
          className={`flex items-center rounded-xl bg-white/15 transition-all duration-300 ${
            isSidebarExpanded ? 'gap-2.5 px-3 py-2.5' : 'justify-center px-0 py-2'
          }`}
        >
          {isSidebarExpanded ? (
            <>
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/20">
                <Image
                  src="/logos/worktrezz-symbol-cropped.png"
                  alt=""
                  width={36}
                  height={36}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[15px] font-bold leading-tight tracking-tight text-white">
                  WorkTrezz
                </h1>
                <p className="text-[11px] font-medium text-white/60">Free Plan</p>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="shrink-0 text-white/60 transition-colors hover:text-white"
              >
                <ChevronsUpDown size={15} strokeWidth={2} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-9 w-9 items-center justify-center text-white/70 transition-all hover:text-white"
            >
              <Menu size={18} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <nav
        className={`flex-1 space-y-0.5 overflow-y-auto pb-6 pt-3 transition-all duration-300 ${
          isSidebarExpanded ? 'px-3' : 'px-2'
        }`}
        style={{ scrollbarWidth: 'none' }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const labelClass = `text-[13.5px] font-semibold leading-none whitespace-nowrap transition-all duration-200 overflow-hidden ${
            isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
          }`;

          return (
            <Link
              key={item.name}
              href={item.href}
              title={!isSidebarExpanded ? item.name : undefined}
              className={`flex h-10 items-center transition-all duration-200 ${
                isSidebarExpanded ? 'justify-between px-3' : 'justify-center px-0'
              } ${!active ? 'hover:bg-white/10' : ''}`}
              style={active ? activeItemStyle : inactiveItemStyle}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <item.icon size={18} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
                <span className={labelClass}>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {!isSidebarExpanded && (
        <div className="flex shrink-0 justify-center pb-4">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 transition-all hover:bg-white/10 hover:text-white"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      )}
    </aside>
  );
}
