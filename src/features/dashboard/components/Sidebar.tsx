"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  Megaphone,
  ShieldCheck,
  Settings,
  MapPin,
  Building2,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  ChevronsUpDown,
} from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';

interface SubNavItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  href: string;
  hasChevron?: boolean;
  subItems?: SubNavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', icon: LayoutGrid, href: '/dashboard' },
  {
    name: 'Employees',
    icon: Users,
    href: '#',
    hasChevron: true,
    subItems: [
      { name: 'Employee List', href: '/dashboard/employees' },
      { name: 'Staff List', href: '/dashboard/employees/staff' },
      { name: 'Assign Employees', href: '/dashboard/employees/assign' },
    ],
  },
  { name: 'Attendance', icon: Clock, href: '/dashboard/attendance' },
  { name: 'Leave', icon: Calendar, href: '#', hasChevron: true },
  { name: 'Payroll', icon: DollarSign, href: '#', hasChevron: true },
  {
    name: 'Locations',
    icon: MapPin,
    href: '#',
    hasChevron: true,
    subItems: [
      { name: 'Locations', href: '/dashboard/locations' },
      { name: 'QR Terminal Display', href: '/dashboard/locations/terminals' },
    ],
  },
  { name: 'Departments', icon: Building2, href: '/dashboard/settings/departments' },
  { name: 'Reports', icon: FileText, href: '#' },
  { name: 'Announcements', icon: Megaphone, href: '#' },
  { name: 'Audit Log', icon: ShieldCheck, href: '#' },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings/company', hasChevron: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarExpanded, toggleSidebar } = useDashboardStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleSubmenu = (name: string) => {
    setExpandedMenus((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name],
    );
  };

  const activeItemStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.22)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
    borderRadius: '12px',
    color: '#ffffff',
  };

  const inactiveItemStyle: React.CSSProperties = {
    borderRadius: '12px',
    color: 'rgba(255,255,255,0.82)',
  };

  return (
    <aside
      className={`fixed top-3 left-3 transition-all duration-300 ease-in-out flex flex-col z-30 rounded-2xl ${
        isSidebarExpanded ? 'w-[228px]' : 'w-[62px]'
      }`}
      style={{
        height: 'calc(100vh - 24px)',
        background: '#4080ED',
        boxShadow: '0 8px 32px rgba(37,99,235,0.30), 0 2px 8px rgba(37,99,235,0.12)',
      }}
    >
      {/* Brand area */}
      <div className={`shrink-0 pt-3 pb-1 transition-all duration-300 ${isSidebarExpanded ? 'px-3' : 'px-2'}`}>
        <div
          className={`flex items-center rounded-xl transition-all duration-300 ${
            isSidebarExpanded ? 'px-3 py-2.5 gap-2.5' : 'px-0 py-2 justify-center'
          }`}
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          {isSidebarExpanded ? (
            <>
              {/* Logo placeholder */}
              <div
                className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <LayoutGrid size={16} strokeWidth={2} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-[15px] text-white leading-tight tracking-tight truncate">
                  WorkTrezz
                </h1>
                <p className="text-[11px] text-white/60 font-medium">Free Plan</p>
              </div>
              <button
                onClick={toggleSidebar}
                className="text-white/60 hover:text-white transition-colors shrink-0"
              >
                <ChevronsUpDown size={15} strokeWidth={2} />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <Menu size={18} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav
        className={`flex-1 overflow-y-auto pt-3 pb-6 space-y-0.5 transition-all duration-300 ${
          isSidebarExpanded ? 'px-3' : 'px-2'
        }`}
        style={{ scrollbarWidth: 'none' }}
      >
        {NAV_ITEMS.map((item) => {
          const isMenuExpanded = expandedMenus.includes(item.name);
          const hasActiveSubItem = item.subItems?.some((sub) => pathname === sub.href);
          const isActive =
            item.href !== '#'
              ? pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              : hasActiveSubItem && !isMenuExpanded;

          const labelClass = `text-[13.5px] font-semibold leading-none whitespace-nowrap transition-all duration-200 overflow-hidden ${
            isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
          }`;

          return (
            <div key={item.name} className="space-y-0.5">
              {item.subItems ? (
                <button
                  onClick={() => isSidebarExpanded && toggleSubmenu(item.name)}
                  className={`w-full flex items-center h-10 transition-all duration-200 ${
                    isSidebarExpanded ? 'px-3 justify-between' : 'px-0 justify-center'
                  } ${!isActive ? 'hover:bg-white/10' : ''}`}
                  style={isActive ? activeItemStyle : inactiveItemStyle}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
                    <span className={labelClass}>{item.name}</span>
                  </div>
                  {isSidebarExpanded && (
                    <div className="transition-transform duration-200 text-white/50 shrink-0">
                      {isMenuExpanded ? (
                        <ChevronDown size={13} strokeWidth={2.5} />
                      ) : (
                        <ChevronRight size={13} strokeWidth={2.5} />
                      )}
                    </div>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  title={!isSidebarExpanded ? item.name : undefined}
                  className={`flex items-center h-10 transition-all duration-200 ${
                    isSidebarExpanded ? 'px-3 justify-between' : 'px-0 justify-center'
                  } ${!isActive ? 'hover:bg-white/10' : ''}`}
                  style={isActive ? activeItemStyle : inactiveItemStyle}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
                    <span className={labelClass}>{item.name}</span>
                  </div>
                  {item.hasChevron && isSidebarExpanded && (
                    <ChevronRight size={13} strokeWidth={2.5} className="text-white/40 shrink-0" />
                  )}
                </Link>
              )}

              {/* Submenu */}
              {isSidebarExpanded && isMenuExpanded && item.subItems && (
                <div className="space-y-0.5 ml-6 border-l border-white/15 pl-2">
                  {item.subItems.map((sub) => {
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className="flex items-center gap-2.5 h-9 px-3 transition-all"
                        style={{
                          borderRadius: '10px',
                          ...(isSubActive
                            ? {
                                background: 'rgba(255,255,255,0.22)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                color: '#ffffff',
                              }
                            : { color: 'rgba(255,255,255,0.65)' }),
                        }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: isSubActive ? '#ffffff' : 'rgba(255,255,255,0.35)' }}
                        />
                        <span className="text-[13px] font-medium whitespace-nowrap">{sub.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle at bottom (collapsed state) */}
      {!isSidebarExpanded && (
        <div className="shrink-0 pb-4 flex justify-center">
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      )}
    </aside>
  );
}
