"use client";

import React from 'react';
import { 
  Users, 
  UserCheck, 
  CalendarMinus, 
  FileText, 
  DollarSign,
  TrendingUp,
  TriangleAlert
} from 'lucide-react';
import { Card } from '@/common/ui';
import { KpiData, ActivityItem, ExpiringContract } from '../types';

const KPI_MOCK_DATA: KpiData[] = [
  { id: '1', label: 'Total Employees', value: '247', icon: Users, iconBgColor: 'bg-[#155dfc]', iconColor: 'text-white' },
  { id: '2', label: 'Present Today', value: '198', icon: UserCheck, iconBgColor: 'bg-[#00a63e]', iconColor: 'text-white' },
  { id: '3', label: 'On Leave Today', value: '12', icon: CalendarMinus, iconBgColor: 'bg-[#ff6b00]', iconColor: 'text-white' },
  { id: '4', label: 'Pending Requests', value: '5', icon: FileText, iconBgColor: 'bg-[#9d4edd]', iconColor: 'text-white' },
  { id: '5', label: 'Monthly Payroll', value: '$1.2M', icon: DollarSign, iconBgColor: 'bg-[#01c9c9]', iconColor: 'text-white' },
];

const RECENT_ACTIVITY_MOCK: ActivityItem[] = [
  { id: '1', user: 'Sarah Johnson', action: 'submitted leave request', timeAgo: '2 minutes ago' },
  { id: '2', user: 'Michael Chen', action: 'clocked in', timeAgo: '15 minutes ago' },
  { id: '3', user: 'Emily Davis', action: 'updated profile', timeAgo: '1 hour ago' },
  { id: '4', user: 'Admin', action: 'approved payroll', timeAgo: '2 hours ago' },
];

const EXPIRING_CONTRACTS_MOCK: ExpiringContract[] = [
  { id: '1', name: 'John Smith', department: 'Engineering', daysLeft: 7 },
  { id: '2', name: 'Alice Brown', department: 'Marketing', daysLeft: 14 },
];

export function AdminDashboardView() {
  return (
    <div className="w-full max-w-[1360px] mx-auto space-y-9 pb-12">
      
      {/* Header section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[32px] font-bold text-[#1a1c23] tracking-tight">Dashboard</h1>
        <p className="text-[14.5px] text-gray-500 font-medium opacity-90">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 xl:gap-6">
        {KPI_MOCK_DATA.map((kpi) => (
          <Card key={kpi.id} className="p-7 flex flex-col justify-between border-0">
            <div className={`w-[44px] h-[44px] rounded-xl flex items-center justify-center mb-5 ${kpi.iconBgColor} shadow-sm`}>
              <kpi.icon size={20} className={kpi.iconColor} strokeWidth={2.5} />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-[26px] font-bold text-[#1a1c23] leading-tight">{kpi.value}</h2>
              <p className="text-[13.5px] text-gray-400 font-semibold tracking-wide uppercase text-[11px]">{kpi.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Middle Row: Trend Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">
        
        {/* Attendance Trend Chart */}
        <Card className="lg:col-span-7 p-8 flex flex-col min-h-[400px] border-0">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[18px] font-bold text-[#1a1c23]">Attendance Trend</h3>
            <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-[#00a63e]" strokeWidth={2.5} />
            </div>
          </div>
          
          {/* Chart Placeholder Box */}
          <div className="flex-1 w-full bg-[#f4fbfa] border border-[#e2f0ee] rounded-[24px] flex items-center justify-center group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-[#00BBA7]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="text-[14.5px] font-semibold text-gray-300 relative z-10 tracking-wide uppercase">Chart Component Here</span>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-5 p-8 flex flex-col border-0">
          <h3 className="text-[18px] font-bold text-[#1a1c23] mb-8">Recent Activity</h3>
          
          <div className="flex-1 space-y-7">
            {RECENT_ACTIVITY_MOCK.map((activity) => (
              <div key={activity.id} className="flex gap-5 relative group">
                <div className="mt-2 w-2 h-2 rounded-full bg-[#155dfc] shrink-0 shadow-[0_0_0_4px_rgba(21,93,252,0.1)] group-hover:scale-125 transition-transform duration-200" />
                <div className="space-y-1">
                  <p className="text-[14px] leading-snug text-gray-600">
                    <span className="font-bold text-[#1a1c23]">{activity.user}</span> <span className="opacity-90">{activity.action}</span>
                  </p>
                  <p className="text-[12.5px] text-gray-400 font-medium tracking-tight">{activity.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* Bottom Row: Expiring Contracts */}
      <div className="bg-[#fff6f6] rounded-[32px] border border-[#fee2e2] p-8 lg:p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#ef4444] flex items-center justify-center shadow-lg shadow-[#ef4444]/20">
            <TriangleAlert size={18} strokeWidth={2.5} className="text-white" />
          </div>
          <h3 className="text-[18px] font-bold text-[#b91c1c]">Expiring Contracts</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          {EXPIRING_CONTRACTS_MOCK.map((contract) => (
            <div 
              key={contract.id} 
              className="bg-white rounded-[20px] p-6 flex items-center justify-between shadow-sm border border-[#fee2e2]/40 hover:border-[#fee2e2] transition-colors"
            >
              <div className="space-y-0.5">
                <h4 className="text-[15.5px] font-bold text-[#1a1c23]">{contract.name}</h4>
                <p className="text-[13.5px] text-gray-500 font-medium opacity-80">{contract.department}</p>
              </div>
              <div className="bg-[#fff1f1] px-5 py-2 rounded-full border border-[#fee2e2] shadow-sm">
                <span className="text-[12.5px] font-bold text-[#ef4444] whitespace-nowrap">{contract.daysLeft} days</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
