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
  X
} from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';

interface SubNavItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
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
      { name: 'Employee List', href: '/dashboard/employees/list' },
      { name: 'Staff List', href: '/dashboard/employees/staff' },
      { name: 'Assign Employees', href: '/dashboard/employees/assign' },
    ],
  },
  { name: 'Attendance', icon: Clock, href: '#', hasChevron: true },
  { name: 'Leave', icon: Calendar, href: '#', hasChevron: true },
  { name: 'Payroll', icon: DollarSign, href: '#', hasChevron: true },
  { name: 'Locations', icon: MapPin, href: '/dashboard/locations' },
  { name: 'Departments', icon: Building2, href: '/dashboard/settings/departments' },
  { name: 'Reports', icon: FileText, href: '#' },
  { name: 'Announcements', icon: Megaphone, href: '#' },
  { name: 'Audit Log', icon: ShieldCheck, href: '#' },
  {
    name: 'Settings',
    icon: Settings,
    href: '/dashboard/settings/company',
    hasChevron: false,
  },
];

// ─── Design tokens ────────────────────────────────────────────────────────────
const SIDEBAR_BG       = 'rgba(43, 127, 255, 0.20)';
const ACTIVE_BG        = 'rgba(0, 201, 80, 0.87)';
const ACTIVE_SHADOW    = '0 4px 14px rgba(0, 201, 80, 0.40)';
const MAIN_TEXT_COLOR  = '#364153';
const SUB_TEXT_COLOR   = '#4A5565';
const BULLET_INACTIVE  = '#99A1AF';
// ──────────────────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarExpanded, toggleSidebar } = useDashboardStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Settings']); // Keep Settings expanded by default for demo

  const toggleSubmenu = (name: string) => {
    setExpandedMenus(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen transition-all duration-300 ease-in-out flex flex-col z-30 shadow-sm ${
        isSidebarExpanded ? 'w-[280px]' : 'w-[80px]'
      }`}
      style={{
        background: SIDEBAR_BG,
        borderRight: '1.26px solid #E5E7EB',
      }}
    >

      {/* Brand logo area / Toggle Area */}
      <div
        className={`h-[64px] flex items-center shrink-0 border-b border-[#E5E7EB] transition-all duration-300 ${
          isSidebarExpanded ? 'px-6 justify-between' : 'px-0 justify-center'
        }`}
        style={{ background: 'rgba(255, 255, 255, 0.5)' }}
      >
        {isSidebarExpanded ? (
          <>
            <h1 className="font-sans font-bold text-[20px] leading-[28px] bg-gradient-to-r from-[#155DFC] to-[#01c951] bg-clip-text text-transparent inline-block whitespace-nowrap">
              WorkNest
            </h1>
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-800 p-1 rounded-lg transition-colors focus:outline-none"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </>
        ) : (
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-xl transition-all"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Nav List — scrollable */}
      <nav
        className={`flex-1 overflow-y-auto pt-6 pb-8 space-y-1 transition-all duration-300 ${
          isSidebarExpanded ? 'px-5' : 'px-3'
        }`}
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(43,127,255,0.15) transparent' }}
      >
        {NAV_ITEMS.map((item) => {
          const isMenuExpanded = expandedMenus.includes(item.name);
          const hasActiveSubItem = item.subItems?.some(sub => pathname === sub.href);
          const isActive =
            pathname === item.href ||
            (item.name === 'Dashboard' && pathname === '/dashboard') ||
            (hasActiveSubItem && !isMenuExpanded);

          // Shared style helpers
          const mainItemStyle: React.CSSProperties = isActive
            ? { background: ACTIVE_BG, boxShadow: ACTIVE_SHADOW, color: '#ffffff', borderRadius: '10px' }
            : { color: MAIN_TEXT_COLOR, borderRadius: '10px' };

          const labelClass = `text-[14px] font-medium leading-[20px] font-[Inter,sans-serif] whitespace-nowrap transition-all duration-300 overflow-hidden ${
            isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
          }`;

          return (
            <div key={item.name} className="space-y-1">
              {item.subItems ? (
                <button
                  onClick={() => isSidebarExpanded && toggleSubmenu(item.name)}
                  className={`w-full flex items-center transition-all duration-300 h-11 ${
                    isSidebarExpanded ? 'px-4 justify-between leading-none' : 'px-0 justify-center'
                  } ${!isActive ? 'hover:bg-white/40' : ''}`}
                  style={mainItemStyle}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1 flex justify-center shrink-0">
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                    </div>
                    <item.icon
                      size={20}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className="shrink-0 transition-colors"
                      style={{ color: isActive ? '#ffffff' : MAIN_TEXT_COLOR }}
                    />
                    <span className={labelClass}>{item.name}</span>
                  </div>

                  {isSidebarExpanded && (
                    <div className="transition-transform duration-200">
                      {isMenuExpanded
                        ? <ChevronDown size={14} strokeWidth={2.5} />
                        : <ChevronRight size={14} strokeWidth={2.5} />}
                    </div>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  title={!isSidebarExpanded ? item.name : undefined}
                  className={`flex items-center transition-all duration-300 h-11 ${
                    isSidebarExpanded ? 'px-4 justify-between leading-none' : 'px-0 justify-center'
                  } ${!isActive ? 'hover:bg-white/40' : ''}`}
                  style={mainItemStyle}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1 flex justify-center shrink-0">
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                    </div>
                    <item.icon
                      size={20}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className="shrink-0 transition-colors"
                      style={{ color: isActive ? '#ffffff' : MAIN_TEXT_COLOR }}
                    />
                    <span className={labelClass}>{item.name}</span>
                  </div>

                  {item.hasChevron && isSidebarExpanded && (
                    <ChevronRight
                      size={14}
                      strokeWidth={2.5}
                      style={{ color: isActive ? 'rgba(255,255,255,0.8)' : '#9CA3AF' }}
                      className="shrink-0"
                    />
                  )}
                </Link>
              )}

              {/* Submenu rendering */}
              {isSidebarExpanded && isMenuExpanded && item.subItems && (
                <div className="space-y-1 mt-1 transition-all duration-300 ml-4 border-l border-gray-200/50">
                  {item.subItems.map((sub) => {
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className="flex items-center gap-3 h-10 px-4 transition-all"
                        style={{
                          borderRadius: '10px',
                          ...(isSubActive
                            ? { background: ACTIVE_BG, boxShadow: ACTIVE_SHADOW, color: '#ffffff' }
                            : { color: SUB_TEXT_COLOR }),
                        }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: isSubActive ? '#ffffff' : BULLET_INACTIVE }}
                        />
                        <span
                          className="text-[14px] font-medium leading-[20px] font-[Inter,sans-serif] whitespace-nowrap"
                        >
                          {sub.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

    </aside>
  );
}
