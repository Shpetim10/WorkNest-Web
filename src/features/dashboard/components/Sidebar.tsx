"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  Users, 
  UserCog, 
  Clock, 
  Calendar, 
  DollarSign, 
  FileText, 
  Megaphone, 
  ShieldCheck, 
  Settings,
  MapPin,
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
  { name: 'Employees', icon: Users, href: '#', hasChevron: true },
  { name: 'Staff Management', icon: UserCog, href: '#', hasChevron: true },
  { name: 'Attendance', icon: Clock, href: '#', hasChevron: true },
  { name: 'Leave', icon: Calendar, href: '#', hasChevron: true },
  { name: 'Payroll', icon: DollarSign, href: '#', hasChevron: true },
  { name: 'Reports', icon: FileText, href: '#' },
  { name: 'Announcements', icon: Megaphone, href: '#' },
  { name: 'Audit Log', icon: ShieldCheck, href: '#' },
  { 
    name: 'Settings', 
    icon: Settings, 
    href: '#', 
    hasChevron: true,
    subItems: [
      { name: 'Company Settings', href: '/dashboard/settings/company' },
      { name: 'Departments', href: '/dashboard/settings/departments' },
    ]
  },
  { name: 'Locations', icon: MapPin, href: '/dashboard/locations' },
];

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
        background: 'linear-gradient(180deg, rgba(153, 204, 204, 0.31) 0%, rgba(194, 255, 218, 0.24) 100%)',
        borderRight: '1.26px solid #E5E7EB'
      }}
    >
      
      {/* Brand logo area / Toggle Area */}
      <div 
        className={`h-[64px] flex items-center shrink-0 border-b border-[#f1f5f9] transition-all duration-300 bg-white ${
          isSidebarExpanded ? 'px-6 justify-between' : 'px-0 justify-center'
        }`}
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

      {/* Nav List */}
      <nav className={`flex-1 overflow-hidden pt-6 pb-8 space-y-1 scrollbar-hide transition-all duration-300 ${
        isSidebarExpanded ? 'px-5' : 'px-3'
      }`}>
        {NAV_ITEMS.map((item) => {
          const isMenuExpanded = expandedMenus.includes(item.name);
          const hasActiveSubItem = item.subItems?.some(sub => pathname === sub.href);
          const isActive = pathname === item.href || (item.name === 'Dashboard' && pathname === '/dashboard') || (hasActiveSubItem && !isMenuExpanded);

          return (
            <div key={item.name} className="space-y-1">
              {item.subItems ? (
                <button
                  onClick={() => isSidebarExpanded && toggleSubmenu(item.name)}
                  className={`w-full flex items-center transition-all duration-300 h-11 rounded-xl ${
                    isSidebarExpanded ? 'px-4 justify-between leading-none' : 'px-0 justify-center'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-[#155DFC] to-[#01c951] text-white shadow-md font-semibold'
                      : 'text-gray-600 hover:bg-white/40 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <item.icon 
                      size={20} 
                      strokeWidth={isActive ? 2.2 : 1.8} 
                      className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-500'}`} 
                    />
                    
                    <span className={`text-[13.5px] whitespace-nowrap transition-all duration-300 overflow-hidden ${
                      isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
                    }`}>
                      {item.name}
                    </span>
                  </div>
                  
                  {isSidebarExpanded && (
                    <div className="transition-transform duration-200">
                      {isMenuExpanded ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
                    </div>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  title={!isSidebarExpanded ? item.name : undefined}
                  className={`flex items-center transition-all duration-300 h-11 rounded-xl ${
                    isSidebarExpanded ? 'px-4 justify-between leading-none' : 'px-0 justify-center'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-[#155DFC] to-[#01c951] text-white shadow-md font-semibold'
                      : 'text-gray-600 hover:bg-white/40 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <item.icon 
                      size={20} 
                      strokeWidth={isActive ? 2.2 : 1.8} 
                      className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-500'}`} 
                    />
                    
                    <span className={`text-[13.5px] whitespace-nowrap transition-all duration-300 overflow-hidden ${
                      isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
                    }`}>
                      {item.name}
                    </span>
                  </div>
                  
                  {item.hasChevron && isSidebarExpanded && (
                    <ChevronRight 
                      size={14} 
                      strokeWidth={2.5} 
                      className={`transition-colors shrink-0 ${isActive ? 'text-white/80' : 'text-gray-400'}`} 
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
                        className={`flex items-center gap-3 h-10 px-4 rounded-xl transition-all ${
                          isSubActive
                            ? 'bg-gradient-to-r from-[#155DFC] to-[#01c951] text-white font-semibold'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-white/30'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-white' : 'bg-gray-300'}`} />
                        <span className="text-[13px] whitespace-nowrap">{sub.name}</span>
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
